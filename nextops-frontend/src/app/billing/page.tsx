"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { apiFetch, getApiHeaders, getApiUrl } from '@/lib/api';
import { ApiErrorBanner } from '@/components/common/collection-controls';
import { useWorkspace } from '@/context/WorkspaceContext';
import {
  isNotificationSoundMuted,
  setNotificationSoundMuted,
} from '@/lib/notification-sound';
import {
  CheckCircle2,
  CreditCard,
  Sparkles,
  Users,
  Box,
  Send,
  Volume2,
  VolumeX,
  Key,
  Copy,
  Check,
  Trash2,
  Plus,
} from 'lucide-react';

interface PlanItem {
  code: string;
  name: string;
  priceMinor: number;
  currency: string;
  maxUsers: number;
  maxProducts: number;
  isActive: boolean;
}

interface WorkspaceBillingSnapshot {
  companyId: string;
  companyName: string;
  planCode: string;
  planName: string;
  priceMinor: number;
  currency: string;
  subscriptionStatus: string;
  currentPeriodEnd: string | null;
  maxUsers: number;
  usedSeats: number;
  maxProducts: number;
  usedProducts: number;
}

interface BillingStatusResponse {
  billing: WorkspaceBillingSnapshot;
  plans: PlanItem[];
  providerConfigured: boolean;
  telegram?: {
    connected: boolean;
    chatId: string | null;
    maskedToken: string | null;
  };
}

