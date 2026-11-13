"use client";

import React, { useRef, useState } from 'react';
import { useProduct } from '@/hooks/useProduct';
import ProductForm from '@/components/product/product-form';
import { ApiErrorBanner, PaginationControls } from '@/components/common/collection-controls';
import { apiFetch, getApiHeaders, getApiUrl } from '@/lib/api';
import { Trash2, Download, Upload, FileSpreadsheet } from 'lucide-react';

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      cells.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  cells.push(current.trim());
  return cells;
}

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

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [csvBusy, setCsvBusy] = useState<boolean>(false);
  const [csvNotice, setCsvNotice] = useState<string | null>(null);
  const [csvError, setCsvError] = useState<string | null>(null);

  const handleDownloadTemplate = (): void => {
    const sampleCategoryId = data[0]?.categoryId || '00000000-0000-4000-8000-000000000000';
    const template = [
      'name,slug,price,categoryId,description',
      `"Кава в зернах Arabica 1кг","arabica-1kg",480.00,"${sampleCategoryId}","Свіже обсмаження"`,
      `"Чашка керамічна NextOps","nextops-mug",250.50,"${sampleCategoryId}","Фірмова чашка 350 мл"`,
    ].join('\n');

    const blob = new Blob([`\uFEFF${template}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'nextops-products-template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = async (): Promise<void> => {
    setCsvBusy(true);
    setCsvError(null);
    setCsvNotice(null);
    try {
      const response = await apiFetch(getApiUrl('/api/product/export/csv'), {
        headers: getApiHeaders(),
      });
      if (!response.ok) {
        setCsvError(`Не вдалося експортувати каталог (HTTP ${response.status}).`);
        return;
      }
      const csvText = await response.text();
      const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `nextops-products-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      setCsvNotice('Каталог товарів успішно експортовано у CSV.');
    } catch (err: unknown) {
      setCsvError(err instanceof Error ? err.message : 'Помилка мережі при експорті CSV.');
    } finally {
      setCsvBusy(false);
    }
  };

  const handleImportCsvFile = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setCsvBusy(true);
    setCsvError(null);
    setCsvNotice(null);

    try {
      const rawText = await file.text();
      const lines = rawText
        .replace(/^\uFEFF/, '')
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);

      if (lines.length < 2) {
        setCsvError('CSV-файл порожній або містить лише заголовок.');
        return;
      }

      const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
      const idxName = headers.indexOf('name');
      const idxSlug = headers.indexOf('slug');
      const idxPrice = headers.indexOf('price');
      const idxCategory = headers.indexOf('categoryid');
      const idxDesc = headers.indexOf('description');

      if (idxName === -1 || idxSlug === -1 || idxPrice === -1 || idxCategory === -1) {
        setCsvError('Обовʼязкові колонки CSV: name, slug, price, categoryId.');
        return;
      }

      const items = lines.slice(1).map((line) => {
        const cols = parseCsvLine(line);
        return {
          name: cols[idxName] ?? '',
          slug: cols[idxSlug] ?? '',
          price: Number(cols[idxPrice] ?? 0),
          categoryId: cols[idxCategory] ?? '',
          ...(idxDesc !== -1 && cols[idxDesc] ? { description: cols[idxDesc] } : {}),
        };
      });

      const response = await apiFetch(getApiUrl('/api/product/import/csv'), {
        method: 'POST',
        headers: {
          ...getApiHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items }),
      });

      const result = (await response.json()) as { imported?: number; message?: string };
      if (!response.ok) {
        setCsvError(result.message || `Помилка імпорту (HTTP ${response.status}).`);
        return;
      }

      setCsvNotice(`Успішно імпортовано товарів: ${result.imported ?? items.length}. Оновлюємо список...`);
      setPage(1);
      window.location.reload();
    } catch (err: unknown) {
      setCsvError(err instanceof Error ? err.message : 'Помилка читання або імпорту CSV-файлу.');
    } finally {
      setCsvBusy(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="bg-gray-950/40 backdrop-blur-md p-6 border border-white/10 rounded-xl shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white font-mono">Next.js Сторінка: Product</h1>
          <p className="text-sm text-gray-400 font-mono">
            Автоматичний зв&apos;язок з роутом бекенду:{' '}
            <code className="text-blue-400 font-mono">/api/product</code>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => void handleImportCsvFile(e)}
            className="hidden"
          />
          <button
            type="button"
            disabled={csvBusy}
            onClick={handleDownloadTemplate}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-gray-300 hover:bg-white/10 transition cursor-pointer disabled:opacity-50"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-amber-400" />
            Шаблон CSV
          </button>
          <button
            type="button"
            disabled={csvBusy}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-500/15 px-3 py-2 text-blue-300 hover:bg-blue-500/25 transition cursor-pointer disabled:opacity-50"
          >
            <Upload className="h-3.5 w-3.5" />
            Імпорт CSV
          </button>
          <button
            type="button"
            disabled={csvBusy}
            onClick={() => void handleExportCsv()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-3 py-2 text-emerald-300 hover:bg-emerald-500/25 transition cursor-pointer disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            Експорт у CSV
          </button>
        </div>
      </div>

      {csvNotice && (
        <div className="bg-emerald-950/40 backdrop-blur-md border border-emerald-500/30 rounded-xl p-4 text-xs font-mono text-emerald-300">
          ● {csvNotice}
        </div>
      )}

      <ApiErrorBanner error={csvError || error} onDismiss={() => { setCsvError(null); clearError(); }} />

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
