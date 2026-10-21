import React, { useState } from 'react';
import type { CreateAccountInput } from '@/types/api';

interface FormProps {
  onSubmit: (data: CreateAccountInput) => Promise<void>;
}

export default function AccountForm({ onSubmit }: FormProps): React.JSX.Element {
  const [userId, setUserId] = useState<string>('');
  const [type, setType] = useState<string>('');
  const [provider, setProvider] = useState<string>('');
  const [providerAccountId, setProviderAccountId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    await onSubmit({
      userId: userId,
      type: type,
      provider: provider,
      providerAccountId: providerAccountId
    });
    setUserId('');
    setType('');
    setProvider('');
    setProviderAccountId('');
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="p-5 border rounded-xl bg-gray-50/50 space-y-4 font-sans">
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Форма додавання (Account)</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600">User ID (MongoDB ObjectId)</label>
        <input 
          type="text" 
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="Введіть user id (mongodb objectid)..." 
          className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:border-blue-500"
          required
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600">Тип акаунта</label>
        <input 
          type="text" 
          value={type}
          onChange={(e) => setType(e.target.value)}
          placeholder="Введіть тип акаунта..." 
          className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:border-blue-500"
          required
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600">Провайдер</label>
        <input 
          type="text" 
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          placeholder="Введіть провайдер..." 
          className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:border-blue-500"
          required
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600">ID провайдера</label>
        <input 
          type="text" 
          value={providerAccountId}
          onChange={(e) => setProviderAccountId(e.target.value)}
          placeholder="Введіть id провайдера..." 
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
