"use client";

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Bot,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  Package,
  RefreshCw,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Users,
  XCircle,
} from 'lucide-react';
import { apiFetch, getApiHeaders, getApiUrl } from '@/lib/api';
import { ApiErrorBanner } from '@/components/common/collection-controls';
import { useWorkspace } from '@/context/WorkspaceContext';

interface DailyRevenuePoint {
  date: string;
  label: string;
  revenueMinor: number;
  ordersCount: number;
}

interface OrderStatusBreakdown {
  pending: number;
  confirmed: number;
  canceled: number;
  other: number;
}

interface TopProductMetric {
  productId: string;
  name: string;
  sku: string | null;
  unitsSold: number;
  revenueMinor: number;
  currentStock: number;
}

interface LowStockProductAlert {
  productId: string;
  name: string;
  sku: string | null;
  stock: number;
}

interface DashboardOverviewResponse {
  kpis: {
    totalRevenueMinor: number;
    currency: string;
    totalOrders: number;
    confirmedOrders: number;
    conversionRatePercent: number;
    averageOrderValueMinor: number;
    aiRemainingMinor: number;
    aiLimitMinor: number;
  };
  dailyRevenue: DailyRevenuePoint[];
  statusBreakdown: OrderStatusBreakdown;
  topProducts: TopProductMetric[];
  lowStockAlerts: LowStockProductAlert[];
  billing: {
    companyName: string;
    planCode: string;
    planName: string;
    subscriptionStatus: string;
    maxUsers: number;
    usedSeats: number;
    maxProducts: number;
    usedProducts: number;
  };
}

