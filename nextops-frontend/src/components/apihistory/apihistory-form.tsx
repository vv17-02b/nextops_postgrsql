import React, { useState } from 'react';
import type { CreateApiHistoryInput } from '@/types/api';

interface FormProps {
  onSubmit: (data: CreateApiHistoryInput) => Promise<void>;
}

export default function ApiHistoryForm({ onSubmit }: FormProps): React.JSX.Element {
  const [endpoint, setEndpoint] = useState<string>('');
  const [method, setMethod] = useState<string>('');
  const [statusCode, setStatusCode] = useState<string>('');
  const [durationMs, setDurationMs] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    await onSubmit({
      endpoint: endpoint,
      method: method,
      statusCode: Number(statusCode),
      durationMs: Number(durationMs)
    });
    setEndpoint('');
    setMethod('');
    setStatusCode('');
    setDurationMs('');
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="p-5 border rounded-xl bg-gray-50/50 space-y-4 font-sans">
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Форма додавання (ApiHistory)</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600">Ендпоінт (/api/...)</label>
        <input 
          type="text" 
          value={endpoint}
          onChange={(e) => setEndpoint(e.target.value)}
          placeholder="Введіть ендпоінт (/api/...)..." 
          className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:border-blue-500"
          required
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600">Метод (GET/POST)</label>
        <input 
          type="text" 
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          placeholder="Введіть метод (get/post)..." 
          className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:border-blue-500"
          required
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600">Статус код (200/400)</label>
        <input 
          type="number" 
          value={statusCode}
          onChange={(e) => setStatusCode(e.target.value)}
          placeholder="Введіть статус код (200/400)..." 
          className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:border-blue-500"
          required
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600">Тривалість (мс)</label>
        <input 
          type="number" 
          value={durationMs}
          onChange={(e) => setDurationMs(e.target.value)}
          placeholder="Введіть тривалість (мс)..." 
          className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:border-blue-500"
          required
        />
      </div>
      </div>
      <button 
        type="submit" 
        disabled={loading}
        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition disabled:opacity-50 shadow-sm"
      >
        {loading ? 'Надсилання...' : 'Створити документ'}
      </button>
    </form>
  );
}
