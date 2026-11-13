"use client";

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BellRing, CheckCircle2, MessageSquare, Volume2, VolumeX, X, ArrowUpRight } from 'lucide-react';
import { apiFetch, getApiHeaders, getApiUrl } from '@/lib/api';
import {
  initAudioAutoUnlock,
  isNotificationSoundMuted,
  playIncomingMessageSound,
  setNotificationSoundMuted,
  stopNotificationSound,
} from '@/lib/notification-sound';

export interface TelegramNotificationEvent {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  sender: string;
  summary: string;
  text: string | null;
  newStatus: string | null;
  createdAt: string;
}

export default function TelegramLiveToast(): React.JSX.Element | null {
  const pathname = usePathname();
  const [activeToast, setActiveToast] = useState<TelegramNotificationEvent | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const shownIdsRef = useRef<Set<string>>(new Set());
  const baselineReadyRef = useRef<boolean>(false);

  useEffect(() => {
    initAudioAutoUnlock();
    setIsMuted(isNotificationSoundMuted());

    const syncMuteState = (): void => {
      setIsMuted(isNotificationSoundMuted());
    };
    window.addEventListener('nextops:sound-mute-changed', syncMuteState);
    return () => {
      window.removeEventListener('nextops:sound-mute-changed', syncMuteState);
    };
  }, []);

  useEffect(() => {
    if (pathname === '/login' || pathname === '/invite') return;

    let cancelled = false;

    const checkNotifications = async (): Promise<void> => {
      try {
        const res = await apiFetch(getApiUrl('/api/billing/notifications'), {
          headers: getApiHeaders(),
        });
        if (!res.ok || cancelled) return;

        const payload = (await res.json()) as { events?: TelegramNotificationEvent[] };
        const events = Array.isArray(payload.events) ? payload.events : [];

        if (!baselineReadyRef.current) {
          baselineReadyRef.current = true;
          const nowMs = Date.now();
          for (const ev of events) {
            const ageMs = nowMs - new Date(ev.createdAt).getTime();
            // Якщо повідомлення прийшло менше 8 секунд тому — показуємо його одразу!
            if (ageMs >= 0 && ageMs < 8_000) {
              shownIdsRef.current.add(ev.id);
              setActiveToast(ev);
              void playIncomingMessageSound();
            } else {
              shownIdsRef.current.add(ev.id);
            }
          }
          return;
        }

        const freshEvent = events.find((ev) => !shownIdsRef.current.has(ev.id));
        if (freshEvent) {
          for (const ev of events) {
            shownIdsRef.current.add(ev.id);
          }
          setActiveToast(freshEvent);
          void playIncomingMessageSound();
          window.dispatchEvent(new CustomEvent('nextops:telegram-event', { detail: freshEvent }));
        }
      } catch {
        // Ignore transient network errors
      }
    };

    void checkNotifications();
    const timer = window.setInterval(() => {
      void checkNotifications();
    }, 2_500);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [pathname]);

  const handleToggleMute = (): void => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    setNotificationSoundMuted(nextMuted);
    window.dispatchEvent(new Event('nextops:sound-mute-changed'));
  };

  const handleClose = (): void => {
    stopNotificationSound();
    setActiveToast(null);
  };

  if (!activeToast || pathname === '/login' || pathname === '/invite') {
    return null;
  }

  const isOrderAction = activeToast.action === 'TELEGRAM_ORDER_ACTION';
  const targetHref = isOrderAction ? '/order' : '/audit';

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-5 right-5 z-50 w-full max-w-sm rounded-2xl border border-blue-500/40 bg-slate-950/95 p-4 text-slate-100 shadow-2xl backdrop-blur-xl transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30">
            {isOrderAction ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            ) : (
              <MessageSquare className="h-5 w-5 text-sky-400" />
            )}
          </div>
          <div>
            <p className="text-xs font-mono font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
              <BellRing className="h-3.5 w-3.5 animate-bounce" />
              {isOrderAction ? 'Дія із замовленням (Telegram)' : 'Нове повідомлення (Telegram)'}
            </p>
            <p className="text-[11px] font-mono text-slate-400 mt-0.5">{activeToast.sender}</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleToggleMute}
            title={isMuted ? 'Увімкнути звук сповіщень' : 'Вимкнути звук сповіщень'}
            className={`rounded-lg p-1.5 transition cursor-pointer ${
              isMuted
                ? 'text-red-400 bg-red-500/10 hover:bg-red-500/20'
                : 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20'
            }`}
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Закрити сповіщення"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <p className="mt-3 rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2.5 text-xs text-slate-200 leading-relaxed">
        {activeToast.text ?? activeToast.summary}
      </p>

      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-[10px] font-mono text-slate-500">
          {new Date(activeToast.createdAt).toLocaleTimeString('uk-UA', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })}
        </span>
        <Link
          href={targetHref}
          onClick={handleClose}
          className="inline-flex items-center gap-1 rounded-lg bg-blue-600/25 border border-blue-500/40 px-3 py-1.5 text-xs font-mono font-semibold text-blue-200 hover:bg-blue-600/40 transition"
        >
          <span>{isOrderAction ? 'До замовлень' : 'Відкрити журнал'}</span>
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
