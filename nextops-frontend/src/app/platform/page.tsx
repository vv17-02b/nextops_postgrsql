"use client";

import React, { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  Ban,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Crown,
  Gift,
  RefreshCw,
  Search,
  ShieldAlert,
  ShoppingCart,
  Sparkles,
  Trash2,
  Users,
} from 'lucide-react';
import { apiFetch, getApiHeaders, getApiUrl } from '@/lib/api';
import { ApiErrorBanner } from '@/components/common/collection-controls';

interface PlatformCompanyItem {
  id: string;
  name: string;
  planCode: string;
  subscriptionStatus: string;
  currentPeriodEnd: string | null;
  createdAt: string;
  ownerEmail: string | null;
  ownerName: string | null;
  usersCount: number;
  ordersCount: number;
  productsCount: number;
  isProtectedPlatformCompany: boolean;
}

interface PlatformOverviewResponse {
  summary: {
    totalCompanies: number;
    paidCompanies: number;
    freeCompanies: number;
    emptyCompanies: number;
    suspendedOrPastDueCompanies: number;
    totalUsers: number;
    totalOrders: number;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  companies: PlatformCompanyItem[];
}

type CompanyFilter = 'ALL' | 'PAID' | 'EMPTY' | 'BLOCKED';
function getPaymentHealthBadge(company: PlatformCompanyItem): {
  label: string;
  tone: 'emerald' | 'amber' | 'rose' | 'slate' | 'crown';
} {
  if (company.isProtectedPlatformCompany) {
    return { label: '👑 Власник SaaS-платформи (ROOT · Безліміт)', tone: 'crown' };
  }

  const nowMs = Date.now();
  const periodEndMs = company.currentPeriodEnd ? new Date(company.currentPeriodEnd).getTime() : null;
  const dayMs = 24 * 60 * 60 * 1000;

  if (company.subscriptionStatus === 'SUSPENDED') {
    return { label: '⛔ Заблоковано вручну (доступ закрито)', tone: 'rose' };
  }

  if (
    company.subscriptionStatus === 'PAST_DUE' ||
    company.subscriptionStatus === 'CANCELED' ||
    (company.planCode !== 'FREE' && periodEndMs !== null && periodEndMs < nowMs)
  ) {
    const overdueDays = periodEndMs ? Math.max(1, Math.floor((nowMs - periodEndMs) / dayMs)) : 1;
    const daysLeft = Math.max(0, 30 - overdueDays);
    return {
      label: `🔴 Прострочено ${overdueDays} дн. (до автовидалення: ${daysLeft} дн.)`,
      tone: 'rose',
    };
  }

  if (company.planCode !== 'FREE') {
    if (periodEndMs !== null) {
      const daysLeft = Math.max(0, Math.ceil((periodEndMs - nowMs) / dayMs));
      return {
        label: `🟢 Оплачено (${company.planCode}) · залишилось ${daysLeft} дн.`,
        tone: 'emerald',
      };
    }
    return { label: `🟢 Активний платний тариф (${company.planCode})`, tone: 'emerald' };
  }

  if (company.usersCount === 0 || (company.ordersCount === 0 && company.productsCount === 0)) {
    return { label: '⚪ Порожній акаунт · без оплат і замовлень', tone: 'slate' };
  }

  return { label: '🟡 Безкоштовний тариф (FREE) · працює в межах ліміту', tone: 'amber' };
}

export default function PlatformOwnerControlPage(): React.JSX.Element {
  const [overview, setOverview] = useState<PlatformOverviewResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [cleaningEmpty, setCleaningEmpty] = useState<boolean>(false);
  const [busyCompanyId, setBusyCompanyId] = useState<string | null>(null);
  const [filter, setFilter] = useState<CompanyFilter>('ALL');
  const [searchInput, setSearchInput] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(15);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setDebouncedSearch(searchInput.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const loadOverview = useCallback(
    async (silent = false): Promise<void> => {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
          filter,
        });
        if (debouncedSearch) {
          params.set('search', debouncedSearch);
        }

        const res = await apiFetch(getApiUrl(`/api/platform/companies?${params.toString()}`), {
          headers: getApiHeaders(),
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { message?: string };
          setError(body.message ?? `Доступ заборонено або помилка сервера (HTTP ${res.status}).`);
          return;
        }
        const payload = (await res.json()) as PlatformOverviewResponse;
        setOverview(payload);
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : 'Помилка мережі при завантаженні списку компаній.',
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, limit, filter, debouncedSearch],
  );

  useEffect(() => {
    void loadOverview(false);
  }, [loadOverview]);

  const handleCleanupEmpty = async (): Promise<void> => {
    const emptyTotal = overview?.summary.emptyCompanies ?? 0;
    const confirmed = window.confirm(
      `Очистити всі порожні безкоштовні акаунти (без товарів і замовлень), створені понад 7 днів тому?\n\nУсього порожніх кандидатів у базі: ${emptyTotal}.`,
    );
    if (!confirmed) return;

    setCleaningEmpty(true);
    setError(null);
    setNotice(null);
    try {
      const res = await apiFetch(getApiUrl('/api/platform/companies/cleanup-empty'), {
        method: 'POST',
        headers: getApiHeaders(true),
        body: JSON.stringify({ olderThanDays: 7 }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(body.message ?? `Не вдалося виконати очищення (HTTP ${res.status}).`);
      }
      const data = (await res.json()) as { deletedCount: number };
      setNotice(`Очищення завершено: видалено ${data.deletedCount} порожніх акаунтів.`);
      await loadOverview(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Помилка масового очищення.');
    } finally {
      setCleaningEmpty(false);
    }
  };
  const handleSuspend = async (company: PlatformCompanyItem): Promise<void> => {
    if (
      !window.confirm(
        `Заблокувати компанію "${company.name}" (${company.ownerEmail ?? 'без email'})? Усі її користувачі миттєво втратять доступ, а API-ключі зупиняться.`,
      )
    ) {
      return;
    }

    setBusyCompanyId(company.id);
    setError(null);
    setNotice(null);
    try {
      const res = await apiFetch(
        getApiUrl(`/api/platform/companies/${encodeURIComponent(company.id)}/suspend`),
        {
          method: 'POST',
          headers: getApiHeaders(),
        },
      );
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(body.message ?? `Не вдалося заблокувати компанію (HTTP ${res.status}).`);
      }
      setNotice(`Компанію "${company.name}" заблоковано, сесії користувачів скинуто.`);
      await loadOverview(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Помилка блокування компанії.');
    } finally {
      setBusyCompanyId(null);
    }
  };

  const handleActivate = async (
    company: PlatformCompanyItem,
    planCode: string,
    days?: number,
  ): Promise<void> => {
    setBusyCompanyId(company.id);
    setError(null);
    setNotice(null);
    try {
      const res = await apiFetch(
        getApiUrl(`/api/platform/companies/${encodeURIComponent(company.id)}/activate`),
        {
          method: 'POST',
          headers: getApiHeaders(true),
          body: JSON.stringify({ planCode, ...(days ? { days } : {}) }),
        },
      );
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(body.message ?? `Не вдалося активувати компанію (HTTP ${res.status}).`);
      }
      setNotice(
        days
          ? `Компанію "${company.name}" активовано на ${days} днів (${planCode}).`
          : `Компанію "${company.name}" підключено безкоштовно на тариф ${planCode}.`,
      );
      await loadOverview(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Помилка активації компанії.');
    } finally {
      setBusyCompanyId(null);
    }
  };

  const handleDeletePermanently = async (company: PlatformCompanyItem): Promise<void> => {
    const confirmed = window.confirm(
      `Видалити компанію "${company.name}" (${company.ownerEmail ?? 'без email'}) назавжди?\n\nБуде знищено безповоротно: користувачів (${company.usersCount}), товарів (${company.productsCount}), замовлень (${company.ordersCount}).`,
    );
    if (!confirmed) return;

    setBusyCompanyId(company.id);
    setError(null);
    setNotice(null);
    try {
      const res = await apiFetch(
        getApiUrl(`/api/platform/companies/${encodeURIComponent(company.id)}`),
        {
          method: 'DELETE',
          headers: getApiHeaders(),
        },
      );
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(body.message ?? `Не вдалося видалити компанію (HTTP ${res.status}).`);
      }
      setNotice(`Компанію "${company.name}" та її власника повністю видалено з бази.`);
      await loadOverview(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Помилка видалення компанії.');
    } finally {
      setBusyCompanyId(null);
    }
  };
  const companies = overview?.companies ?? [];
  const pagination = overview?.pagination ?? { page: 1, limit: 15, total: 0, totalPages: 1 };
  const startItem = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const endItem = Math.min(pagination.total, pagination.page * pagination.limit);

  return (
    <div className="bg-custom-way p-4 md:p-6 space-y-6 font-sans w-full min-h-[calc(100vh-2rem)]">
      <div className="bg-gray-950/50 backdrop-blur-xl p-6 rounded-2xl border border-white/10 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] font-mono text-amber-300">
            <Activity className="h-3.5 w-3.5 text-amber-400" />
            <span>PLATFORM OWNER CONTROL · ROOT SAAS</span>
          </div>
          <h1 className="text-xl font-bold text-white font-mono">
            Управління компаніями та серверами клієнтів
          </h1>
          <p className="text-xs text-gray-400 font-mono">
            Масштабований реєстр із серверною пагінацією PostgreSQL, автоочищенням прострочених (&gt;30 дн.) та порожніх (&gt;14 дн.) акаунтів.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            disabled={cleaningEmpty || (overview?.summary.emptyCompanies ?? 0) === 0}
            onClick={() => void handleCleanupEmpty()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-600/20 px-3.5 py-2 text-xs font-mono text-rose-200 hover:bg-rose-600/35 transition cursor-pointer disabled:opacity-40"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>
              {cleaningEmpty
                ? 'Очищення...'
                : `Очистити порожні (${overview?.summary.emptyCompanies ?? 0})`}
            </span>
          </button>

          <button
            type="button"
            disabled={refreshing}
            onClick={() => void loadOverview(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-mono text-gray-200 hover:bg-white/10 transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-blue-400' : ''}`} />
            <span>{refreshing ? 'Оновлення...' : 'Оновити табло'}</span>
          </button>
        </div>
      </div>

      <ApiErrorBanner error={error} onDismiss={() => setError(null)} />

      {notice && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/40 backdrop-blur-md px-4 py-3 text-sm text-emerald-300 font-mono">
          ● {notice}
        </div>
      )}

      {overview && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
          <div className="bg-gray-950/50 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>УСЬОГО КОМПАНІЙ</span>
              <Building2 className="h-4 w-4 text-blue-400" />
            </div>
            <div className="mt-2 text-2xl font-extrabold text-white">
              {overview.summary.totalCompanies}
            </div>
            <div className="mt-1 text-[11px] text-emerald-400">
              Платних: {overview.summary.paidCompanies} · Free: {overview.summary.freeCompanies}
            </div>
          </div>

          <div className="bg-gray-950/50 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>ЗАБАНЕНІ / ПРОСТРОЧЕНІ</span>
              <ShieldAlert className="h-4 w-4 text-rose-400" />
            </div>
            <div className="mt-2 text-2xl font-extrabold text-rose-300">
              {overview.summary.suspendedOrPastDueCompanies}
            </div>
            <div className="mt-1 text-[11px] text-gray-400">
              Автовидалення через 30 днів несплати
            </div>
          </div>

          <div className="bg-gray-950/50 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>КОРИСТУВАЧІВ НА СЕРВЕРІ</span>
              <Users className="h-4 w-4 text-cyan-400" />
            </div>
            <div className="mt-2 text-2xl font-extrabold text-white">
              {overview.summary.totalUsers}
            </div>
            <div className="mt-1 text-[11px] text-gray-400">Усі акаунти всіх компаній</div>
          </div>

          <div className="bg-gray-950/50 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>ЗАМОВЛЕНЬ ПО ПЛАТФОРМІ</span>
              <ShoppingCart className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="mt-2 text-2xl font-extrabold text-white">
              {overview.summary.totalOrders}
            </div>
            <div className="mt-1 text-[11px] text-gray-400">Сумарно по всіх магазинах</div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
        <div className="flex flex-wrap gap-2">
          {(
            [
              { id: 'ALL', label: `Усі (${overview?.summary.totalCompanies ?? 0})` },
              { id: 'PAID', label: `Платять / Активні (${overview?.summary.paidCompanies ?? 0})` },
              { id: 'EMPTY', label: `Порожні кандидати (${overview?.summary.emptyCompanies ?? 0})` },
              {
                id: 'BLOCKED',
                label: `Забанені / Прострочені (${overview?.summary.suspendedOrPastDueCompanies ?? 0})`,
              },
            ] as Array<{ id: CompanyFilter; label: string }>
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setPage(1);
                setFilter(tab.id);
              }}
              className={`px-3.5 py-2 rounded-xl border transition cursor-pointer ${
                filter === tab.id
                  ? 'border-blue-500/60 bg-blue-600/30 text-white font-semibold'
                  : 'border-white/10 bg-gray-950/40 text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="h-3.5 w-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Пошук у базі за назвою або email..."
            className="w-full pl-9 pr-3 py-2 text-xs font-mono"
          />
        </div>
      </div>
      {loading && !overview ? (
        <div className="bg-gray-950/40 backdrop-blur-md border border-white/10 rounded-2xl p-10 text-center text-gray-400 text-sm font-mono">
          Завантаження списку компаній...
        </div>
      ) : (
        <div className="overflow-x-auto bg-gray-950/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl font-mono text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-gray-400">
                <th className="p-4">Компанія / Власник</th>
                <th className="p-4">Стан оплати та рекомендація</th>
                <th className="p-4">Активність</th>
                <th className="p-4">Створено</th>
                <th className="p-4 text-right">Керування доступом</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 text-gray-200">
              {companies.map((company) => {
                const isBusy = busyCompanyId === company.id;
                const isBlocked = ['SUSPENDED', 'PAST_DUE', 'CANCELED'].includes(
                  company.subscriptionStatus,
                );
                const health = getPaymentHealthBadge(company);

                const toneClass =
                  health.tone === 'crown'
                    ? 'border-amber-500/40 bg-amber-500/20 text-amber-200'
                    : health.tone === 'emerald'
                      ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300'
                      : health.tone === 'rose'
                        ? 'border-rose-500/30 bg-rose-500/15 text-rose-300'
                        : health.tone === 'amber'
                          ? 'border-amber-500/30 bg-amber-500/15 text-amber-300'
                          : 'border-white/15 bg-white/5 text-gray-300';

                return (
                  <tr key={company.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-white text-sm">{company.name}</div>
                      <div className="text-blue-300 mt-0.5">{company.ownerEmail ?? 'Без власника'}</div>
                      {company.ownerName && (
                        <div className="text-[11px] text-gray-400">{company.ownerName}</div>
                      )}
                    </td>

                    <td className="p-4 space-y-1.5">
                      <div
                        className={`inline-flex items-center px-2.5 py-1 rounded-lg border font-semibold ${toneClass}`}
                      >
                        {health.label}
                      </div>
                      <div className="text-[11px] text-gray-400">
                        Тариф: <b className="text-white">{company.planCode}</b> · Статус:{' '}
                        <b className="text-white">{company.subscriptionStatus}</b>
                      </div>
                    </td>

                    <td className="p-4 text-gray-300">
                      <div>Юзерів: {company.usersCount}</div>
                      <div>
                        Товарів: {company.productsCount} · Замовлень: {company.ordersCount}
                      </div>
                    </td>

                    <td className="p-4 text-gray-400">
                      {new Date(company.createdAt).toLocaleDateString('uk-UA')}
                    </td>

                    <td className="p-4 text-right">
                      {company.isProtectedPlatformCompany ? (
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/15 px-3 py-1.5 text-amber-300 font-semibold">
                          <Crown className="h-3.5 w-3.5" />
                          <span>Власник платформи (Захищено)</span>
                        </span>
                      ) : (
                        <div className="flex flex-wrap justify-end gap-2">
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => void handleActivate(company, 'FREE')}
                            className="inline-flex items-center gap-1 rounded-lg border border-cyan-500/40 bg-cyan-500/15 px-2.5 py-1.5 text-cyan-200 hover:bg-cyan-500/25 transition cursor-pointer disabled:opacity-40"
                          >
                            <Gift className="h-3.5 w-3.5" />
                            <span>Безкоштовно</span>
                          </button>

                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() =>
                              void handleActivate(
                                company,
                                company.planCode === 'FREE' ? 'PRO' : company.planCode,
                                30,
                              )
                            }
                            className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-1.5 text-emerald-200 hover:bg-emerald-500/25 transition cursor-pointer disabled:opacity-40"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>+30 днів</span>
                          </button>

                          {!isBlocked && (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => void handleSuspend(company)}
                              className="inline-flex items-center gap-1 rounded-lg border border-amber-500/40 bg-amber-500/15 px-2.5 py-1.5 text-amber-200 hover:bg-amber-500/25 transition cursor-pointer disabled:opacity-40"
                            >
                              <Ban className="h-3.5 w-3.5" />
                              <span>Забанити</span>
                            </button>
                          )}

                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => void handleDeletePermanently(company)}
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-500/40 bg-rose-600/25 px-2.5 py-1.5 text-rose-200 hover:bg-rose-600/40 transition cursor-pointer disabled:opacity-40"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Видалити</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}

              {companies.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    За обраним фільтром компаній не знайдено.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 bg-white/5 px-4 py-3 text-xs text-gray-300">
            <div className="flex items-center gap-2">
              <span>На сторінці:</span>
              {([10, 15, 25] as const).map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => {
                    setPage(1);
                    setLimit(size);
                  }}
                  className={`px-2.5 py-1 rounded border transition cursor-pointer ${
                    limit === size
                      ? 'border-blue-500 bg-blue-600/30 text-white font-semibold'
                      : 'border-white/10 bg-black/20 text-gray-400 hover:text-white'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>

            <div>
              Показано {startItem}–{endItem} із {pagination.total}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-gray-200 hover:bg-white/10 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Назад</span>
              </button>
              <span className="px-2 text-gray-400">
                Стор. {pagination.page} / {pagination.totalPages}
              </span>
              <button
                type="button"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                className="inline-flex items-center gap-1 rounded-lg border border-white/10 
                bg-white/5 px-3 py-1.5 text-gray-200 hover:bg-white/10 disabled:opacity-40 cursor-pointer"
              >
                <span>Далі</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
