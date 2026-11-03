import React, { useState } from 'react';
import type { CreateApiHistoryInput } from '@/types/api';

interface FormProps {
  onSubmit: (data: CreateApiHistoryInput) => Promise<boolean>;
}

export default function ApiHistoryForm({ onSubmit }: FormProps): React.JSX.Element {
  const [endpoint, setEndpoint] = useState<string>('');
  const [method, setMethod] = useState<string>('');
  const [statusCode, setStatusCode] = useState<string>('');
  const [durationMs, setDurationMs] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const created = await onSubmit({
        endpoint: endpoint.trim(),
        method: method.trim().toUpperCase(),
        statusCode: Number(statusCode),
        durationMs: Number(durationMs)
      });
      if (!created) {
        setError('Не вдалося створити запис. Перевірте дані та авторизацію.');
        return;
      }
      setEndpoint('');
      setMethod('');
      setStatusCode('');
      setDurationMs('');
    } catch (submitError: unknown) {
      setError(submitError instanceof Error ? submitError.message : 'Не вдалося створити запис.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-white/10 bg-gray-950/40 backdrop-blur-md p-4 font-sans shadow-2xl sm:p-5">
      <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider font-mono">
        Форма додавання (ApiHistory)
      </h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label htmlFor="api-history-endpoint" className="text-xs font-medium text-gray-400 font-mono">Ендпоінт (/api/...)</label>
          <input 
            id="api-history-endpoint"
            type="text" 
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            placeholder="/api/v1/users" 
            className="w-full text-sm font-mono focus:outline-none"
            required
            maxLength={2048}
          />
        </div>
        
        <div className="space-y-1">
          <label htmlFor="api-history-method" className="text-xs font-medium text-gray-400 font-mono">Метод (GET/POST)</label>
          <input 
            id="api-history-method"
            type="text" 
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            placeholder="POST" 
            className="w-full text-sm font-mono focus:outline-none"
            required
            maxLength={16}
          />
        </div>
        
        <div className="space-y-1">
          <label htmlFor="api-history-status-code" className="text-xs font-medium text-gray-400 font-mono">Статус код (200/400)</label>
          <input 
            id="api-history-status-code"
            type="number" 
            value={statusCode}
            onChange={(e) => setStatusCode(e.target.value)}
            placeholder="201" 
            className="w-full text-sm font-mono focus:outline-none"
            required
            min={100}
            max={599}
            step={1}
          />
        </div>
        
        <div className="space-y-1">
          <label htmlFor="api-history-duration-ms" className="text-xs font-medium text-gray-400 font-mono">Тривалість (мс)</label>
          <input 
            id="api-history-duration-ms"
            type="number" 
            value={durationMs}
            onChange={(e) => setDurationMs(e.target.value)}
            placeholder="120" 
            className="w-full text-sm font-mono focus:outline-none"
            required
            min={0}
            step={1}
          />
        </div>
      </div>
      
      {error && <p className="text-sm text-red-400 font-mono" role="alert">● {error}</p>}
      
      <button 
        type="submit" 
        disabled={loading}
        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium font-mono transition disabled:opacity-50 shadow-lg shadow-blue-950/50 cursor-pointer"
      >
        {loading ? 'Надсилання...' : 'Створити документ'}
      </button>
    </form>
  );
}
