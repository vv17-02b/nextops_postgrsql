import React, { useState } from 'react';
import type { CreateWarehouseInput } from '@/types/api';

interface FormProps {
  onSubmit: (data: CreateWarehouseInput) => Promise<void>;
}

export default function WarehouseForm({ onSubmit }: FormProps): React.JSX.Element {
  const [productId, setProductId] = useState('');
  const [location, setLocation] = useState('');
  const [quantity, setQuantity] = useState('0');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setLoading(true);

    try {
      await onSubmit({
        productId: productId.trim(),
        location: location.trim(),
        quantity: Number(quantity),
      });
      setProductId('');
      setLocation('');
      setQuantity('0');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-5 border rounded-xl bg-gray-50/50 space-y-4 font-sans">
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Add product stock</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">Product ID (UUID)</label>
          <input
            type="text"
            value={productId}
            onChange={(event) => setProductId(event.target.value)}
            placeholder="Enter the existing product UUID"
            className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:border-blue-500"
            required
            pattern="[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}"
            title="Enter a valid PostgreSQL UUID"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">Warehouse location</label>
          <input
            type="text"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            placeholder="Main warehouse, shelf A1"
            className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:border-blue-500"
            required
          />
        </div>

        <div className="space-y-1 sm:col-span-2">
          <label className="text-xs font-medium text-gray-600">Quantity</label>
          <input
            type="number"
            min="0"
            step="1"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
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
        {loading ? 'Saving...' : 'Add stock'}
      </button>
    </form>
  );
}