interface ApiKeySummary {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  isActive: boolean;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

interface ApiKeyQuotaSummary {
  used: number;
  limit: number;
  planCode: string;
}

export default function BillingPage(): React.JSX.Element {
  const { refreshWorkspace } = useWorkspace();
  const refreshWorkspaceRef = useRef(refreshWorkspace);
  refreshWorkspaceRef.current = refreshWorkspace;

  const [statusData, setStatusData] = useState<BillingStatusResponse | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKeySummary[]>([]);
  const [apiKeyQuota, setApiKeyQuota] = useState<ApiKeyQuotaSummary | null>(null);
  const [newKeyName, setNewKeyName] = useState<string>('');
  const [newKeyExpiresInDays, setNewKeyExpiresInDays] = useState<string>('90');
  const [revealedRawKey, setRevealedRawKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<boolean>(false);
  const [creatingKey, setCreatingKey] = useState<boolean>(false);
  const [revokingKeyId, setRevokingKeyId] = useState<string | null>(null);

  const [isSoundMuted, setIsSoundMuted] = useState<boolean>(false);
  const [tgTokenInput, setTgTokenInput] = useState<string>('');
  const [tgChatIdInput, setTgChatIdInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [submittingPlan, setSubmittingPlan] = useState<string | null>(null);
  const [savingTelegram, setSavingTelegram] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadApiKeys = useCallback(async (): Promise<void> => {
    try {
      const res = await apiFetch(getApiUrl('/api/api-keys'), {
        headers: getApiHeaders(),
      });
      if (res.ok) {
        const data = (await res.json()) as {
          keys?: ApiKeySummary[];
          quota?: ApiKeyQuotaSummary;
        };
        setApiKeys(Array.isArray(data.keys) ? data.keys : []);
        if (data.quota) {
          setApiKeyQuota(data.quota);
        }
      }
    } catch {
      // Ignore if current user role does not have key management permissions
    }
  }, []);

  const loadBilling = useCallback(
    async (silent = false): Promise<void> => {
      if (!silent) {
        setLoading(true);
      }
      setError(null);
      try {
        const [resStatus] = await Promise.all([
          apiFetch(getApiUrl('/api/billing/status'), {
            headers: getApiHeaders(),
          }),
          loadApiKeys(),
        ]);

        if (!resStatus.ok) {
          setError(`Не вдалося завантажити статус підписки (HTTP ${resStatus.status}).`);
          return;
        }
        const payload = (await resStatus.json()) as BillingStatusResponse;
        setStatusData(payload);
        if (payload.telegram?.chatId) {
          setTgChatIdInput(payload.telegram.chatId);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Помилка мережі при завантаженні білінгу.');
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [loadApiKeys],
  );

  useEffect(() => {
    setIsSoundMuted(isNotificationSoundMuted());

    const syncMuteState = (): void => {
      setIsSoundMuted(isNotificationSoundMuted());
    };
    window.addEventListener('nextops:sound-mute-changed', syncMuteState);

    const params = new URLSearchParams(window.location.search);
    const checkoutState = params.get('checkout');
    const activatedPlan = params.get('plan');

    if (checkoutState === 'success') {
      setNotice(
        activatedPlan
          ? `Оплату підтверджено! Тариф успішно активовано до ${activatedPlan.toUpperCase()}.`
          : 'Оплату підтверджено! Ваш тарифний план оновлено.',
      );
      window.history.replaceState({}, '', '/billing');
      void refreshWorkspaceRef.current();
    } else if (checkoutState === 'canceled') {
      setError('Оплату скасовано. Ви можете обрати тариф повторно у будь-який момент.');
      window.history.replaceState({}, '', '/billing');
    }

    void loadBilling(false);

    return () => {
      window.removeEventListener('nextops:sound-mute-changed', syncMuteState);
    };
  }, [loadBilling]);

  const handleSelectPlan = async (planCode: string): Promise<void> => {
    setSubmittingPlan(planCode);
    setError(null);
    setNotice(null);
    try {
      const res = await apiFetch(getApiUrl('/api/billing/checkout'), {
        method: 'POST',
        headers: getApiHeaders(true),
        body: JSON.stringify({ planCode }),
      });

      const payload = (await res.json()) as { checkoutUrl?: string; message?: string };
      if (!res.ok) {
        setError(payload.message ?? `Не вдалося оформити підписку (HTTP ${res.status}).`);
        return;
      }

      if (payload.checkoutUrl) {
        if (payload.checkoutUrl.includes('upgraded=FREE')) {
          setNotice('Тарифний план успішно оновлено до Starter Free.');
          await Promise.all([loadBilling(true), refreshWorkspaceRef.current()]);
        } else {
          window.location.href = payload.checkoutUrl;
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Помилка створення сесії оплати.');
    } finally {
      setSubmittingPlan(null);
    }
  };

  const handleSaveTelegram = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    const botToken = tgTokenInput.trim();
    const chatId = tgChatIdInput.trim();

    if (!chatId) {
      setError('Вкажіть ваш Telegram Chat ID.');
      return;
    }

    if (!botToken && !statusData?.telegram?.connected) {
      setError('Вкажіть токен власного бота, отриманий у @BotFather.');
      return;
    }

    setSavingTelegram(true);
    setError(null);
    setNotice(null);
    try {
      const res = await apiFetch(getApiUrl('/api/billing/telegram'), {
        method: 'POST',
        headers: getApiHeaders(true),
        body: JSON.stringify({ botToken, chatId }),
      });

      const body = (await res.json()) as { message?: string };
      if (!res.ok) {
        setError(body.message ?? 'Не вдалося перевірити підключення Telegram-бота.');
        return;
      }

      setTgTokenInput('');
      setNotice('Тестове повідомлення успішно надіслано у ваш Telegram!');
      await loadBilling(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Помилка мережі при налаштуванні Telegram.');
    } finally {
      setSavingTelegram(false);
    }
  };

  const handleCreateApiKey = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    const trimmedName = newKeyName.trim();
    if (!trimmedName) {
      setError('Вкажіть назву підключення (наприклад, "Інтернет-магазин на телефоні").');
      return;
    }

    setCreatingKey(true);
    setError(null);
    setNotice(null);
    setRevealedRawKey(null);
    setCopiedKey(false);

    const parsedDays = Number(newKeyExpiresInDays);
    const requestPayload: {
      name: string;
      scopes: string[];
      expiresInDays?: number;
    } = {
      name: trimmedName,
      scopes: ['read:products', 'write:orders', 'write:reviews'],
    };

    if (Number.isInteger(parsedDays) && parsedDays > 0) {
      requestPayload.expiresInDays = parsedDays;
    }

    try {
      const res = await apiFetch(getApiUrl('/api/api-keys'), {
        method: 'POST',
        headers: getApiHeaders(true),
        body: JSON.stringify(requestPayload),
      });

      const payload = (await res.json()) as { apiKey?: string; message?: string };
      if (!res.ok || !payload.apiKey) {
        setError(payload.message ?? `Не вдалося створити API-ключ (HTTP ${res.status}).`);
        return;
      }

      setRevealedRawKey(payload.apiKey);
      setNewKeyName('');
      setNotice('Новий API-ключ створено! Скопіюйте його зараз — повторно він не відображатиметься.');
      await loadApiKeys();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Помилка мережі при створенні API-ключа.');
    } finally {
      setCreatingKey(false);
    }
  };

  const handleRevokeApiKey = async (keyId: string): Promise<void> => {
    if (!window.confirm('Відкликати цей API-ключ? Зовнішні сайти з цим ключем миттєво втратять доступ.')) {
      return;
    }

    setRevokingKeyId(keyId);
    setError(null);
    setNotice(null);
    try {
      const res = await apiFetch(getApiUrl(`/api/api-keys/${encodeURIComponent(keyId)}`), {
        method: 'DELETE',
        headers: getApiHeaders(),
      });
      if (!res.ok) {
        setError(`Не вдалося відкликати ключ (HTTP ${res.status}).`);
        return;
      }
      setNotice('API-ключ успішно відкликано, кеш Redis очищено.');
      await loadApiKeys();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Помилка мережі при відкликанні ключа.');
    } finally {
      setRevokingKeyId(null);
    }
  };

  const billing = statusData?.billing;
  const seatPercent = billing
    ? Math.min(100, Math.round((billing.usedSeats / Math.max(1, billing.maxUsers)) * 100))
    : 0;
  const productPercent = billing
    ? Math.min(100, Math.round((billing.usedProducts / Math.max(1, billing.maxProducts)) * 100))
    : 0;

  return (
    <div className="space-y-6 font-sans">
      <div className="bg-gray-950/40 backdrop-blur-md p-6 border border-white/10 rounded-xl shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white font-mono flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-400" />
              Тарифи, API-ключі та інтеграції платформи
            </h1>
            <p className="text-sm text-gray-400 font-mono mt-1">
              Керування планом робочого простору, підключенням зовнішніх вітрин по X-Api-Key та Telegram
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {statusData && (
              <span className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold font-mono text-blue-300">
                {statusData.providerConfigured ? 'Stripe Checkout' : 'Sandbox Demo Checkout'}
              </span>
            )}
            {billing && (
              <span
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold font-mono ${billing.subscriptionStatus === 'ACTIVE' || billing.subscriptionStatus === 'TRIALING'
                  ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300'
                  : 'border-red-500/30 bg-red-500/15 text-red-300'
                  }`}
              >
                Статус: {billing.subscriptionStatus}
              </span>
            )}
          </div>
        </div>
      </div>

      <ApiErrorBanner error={error} onDismiss={() => setError(null)} />

      {notice && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/40 backdrop-blur-md px-4 py-3 text-sm text-emerald-300 font-mono">
          ● {notice}
        </div>
      )}

      {loading ? (
        <div className="bg-gray-950/40 backdrop-blur-md border border-white/10 rounded-xl p-8 text-center text-gray-400 text-sm font-mono shadow-2xl">
          Завантаження інформації про тариф...
        </div>
      ) : billing && statusData ? (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="bg-gray-950/40 backdrop-blur-md border border-white/10 rounded-xl p-5 shadow-2xl font-mono">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span className="flex items-center gap-1.5 uppercase">
                  <Users className="h-4 w-4 text-blue-400" />
                  Командні місця (користувачі + інвайти)
                </span>
                <span className="text-white font-semibold">
                  {billing.usedSeats} / {billing.maxUsers}
                </span>
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-900">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all"
                  style={{ width: `${seatPercent}%` }}
                />
              </div>
            </div>

            <div className="bg-gray-950/40 backdrop-blur-md border border-white/10 rounded-xl p-5 shadow-2xl font-mono">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span className="flex items-center gap-1.5 uppercase">
                  <Box className="h-4 w-4 text-emerald-400" />
                  Каталог товарів
                </span>
                <span className="text-white font-semibold">
                  {billing.usedProducts} / {billing.maxProducts}
                </span>
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-900">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${productPercent}%` }}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {statusData.plans.map((plan) => {
              const isCurrent = plan.code === billing.planCode;
              const priceFormatted =
                plan.priceMinor === 0
                  ? 'Безкоштовно'
                  : `$${(plan.priceMinor / 100).toFixed(2)} / міс`;

              return (
                <div
                  key={plan.code}
                  className={`flex flex-col justify-between rounded-xl border p-6 backdrop-blur-md shadow-2xl font-mono transition ${isCurrent
                    ? 'border-blue-500/60 bg-blue-950/20'
                    : 'border-white/10 bg-gray-950/40 hover:border-white/20'
                    }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase tracking-wider text-blue-400">
                        {plan.code}
                      </span>
                      {isCurrent && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-blue-500/20 px-2 py-0.5 text-[11px] text-blue-300">
                          <Sparkles className="h-3 w-3" /> Поточний план
                        </span>
                      )}
                    </div>

                    <h2 className="mt-2 text-lg font-bold text-white">{plan.name}</h2>
                    <p className="mt-3 text-2xl font-bold text-emerald-400">{priceFormatted}</p>

                    <ul className="mt-5 space-y-2.5 text-xs text-gray-300 border-t border-white/10 pt-4">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                        До {plan.maxUsers.toLocaleString()} учасників команди
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                        До {plan.maxProducts.toLocaleString()} товарів у каталозі
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                        Повна ізоляція даних PostgreSQL RLS
                      </li>
                    </ul>
                  </div>

                  <button
                    type="button"
                    disabled={isCurrent || submittingPlan !== null}
                    onClick={() => void handleSelectPlan(plan.code)}
                    className={`mt-6 w-full rounded-lg border px-4 py-2.5 text-xs font-semibold transition cursor-pointer ${isCurrent
                      ? 'border-white/10 bg-white/5 text-gray-400 cursor-default'
                      : 'border-blue-500 bg-blue-600/30 text-blue-200 hover:bg-blue-600/50 disabled:opacity-40'
                      }`}
                  >
                    {isCurrent
                      ? 'Активний тариф'
                      : submittingPlan === plan.code
                        ? 'Підготовка оплати...'
                        : `Перейти на ${plan.name}`}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="bg-gray-950/40 backdrop-blur-md border border-white/10 rounded-xl p-6 shadow-2xl font-mono space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Key className="h-4 w-4 text-amber-400" />
                  API-ключі для підключення зовнішніх вітрин (X-Api-Key)
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Використовуйте заголовок X-Api-Key для підключення інтернет-магазинів і мобільних застосунків до /api/public/v1/*
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {apiKeyQuota && (
                  <span className="rounded-lg border border-amber-500/30 bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-300">
                    Ключів: {apiKeyQuota.used} / {apiKeyQuota.limit} ({apiKeyQuota.planCode})
                  </span>
                )}
                <span className="rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">
                  SHA-256 + Redis Cache + RLS
                </span>
              </div>
            </div>
            <form
              onSubmit={(e) => void handleCreateApiKey(e)}
              className="grid grid-cols-1 gap-4 md:grid-cols-4 items-end"
            >
              <div className="md:col-span-2">
                <label htmlFor="new-api-key-name" className="block text-xs text-gray-400 mb-1.5">
                  Назва інтеграції або магазину
                </label>
                <input
                  id="new-api-key-name"
                  name="apiKeyName"
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="Напр. Storefront Web & Mobile App #1"
                  className="w-full rounded-lg border border-white/10 bg-gray-900/70 px-3 py-2 text-xs text-white placeholder-gray-500 outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label htmlFor="new-api-key-ttl" className="block text-xs text-gray-400 mb-1.5">
                  Термін дії (ротація)
                </label>
                <select
                  id="new-api-key-ttl"
                  name="apiKeyExpiresInDays"
                  value={newKeyExpiresInDays}
                  onChange={(e) => setNewKeyExpiresInDays(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-gray-900/70 px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                >
                  <option value="30">30 днів</option>
                  <option value="90">90 днів (SOC2 стандарт)</option>
                  <option value="365">1 рік (365 днів)</option>
                  <option value="0">Безстроково</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={creatingKey}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-amber-500/50 bg-amber-500/20 px-4 py-2 text-xs font-semibold text-amber-200 hover:bg-amber-500/30 transition cursor-pointer disabled:opacity-40"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>{creatingKey ? 'Генерація...' : 'Згенерувати API-ключ'}</span>
              </button>
            </form>

            {revealedRawKey && (
              <div className="rounded-xl border border-amber-500/40 bg-amber-950/30 p-4 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-amber-300">
                    ⚠️ Скопіюйте ваш секретний API-ключ зараз (він більше не показуватиметься):
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard.writeText(revealedRawKey);
                      setCopiedKey(true);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/50 bg-amber-500/20 px-3 py-1 text-xs font-semibold text-white hover:bg-amber-500/30 cursor-pointer"
                  >
                    {copiedKey ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedKey ? 'Скопійовано!' : 'Скопіювати ключ'}</span>
                  </button>
                </div>
                <code className="block w-full overflow-x-auto rounded-lg bg-black/50 px-3 py-2 text-xs text-emerald-300 select-all">
                  {revealedRawKey}
                </code>
              </div>
            )}

            {apiKeys.length > 0 && (
              <div className="overflow-x-auto border border-white/10 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/10 bg-gray-900/40 text-gray-400">
                      <th className="p-3">Назва</th>
                      <th className="p-3">Префікс ключа</th>
                      <th className="p-3">Дозволи (Scopes)</th>
                      <th className="p-3">Діє до</th>
                      <th className="p-3">Останнє використання</th>
                      <th className="p-3 text-right">Дія</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10 text-gray-200">
                    {apiKeys.map((item) => {
                      const isExpired =
                        item.expiresAt !== null && new Date(item.expiresAt).getTime() <= Date.now();
                      return (
                        <tr key={item.id} className="hover:bg-white/5">
                          <td className="p-3 font-semibold text-white">{item.name}</td>
                          <td className="p-3 text-amber-300">{item.prefix}••••••••</td>
                          <td className="p-3 text-gray-400">{item.scopes.join(', ')}</td>
                          <td className="p-3">
                            {item.expiresAt ? (
                              <span className={isExpired ? 'text-red-400 font-semibold' : 'text-gray-300'}>
                                {new Date(item.expiresAt).toLocaleDateString()}
                                {isExpired ? ' (Прострочено)' : ''}
                              </span>
                            ) : (
                              <span className="text-gray-500">Безстроково</span>
                            )}
                          </td>
                          <td className="p-3 text-gray-400">
                            {item.lastUsedAt
                              ? new Date(item.lastUsedAt).toLocaleString()
                              : 'Ще не використовувався'}
                          </td>
                          <td className="p-3 text-right">
                            <button
                              type="button"
                              disabled={revokingKeyId === item.id}
                              onClick={() => void handleRevokeApiKey(item.id)}
                              className="inline-flex items-center gap-1 rounded border border-red-500/30 bg-red-500/15 px-2.5 py-1 text-red-300 hover:bg-red-500/25 cursor-pointer disabled:opacity-40"
                            >
                              <Trash2 className="h-3 w-3" />
                              <span>Відкликати</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="bg-gray-950/40 backdrop-blur-md border border-white/10 rounded-xl p-6 shadow-2xl font-mono space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Send className="h-4 w-4 text-sky-400" />
                  Миттєві сповіщення в Telegram та зворотний зв&apos;язок
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Вкажіть токен бота від @BotFather та Chat ID — чеки замовлень летять у телефон, а вхідні повідомлення спливають на екрані
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const nextMuted = !isSoundMuted;
                    setIsSoundMuted(nextMuted);
                    setNotificationSoundMuted(nextMuted);
                    window.dispatchEvent(new Event('nextops:sound-mute-changed'));
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-semibold transition cursor-pointer ${isSoundMuted
                    ? 'border-red-500/30 bg-red-500/15 text-red-300 hover:bg-red-500/25'
                    : 'border-blue-500/30 bg-blue-500/15 text-blue-300 hover:bg-blue-500/25'
                    }`}
                >
                  {isSoundMuted ? (
                    <>
                      <VolumeX className="h-3.5 w-3.5" />
                      <span>Без звуку</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="h-3.5 w-3.5" />
                      <span>Звук сповіщень увімкнено</span>
                    </>
                  )}
                </button>
                <span
                  className={`rounded-lg border px-3 py-1 text-xs font-semibold ${statusData.telegram?.connected
                    ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300'
                    : 'border-white/10 bg-white/5 text-gray-400'
                    }`}
                >
                  {statusData.telegram?.connected
                    ? `● Підключено (Chat: ${statusData.telegram.chatId})`
                    : '○ Не налаштовано'}
                </span>
              </div>
            </div>

            <form
              onSubmit={(e) => void handleSaveTelegram(e)}
              className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3 items-end"
            >
              <div>
                <label htmlFor="telegram-bot-token-input" className="block text-xs text-gray-400 mb-1.5">
                  Telegram Bot Token
                </label>
                <input
                  id="telegram-bot-token-input"
                  name="telegramBotToken"
                  type="password"
                  autoComplete="new-password"
                  value={tgTokenInput}
                  onChange={(e) => setTgTokenInput(e.target.value)}
                  placeholder={statusData.telegram?.maskedToken ?? '123456789:AAH...'}
                  className="w-full rounded-lg border border-white/10 bg-gray-900/70 px-3 py-2 text-xs text-white placeholder-gray-500 outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="telegram-chat-id-input" className="block text-xs text-gray-400 mb-1.5">
                  Telegram Chat ID
                </label>
                <input
                  id="telegram-chat-id-input"
                  name="telegramChatId"
                  type="text"
                  value={tgChatIdInput || statusData.telegram?.chatId || ''}
                  onChange={(e) => setTgChatIdInput(e.target.value)}
                  placeholder="Напр. 384920194 або -100..."
                  className="w-full rounded-lg border border-white/10 bg-gray-900/70 px-3 py-2 text-xs text-white placeholder-gray-500 outline-none focus:border-blue-500"
                />
              </div>
              <button
                type="submit"
                disabled={savingTelegram}
                className="rounded-lg border border-blue-500 bg-blue-600/30 px-4 py-2 text-xs font-semibold text-blue-200 hover:bg-blue-600/50 transition cursor-pointer disabled:opacity-40"
              >
                {savingTelegram ? 'Перевірка бота...' : 'Зберегти та надіслати тест'}
              </button>
            </form>
          </div>
        </>
      ) : null}
    </div>
  );
}
