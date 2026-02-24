import { useEffect, useState } from 'react';
import { get } from '../lib/api';

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string | null;
  quantity: number;
  unit_price: string;
}

interface Order {
  id: string;
  user_id: string;
  distributor_id: string;
  status: string;
  total: string;
  delivery_fee: string;
  payment_method: string | null;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

interface OrderListResponse {
  items: Order[];
  total: number;
  page: number;
  per_page: number;
}

export default function OrdersPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<OrderListResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    get<OrderListResponse>('/orders')
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message ?? 'Failed to load orders');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <OrdersLayout><p className="text-gray-500">Loading...</p></OrdersLayout>;
  if (error) return <OrdersLayout><p className="text-red-600">{error}</p></OrdersLayout>;
  if (!data || data.items.length === 0) return <OrdersLayout><p className="text-gray-500">No orders</p></OrdersLayout>;

  return (
    <OrdersLayout>
      <p className="mb-4 text-sm text-gray-500">{data.total} order{data.total !== 1 ? 's' : ''}</p>
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Total (ETB)</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {data.items.map((o) => (
              <tr key={o.id}>
                <td className="px-4 py-3 text-sm font-mono text-dark">{o.id.slice(0, 8)}…</td>
                <td className="px-4 py-3 text-sm text-dark">{o.status}</td>
                <td className="px-4 py-3 text-right text-sm text-gray-700">{o.total}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{new Date(o.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </OrdersLayout>
  );
}

function OrdersLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-dark">Order Management</h1>
        <p className="mt-1 text-sm text-gray-500">View and process customer orders.</p>
      </div>
      {children}
    </div>
  );
}
