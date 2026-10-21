import React, { useState } from 'react';
import type { CreateWarehouseInput } from '@/types/api';

interface FormProps {
  onSubmit: (data: CreateWarehouseInput) => Promise<void>;
}

export default function WarehouseForm({ onSubmit }: FormProps): React.JSX.Element {
  // 🌟 Оновлено стейти під реальну NoSQL схему Warehouse
  const [name, setName] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    
    // 🌟 Надсилаємо правильні чисті поля на бекенд
    await onSubmit({
      name: name,
      location: location,
      description: description || undefined // Якщо порожній, передаємо як undefined
    });
    
    setName('');
    setLocation('');
    setDescription('');
    loading && setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="p-5 border rounded-xl bg-gray-50/50 space-y-4 font-sans">
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Форма додавання (Warehouse)</h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Назва складу замість старого Product ID */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">Назва складу</label>
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Введіть назву складу (напр. Головний Склад Київ)..." 
            className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:border-blue-500"
            required
          />
        </div>

        {/* Локація складу */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">Локація складу</label>
          <input 
            type="text" 
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Введіть локацію складу (напр. вул. Хрещатик, 1)..." 
            className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:border-blue-500"
            required
          />
        </div>

        {/* Опис складу (двоколонкове розтягування для краси верстки) */}
        <div className="space-y-1 sm:col-span-2">
          <label className="text-xs font-medium text-gray-600">Опис складу (опціонально)</label>
          <input 
            type="text" 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Введіть додатковий опис чи примітки..." 
            className="w-full px-3 py-2 border rounded-lg text-sm
             bg-white focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <button 
        type="submit" 
        disabled={loading}
        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 
        text-white px-5 py-2.5 rounded-lg text-sm font-medium 
        transition disabled:opacity-50 shadow-sm"
      >
        {loading ? 'Надсилання...' : 'Створити документ'}
      </button>
    </form>
  );
}
