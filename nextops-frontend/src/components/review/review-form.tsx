import React, { useState } from 'react';

interface FormProps {
  onSubmit: (data: any) => Promise<void>;
}

export default function ReviewForm({ onSubmit }: FormProps): React.JSX.Element {
  const [rating, setRating] = useState<string>('');
  const [comment, setComment] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [productId, setProductId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    await onSubmit({
      rating: Number(rating),
      comment: comment,
      userId: userId,
      productId: productId
    });
    setRating('');
    setComment('');
    setUserId('');
    setProductId('');
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="p-5 border rounded-xl bg-gray-50/50 space-y-4 font-sans">
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Форма додавання (Review)</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600">Рейтинг (1-5)</label>
        <input 
          type="number" 
          value={rating}
          onChange={(e) => setRating(e.target.value)}
          placeholder="Введіть рейтинг (1-5)..." 
          className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:border-blue-500"
          required
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600">Коментар</label>
        <input 
          type="text" 
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Введіть коментар..." 
          className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:border-blue-500"
          required
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600">User ID</label>
        <input 
          type="text" 
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="Введіть user id..." 
          className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:border-blue-500"
          required
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600">Product ID</label>
        <input 
          type="text" 
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          placeholder="Введіть product id..." 
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
