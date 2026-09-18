import React, { useState } from 'react';

interface FormProps {
  onSubmit: (data: any) => Promise<void>;
}

export default function ProductForm({ onSubmit }: FormProps): React.JSX.Element {
  const [name, setName] = useState<string>('');
  const [slug, setSlug] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    await onSubmit({
      name: name,
      slug: slug,
      price: Number(price),
      categoryId: categoryId
    });
    setName('');
    setSlug('');
    setPrice('');
    setCategoryId('');
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="p-5 border rounded-xl bg-gray-50/50 space-y-4 font-sans">
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Форма додавання (Product)</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600">Назва товару</label>
        <input 
          type="text" 
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Введіть назва товару..." 
          className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:border-blue-500"
          required
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600">Слаг (slug)</label>
        <input 
          type="text" 
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="Введіть слаг (slug)..." 
          className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:border-blue-500"
          required
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600">Ціна</label>
        <input 
          type="number" 
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Введіть ціна..." 
          className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:border-blue-500"
          required
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600">Category ID</label>
        <input 
          type="text" 
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          placeholder="Введіть category id..." 
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
