import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/auth-context';
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

interface CreditLimit {
  credit_limit: number;
  available_credit: number;
}

type OrderStatus = 'pending' | 'confirmed' | 'in_transit' | 'delivered' | 'cancelled';

const STATUS_STYLES: Record<OrderStatus, string> = {
  delivered: 'bg-green-50 text-green-700',
  pending: 'bg-yellow-50 text-yellow-700',
  confirmed: 'bg-yellow-50 text-yellow-700',
  in_transit: 'bg-blue-50 text-blue-700',
  cancelled: 'bg-red-50 text-red-700',
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  in_transit: 'In Transit',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-ET', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

export default function DashboardPage() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<ProductListResponse | null>(null);
  const [orders, setOrders] = useState<OrderListResponse | null>(null);
  const [credit, setCredit] = useState<CreditLimit | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchAll() {
      setLoading(true);
      setError(null);
      try {
        const [productsRes, ordersRes, creditRes] = await Promise.all([
          get<ProductListResponse>('/products'),
          get<OrderListResponse>('/orders'),
          get<CreditLimit>('/credit/limit').catch(() => null),
        ]);
        if (cancelled) return;
        setProducts(productsRes);
        setOrders(ordersRes);
        setCredit(creditRes);
      } catch (err: unknown) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAll();
    return () => { cancelled = true; };
  }, []);

  const pendingCount = orders?.items.filter((o) => o.status === 'pending').length ?? 0;
  const totalRevenue = orders?.items.reduce((sum, o) => sum + parseFloat(o.total || '0'), 0) ?? 0;
  const recentOrders = orders?.items
    .slice()
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5) ?? [];

  const kpis = [
    {
      label: 'Total Products',
      value: products?.total.toString() ?? '—',
      icon: <BoxIcon />,
    },
    {
      label: 'Pending Orders',
      value: pendingCount.toString(),
      icon: <ClockIcon />,
    },
    {
      label: 'Total Revenue (ETB)',
      value: orders ? formatCurrency(totalRevenue) : '—',
      icon: <CurrencyIcon />,
    },
    {
      label: 'Credit Available (ETB)',
      value: credit ? formatCurrency(credit.available_credit) : '—',
      icon: <ShoppingBagIcon />,
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-dark">
          Welcome back, <span className="text-primary">{user?.name ?? 'User'}</span>
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Here&apos;s what&apos;s happening with your business today.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="group rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 transition hover:shadow-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              {kpi.icon}
            </div>
            {loading ? (
              <div className="mt-4 h-7 w-20 animate-pulse rounded bg-gray-100" />
            ) : (
              <p className="mt-4 text-2xl font-bold text-dark">{kpi.value}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Widgets */}
      <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Recent Orders */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <h2 className="mb-4 text-lg font-semibold text-dark">Recent Orders</h2>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-50" />
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-gray-400">
              <ShoppingBagIcon />
              <p className="mt-2 text-sm">No orders yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead>
                  <tr>
                    <th className="pb-2 text-left text-xs font-medium uppercase text-gray-400">ID</th>
                    <th className="pb-2 text-left text-xs font-medium uppercase text-gray-400">Status</th>
                    <th className="pb-2 text-right text-xs font-medium uppercase text-gray-400">Total</th>
                    <th className="pb-2 text-right text-xs font-medium uppercase text-gray-400">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentOrders.map((o) => {
                    const status = o.status as OrderStatus;
                    return (
                      <tr key={o.id}>
                        <td className="py-2.5 pr-3 text-sm font-mono text-dark">
                          {o.id.slice(0, 8)}
                        </td>
                        <td className="py-2.5 pr-3">
                          <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-600'}`}>
                            {STATUS_LABELS[status] ?? o.status}
                          </span>
                        </td>
                        <td className="py-2.5 text-right text-sm text-gray-700">
                          {formatCurrency(parseFloat(o.total || '0'))}
                        </td>
                        <td className="py-2.5 text-right text-sm text-gray-500">
                          {new Date(o.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Product Catalog */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <h2 className="mb-4 text-lg font-semibold text-dark">Product Catalog</h2>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-50" />
              ))}
            </div>
          ) : !products || products.items.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-gray-400">
              <BoxIcon />
              <p className="mt-2 text-sm">No products yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead>
                  <tr>
                    <th className="pb-2 text-left text-xs font-medium uppercase text-gray-400">Name</th>
                    <th className="pb-2 text-left text-xs font-medium uppercase text-gray-400">Category</th>
                    <th className="pb-2 text-right text-xs font-medium uppercase text-gray-400">Price (ETB)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {products.items.slice(0, 8).map((p) => (
                    <tr key={p.id}>
                      <td className="py-2.5 pr-3 text-sm font-medium text-dark">{p.name}</td>
                      <td className="py-2.5 pr-3 text-sm text-gray-500">{p.category ?? '—'}</td>
                      <td className="py-2.5 text-right text-sm text-gray-700">
                        {formatCurrency(parseFloat(p.price || '0'))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {products.total > 8 && (
                <p className="mt-3 text-center text-xs text-gray-400">
                  Showing 8 of {products.total} products
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ShoppingBagIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function CurrencyIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function BoxIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
    </svg>
  );
}
