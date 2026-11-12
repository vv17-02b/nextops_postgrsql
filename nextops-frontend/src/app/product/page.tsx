"use client";

import React from 'react';
import { useProduct } from '@/hooks/useProduct';
import ProductForm from '@/components/product/product-form';
import { ApiErrorBanner, PaginationControls } from '@/components/common/collection-controls';
import { Trash2 } from 'lucide-react';

export default function ProductPage(): React.JSX.Element {
  const {
    data,
    loading,
    error,
    page,
    limit,
    meta,
    setPage,
    setLimit,
    clearError,
    createItem,
    deleteItem,
  } = useProduct();

  return (
    <div className="space-y-6 font-sans">
      <div className="bg-gray-950/40 backdrop-blur-md p-6 border border-white/10 rounded-xl shadow-2xl">
        <h1 className="text-xl font-bold text-white font-mono">Next.js Сторінка: Product</h1>
        <p className="text-sm text-gray-400 font-mono">
          Автоматичний зв&apos;язок з роутом бекенду:{' '}
          <code className="text-blue-400 font-mono">/api/product</code>
        </p>
      </div>

      <ApiErrorBanner error={error} onDismiss={clearError} />

      <ProductForm onSubmit={createItem} />

      <div className="bg-gray-950/40 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden shadow-2xl">
        <div className="border-b border-white/10 bg-gray-900/30 p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 font-mono">
            Записи з бази PostgreSQL
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm font-mono">
            Виконується запит до сервера...
          </div>
        ) : data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-gray-900/50 text-xs font-semibold text-gray-400 uppercase border-b border-white/10 font-mono">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left">ID Документа</th>
                  <th scope="col" className="px-4 py-3 text-left">Назва товару</th>
                  <th scope="col" className="px-4 py-3 text-left">Слаг (slug)</th>
                  <th scope="col" className="px-4 py-3 text-left">Ціна</th>
                  <th scope="col" className="px-4 py-3 text-left">Category ID</th>
                  <th scope="col" className="px-4 py-3 text-right">Дії</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-gray-200">
                {data.map((item) => (
                  <tr key={item.id} className="hover:bg-white/5 transition text-[13px]">
                    <td className="max-w-40 break-all px-4 py-3 text-xs text-blue-400">{item.id}</td>
                    <td className="max-w-64 break-words px-4 py-3">{String(item.name || '-')}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-300">{String(item.slug || '-')}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-emerald-400">
                      {item.priceMinor == null ? '-' : (item.priceMinor / 100).toFixed(2)}
                    </td>
                    <td className="max-w-40 break-all px-4 py-3 text-xs text-gray-400">
                      {String(item.categoryId || '-')}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => deleteItem(item.id)}
                        className="p-1.5 text-gray-400 hover:text-red-400 rounded-md transition inline-flex cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-400 text-sm font-mono">
            Колекція порожня. Заповніть форму вище, щоб додати перший документ.
          </div>
        )}

        {!error && (
          <PaginationControls
            meta={meta}
            dataLength={data.length}
            page={page}
            limit={limit}
            loading={loading}
            ariaLabel="Пагінація товарів"
            onPageChange={setPage}
            onLimitChange={setLimit}
          />
        )}
      </div>
    </div>
  );
}