function formatMoney(minor: number, currency = 'USD'): string {
  const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : `${currency} `;
  return `${symbol}${(minor / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function ExecutiveDashboardPage(): React.JSX.Element {

  const [data, setData] = useState<DashboardOverviewResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async (silent = false): Promise<void> => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const res = await apiFetch(getApiUrl('/api/dashboard/overview'), {
        headers: getApiHeaders(),
      });
      if (!res.ok) {
        setError(`Не вдалося завантажити аналітику (HTTP ${res.status}).`);
        return;
      }
      const payload = (await res.json()) as DashboardOverviewResponse;
      setData(payload);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Помилка мережі при завантаженні дашборду.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard(false);

    const handleRealtimeUpdate = (): void => {
      void loadDashboard(true);
    };
    window.addEventListener('nextops:telegram-event', handleRealtimeUpdate);
    return () => {
      window.removeEventListener('nextops:telegram-event', handleRealtimeUpdate);
    };
  }, [loadDashboard]);

  const maxDailyRevenue = data
    ? Math.max(1, ...data.dailyRevenue.map((point) => point.revenueMinor))
    : 1;

  const totalStatusCount = data
    ? Math.max(
      1,
      data.statusBreakdown.confirmed +
      data.statusBreakdown.pending +
      data.statusBreakdown.canceled +
      data.statusBreakdown.other,
    )
    : 1;
  return (
    <div className="bg-custom-way p-4 md:p-6 space-y-6 font-sans w-full min-h-[calc(100vh-2rem)]">
      {/* Верхня панель керівника */}
      <div className="relative overflow-hidden bg-gray-950/50 backdrop-blur-xl p-6 rounded-2xl border border-white/10 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-[11px] font-mono text-blue-300">
            <Activity className="h-3.5 w-3.5 text-emerald-400" />
            <span>LIVE EXECUTIVE ANALYTICS · POSTGRESQL RLS</span>
          </div>

          <p className="text-xs md:text-sm text-gray-400 font-mono">
            Операційна панель керування виручкою, замовленнями, складом та AI-бюджетом
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            disabled={refreshing}
            onClick={() => void loadDashboard(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-mono text-gray-200 hover:bg-white/10 transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-blue-400' : ''}`} />
            <span>{refreshing ? 'Оновлення...' : 'Оновити'}</span>
          </button>

          <Link
            href="/order"
            className="inline-flex items-center gap-1.5 rounded-xl border border-blue-500/40 bg-blue-600/25 px-4 py-2 text-xs font-mono font-semibold text-blue-200 hover:bg-blue-600/40 transition"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            <span>Нове замовлення</span>
          </Link>

          <Link
            href="/product"
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-600/20 px-4 py-2 text-xs font-mono font-semibold text-emerald-200 hover:bg-emerald-600/35 transition"
          >
            <Package className="h-3.5 w-3.5" />
            <span>Каталог товарів</span>
          </Link>
        </div>
      </div>

      <ApiErrorBanner error={error} onDismiss={() => setError(null)} />

      {loading && !data ? (
        <div className="bg-gray-950/40 backdrop-blur-md border border-white/10 rounded-2xl p-12 text-center text-gray-400 text-sm font-mono">
          Завантаження живих показників робочого простору...
        </div>
      ) : data ? (
        <>
          {/* 4 картки ключових показників (KPI) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="bg-gray-950/50 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-gray-400">Загальна виручка</span>
                <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                  <DollarSign className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold font-mono text-white">
                {formatMoney(data.kpis.totalRevenueMinor, data.kpis.currency)}
              </div>
              <div className="text-xs font-mono text-gray-400 flex items-center justify-between border-t border-white/5 pt-2">
                <span>Середній чек:</span>
                <span className="text-emerald-300 font-semibold">
                  {formatMoney(data.kpis.averageOrderValueMinor, data.kpis.currency)}
                </span>
              </div>
            </div>

            <div className="bg-gray-950/50 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-gray-400">Замовлення</span>
                <div className="p-2 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/25">
                  <ShoppingCart className="h-4 w-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2.5">
                <span className="text-2xl font-extrabold font-mono text-white">
                  {data.kpis.totalOrders}
                </span>
                <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                  Конверсія {data.kpis.conversionRatePercent}%
                </span>
              </div>
              <div className="text-xs font-mono text-gray-400 flex items-center justify-between border-t border-white/5 pt-2">
                <span>Підтверджено:</span>
                <span className="text-blue-300 font-semibold">{data.kpis.confirmedOrders} шт.</span>
              </div>
            </div>

            <div className="bg-gray-950/50 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-gray-400">AI-бюджет</span>
                <div className="p-2 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/25">
                  <Bot className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold font-mono text-white">
                {formatMoney(data.kpis.aiRemainingMinor, 'USD')}
              </div>
              <div className="text-xs font-mono text-gray-400 flex items-center justify-between border-t border-white/5 pt-2">
                <span>Місячний ліміт:</span>
                <span className="text-purple-300 font-semibold">
                  {formatMoney(data.kpis.aiLimitMinor, 'USD')}
                </span>
              </div>
            </div>

            <div className="bg-gray-950/50 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-gray-400">Тариф {data.billing.planCode}</span>
                <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/25">
                  <Sparkles className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold font-mono text-white">
                {data.billing.planName}
              </div>
              <div className="text-xs font-mono text-gray-400 flex items-center justify-between border-t border-white/5 pt-2">
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3.5 w-3.5 text-blue-400" />
                  {data.billing.usedSeats}/{data.billing.maxUsers} місць
                </span>
                <Link href="/billing" className="text-blue-400 hover:text-blue-300 inline-flex items-center gap-0.5">
                  Керувати <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>

          {/* Графік динаміки за 7 днів + Розподіл статусів замовлень */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-gray-950/50 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-bold font-mono text-white uppercase tracking-wider flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-blue-400" />
                    Динаміка виручки за останні 7 днів
                  </h2>
                  <p className="text-xs font-mono text-gray-400 mt-0.5">
                    Щоденний обсяг замовлень без урахування скасованих
                  </p>
                </div>
                <span className="text-xs font-mono text-blue-300 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-lg">
                  7 днів
                </span>
              </div>

              <div className="grid grid-cols-7 gap-2 md:gap-3 items-end h-48 pt-6 border-b border-white/10 pb-3">
                {data.dailyRevenue.map((point) => {
                  const heightPercent =
                    point.revenueMinor > 0
                      ? Math.max(12, Math.round((point.revenueMinor / maxDailyRevenue) * 100))
                      : 6;

                  return (
                    <div
                      key={point.date}
                      className="flex flex-col items-center justify-end h-full group"
                    >
                      <span className="text-[10px] font-mono text-gray-300 mb-1.5 opacity-80 group-hover:text-white transition">
                        {point.revenueMinor > 0
                          ? `$${(point.revenueMinor / 100).toFixed(0)}`
                          : '$0'}
                      </span>
                      <div className="w-full max-w-[44px] h-32 flex items-end justify-center bg-white/[0.03] rounded-t-lg overflow-hidden">
                        <div
                          style={{ height: `${heightPercent}%` }}
                          title={`${point.label}: ${formatMoney(point.revenueMinor, data.kpis.currency)} (${point.ordersCount} зам.)`}
                          className={`w-full rounded-t-lg transition-all duration-500 ${point.revenueMinor > 0
                            ? 'bg-gradient-to-t from-blue-600 to-cyan-400 group-hover:brightness-110'
                            : 'bg-gray-800/70'
                            }`}
                        />
                      </div>
                      <span className="text-[11px] font-mono text-gray-400 mt-2">
                        {point.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Розподіл замовлень за статусами */}
            <div className="bg-gray-950/50 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-5">
              <div>
                <h2 className="text-sm font-bold font-mono text-white uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  Статуси замовлень
                </h2>
                <p className="text-xs font-mono text-gray-400 mt-0.5">
                  Синхронізується з кнопками Telegram
                </p>
              </div>

              <div className="space-y-4 font-mono text-xs">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-emerald-300">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Підтверджено
                    </span>
                    <span className="text-white font-bold">{data.statusBreakdown.confirmed}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-900 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{
                        width: `${Math.round((data.statusBreakdown.confirmed / totalStatusCount) * 100)}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-amber-300">
                      <Clock className="h-3.5 w-3.5" /> В очікуванні
                    </span>
                    <span className="text-white font-bold">{data.statusBreakdown.pending}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-900 overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all"
                      style={{
                        width: `${Math.round((data.statusBreakdown.pending / totalStatusCount) * 100)}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-red-300">
                      <XCircle className="h-3.5 w-3.5" /> Скасовано
                    </span>
                    <span className="text-white font-bold">{data.statusBreakdown.canceled}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-900 overflow-hidden">
                    <div
                      className="h-full bg-red-500 rounded-full transition-all"
                      style={{
                        width: `${Math.round((data.statusBreakdown.canceled / totalStatusCount) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <Link
                href="/order"
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-mono text-gray-200 hover:bg-white/10 transition"
              >
                <span>Перейти до всіх замовлень</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Нижній ряд: Топ-5 товарів та Контроль складських залишків */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-950/50 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold font-mono text-white uppercase tracking-wider flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-blue-400" />
                  Топ товарів за продажами
                </h2>
                <Link href="/product" className="text-xs font-mono text-blue-400 hover:underline">
                  Увесь каталог →
                </Link>
              </div>
              {data.topProducts.length === 0 ? (
                <p className="text-xs font-mono text-gray-400 py-6 text-center">
                  Ще немає продажів за позиціями. Оформіть перше замовлення в розділі /order.
                </p>
              ) : (
                <div className="divide-y divide-white/10 font-mono text-xs">
                  {data.topProducts.map((item, idx) => (
                    <div key={item.productId} className="py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-white font-semibold truncate">
                          <span className="text-blue-400 mr-2">#{idx + 1}</span>
                          {item.name}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          Продано: {item.unitsSold} шт. · На складі: {item.currentStock} шт.
                        </p>
                      </div>
                      <span className="text-emerald-400 font-bold shrink-0">
                        {formatMoney(item.revenueMinor, data.kpis.currency)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-gray-950/50 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold font-mono text-white uppercase tracking-wider flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  Контроль залишків на складі (≤ 10 шт.)
                </h2>
                <Link href="/warehouse" className="text-xs font-mono text-blue-400 hover:underline">
                  Склади →
                </Link>
              </div>
              {data.lowStockAlerts.length === 0 ? (
                <div className="py-6 text-center space-y-1">
                  <p className="text-xs font-mono text-emerald-400">
                    ● Усі позиції каталогу мають достатній запас на складі
                  </p>
                  <p className="text-[11px] font-mono text-gray-500">
                    Товарів у каталозі: {data.billing.usedProducts} / {data.billing.maxProducts}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-white/10 font-mono text-xs">
                  {data.lowStockAlerts.map((item) => (
                    <div key={item.productId} className="py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-white font-semibold truncate">{item.name}</p>
                        {item.sku && (
                          <p className="text-[11px] text-gray-400 mt-0.5">SKU: {item.sku}</p>
                        )}
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold shrink-0 ${item.stock === 0
                          ? 'border-red-500/40 bg-red-500/15 text-red-300'
                          : 'border-amber-500/40 bg-amber-500/15 text-amber-300'
                          }`}
                      >
                        {item.stock === 0 ? 'Немає в наявності' : `Залишок: ${item.stock} шт.`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
