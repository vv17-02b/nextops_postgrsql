"use client";

import Link from 'next/link';
import { ArrowRight, CreditCard } from 'lucide-react';
import { useOrder } from '@/hooks/useOrder';

export default function PaymentPage(): React.JSX.Element {
  const { data: orders, loading } = useOrder();
  const paidOrders = orders.filter((order) => order.paymentStatus === 'PAID');
  const pendingOrders = orders.filter((order) => order.paymentStatus !== 'PAID');

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 font-sans">
      <header className="rounded-xl border border-slate-800 bg-slate-950/70 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <CreditCard className="mt-1 h-6 w-6 shrink-0 text-cyan-400" aria-hidden="true" />
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-white sm:text-2xl">Payments</h1>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Payment status and references are shown from existing orders. No payment
              provider is currently configured, so this page does not collect or charge payments.
            </p>
          </div>
        </div>
        <Link
          href="/order"
          className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500"
        >
          Manage orders
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2" aria-label="Payment summary">
        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-5">
          <p className="text-sm text-slate-400">Paid orders on this page</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-400">{paidOrders.length}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-5">
          <p className="text-sm text-slate-400">Unpaid orders on this page</p>
          <p className="mt-2 text-2xl font-semibold text-amber-300">{pendingOrders.length}</p>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/70">
        <h2 className="border-b border-slate-800 px-5 py-4 text-sm font-semibold text-white">
          Payment records
        </h2>
        {loading ? (
          <p className="p-6 text-sm text-slate-400" role="status">Loading payment records...</p>
        ) : orders.length === 0 ? (
          <p className="p-6 text-sm text-slate-400">No orders are available on this page.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-slate-900 text-xs uppercase text-slate-400">
                <tr>
                  <th scope="col" className="px-4 py-3">Order</th>
                  <th scope="col" className="px-4 py-3">Payment status</th>
                  <th scope="col" className="px-4 py-3">Method</th>
                  <th scope="col" className="px-4 py-3">Reference</th>
                  <th scope="col" className="px-4 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className="max-w-48 truncate px-4 py-3 font-mono text-xs">{order.id}</td>
                    <td className="px-4 py-3">{order.paymentStatus}</td>
                    <td className="px-4 py-3">{order.paymentMethod}</td>
                    <td className="max-w-48 truncate px-4 py-3 font-mono text-xs">
                      {order.paymentId || '—'}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {new Intl.NumberFormat(undefined, {
                        style: 'currency',
                        currency: order.currency || 'USD',
                      }).format(order.totalAmountMinor / 100)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
