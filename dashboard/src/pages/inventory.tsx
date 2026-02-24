import { useEffect, useState } from 'react';
import { get } from '../lib/api';

interface Product {
  id: string;
  name: string;
  sku: string | null;
  price: string;
  category: string | null;
  distributor_id: string;
  is_active: boolean;
  created_at: string;
}

interface ProductListResponse {
  items: Product[];
  total: number;
  page: number;
  per_page: number;
}

export default function InventoryPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ProductListResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    get<ProductListResponse>('/products')
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message ?? 'Failed to load products');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <InventoryLayout><p className="text-gray-500">Loading...</p></InventoryLayout>;
  if (error) return <InventoryLayout><p className="text-red-600">{error}</p></InventoryLayout>;
  if (!data || data.items.length === 0) return <InventoryLayout><p className="text-gray-500">No products</p></InventoryLayout>;

  return (
    <InventoryLayout>
      <p className="mb-4 text-sm text-gray-500">{data.total} product{data.total !== 1 ? 's' : ''}</p>
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">SKU</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Price (ETB)</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Category</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {data.items.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3 text-sm font-medium text-dark">{p.name}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{p.sku ?? '—'}</td>
                <td className="px-4 py-3 text-right text-sm text-gray-700">{p.price}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{p.category ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </InventoryLayout>
  );
}

function InventoryLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-dark">Inventory Management</h1>
        <p className="mt-1 text-sm text-gray-500">Track and manage your product catalog.</p>
      </div>
      {children}
    </div>
  );
}
