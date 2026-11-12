"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { apiFetch, getApiHeaders, getApiUrl } from '@/lib/api';
import { ApiErrorBanner } from '@/components/common/collection-controls';
import { CheckCircle2, CreditCard, Sparkles, Users, Box } from 'lucide-react';

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
}

export default function BillingPage(): React.JSX.Element {
    const [statusData, setStatusData] = useState<BillingStatusResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [submittingPlan, setSubmittingPlan] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

    const loadBilling = useCallback(async (): Promise<void> => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiFetch(getApiUrl('/api/billing/status'), {
                headers: getApiHeaders(),
            });
            if (!res.ok) {
                setError(`Не вдалося завантажити статус підписки (HTTP ${res.status}).`);
                return;
            }
            const payload = (await res.json()) as BillingStatusResponse;
            setStatusData(payload);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Помилка мережі при завантаженні білінгу.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadBilling();
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
                    await loadBilling();
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
                            Тарифи та підписка платформи
                        </h1>
                        <p className="text-sm text-gray-400 font-mono mt-1">
                            Керування планом робочого простору, лімітами команди та статусом оплати
                        </p>
                    </div>

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
                    {/* Поточне споживання лімітів */}
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

                    {/* Картки тарифних планів */}
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
                </>
            ) : null}
        </div>
    );
}
