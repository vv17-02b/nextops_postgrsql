import React, { useState } from 'react';

interface FormProps {
  onSubmit: (data: any) => Promise<void>;
}

export default function VerificationTokenForm({ onSubmit }: FormProps): React.JSX.Element {
  const [identifier, setIdentifier] = useState<string>('');
  const [token, setToken] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    await onSubmit({
      identifier: identifier,
      token: token
    });
    setIdentifier('');
    setToken('');
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="p-5 border rounded-xl bg-gray-50/50 space-y-4 font-sans">
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Форма додавання (VerificationToken)</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600">Ідентифікатор</label>
        <input 
          type="text" 
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="Введіть ідентифікатор..." 
          className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:border-blue-500"
          required
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600">Токен</label>
        <input 
          type="text" 
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Введіть токен..." 
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
