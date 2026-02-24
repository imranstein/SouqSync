import { useEffect, useState } from 'react';
import { get, put } from '../lib/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type OrderStatus = 'pending' | 'confirmed' | 'in_transit' | 'delivered' | 'cancelled';

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
  status: OrderStatus;
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

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_TABS: { label: string; value: OrderStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'In Transit', value: 'in_transit' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Cancelled', value: 'cancelled' },
];

const STATUS_BADGE: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  in_transit: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  in_transit: 'In Transit',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const TRANSITIONS: Record<OrderStatus, { status: OrderStatus; label: string; style: string }[]> = {
  pending: [
    { status: 'confirmed', label: 'Confirm Order', style: 'bg-blue-600 hover:bg-blue-700 text-white' },
    { status: 'cancelled', label: 'Cancel Order', style: 'bg-red-600 hover:bg-red-700 text-white' },
  ],
  confirmed: [
    { status: 'in_transit', label: 'Mark In Transit', style: 'bg-purple-600 hover:bg-purple-700 text-white' },
  ],
  in_transit: [
    { status: 'delivered', label: 'Mark Delivered', style: 'bg-green-600 hover:bg-green-700 text-white' },
  ],
  delivered: [],
  cancelled: [],
};

const TIMELINE_STEPS: OrderStatus[] = ['pending', 'confirmed', 'in_transit', 'delivered'];

const PER_PAGE = 20;

const etb = new Intl.NumberFormat('en-ET', { minimumFractionDigits: 2 });

function formatCurrency(value: string | number): string {
  return etb.format(typeof value === 'string' ? parseFloat(value) : value);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function OrdersPage() {
  const [data, setData] = useState<OrderListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<OrderStatus | 'all'>('all');
  const [page, setPage] = useState(1);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  // ---- Fetch orders list ---------------------------------------------------

  const [fetchKey, setFetchKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('per_page', String(PER_PAGE));
    if (activeTab !== 'all') params.set('status', activeTab);

    get<OrderListResponse>(`/orders?${params.toString()}`)
      .then((res) => { if (!cancelled) setData(res); })
      .catch((err) => { if (!cancelled) setError(err?.message ?? 'Failed to load orders'); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [activeTab, page, fetchKey]);

  function refreshOrders() {
    setLoading(true);
    setError(null);
    setFetchKey((k) => k + 1);
  }

  // ---- Open detail panel ---------------------------------------------------

  function openDetail(orderId: string) {
    setPanelOpen(true);
    setDetailLoading(true);

    get<Order>(`/orders/${orderId}`)
      .then(setSelectedOrder)
      .catch(() => setSelectedOrder(null))
      .finally(() => setDetailLoading(false));
  }

  function closePanel() {
    setPanelOpen(false);
    setTimeout(() => setSelectedOrder(null), 300);
  }

  // ---- Status update -------------------------------------------------------

  function updateStatus(orderId: string, newStatus: OrderStatus) {
    setStatusUpdating(true);

    put<Order>(`/orders/${orderId}/status`, { status: newStatus })
      .then((updated) => {
        setSelectedOrder(updated);
        refreshOrders();
      })
      .catch((err) => alert(err?.message ?? 'Failed to update status'))
      .finally(() => setStatusUpdating(false));
  }

  // ---- Tab change / pagination helpers -------------------------------------

  function handleTabChange(tab: OrderStatus | 'all') {
    setActiveTab(tab);
    setPage(1);
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PER_PAGE)) : 1;

  // ---- Render --------------------------------------------------------------

  return (
    <div className="relative">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: '#1A1A2E' }}>
          Order Management
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {data ? `${data.total} order${data.total !== 1 ? 's' : ''}` : 'Loading orders…'}
        </p>
      </div>

      {/* Status Filter Tabs */}
      <div className="mb-5 flex gap-1 overflow-x-auto rounded-lg bg-gray-100 p-1">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleTabChange(tab.value)}
            className={`whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.value
                ? 'bg-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            style={activeTab === tab.value ? { color: '#1E6B4F' } : undefined}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={refreshOrders} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* Orders Table */}
          <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-black/5">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50/80">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Order ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                    Items
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Total (ETB)
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Payment
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.items.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => openDetail(order.id)}
                    className="cursor-pointer transition-colors hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 font-mono text-sm" style={{ color: '#1A1A2E' }}>
                      {order.id.slice(0, 8)}…
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-700">
                      {order.items.length}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                      {formatCurrency(order.total)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {order.payment_method ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatDate(order.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {/* Slide-over Panel */}
      <OrderDetailPanel
        open={panelOpen}
        order={selectedOrder}
        loading={detailLoading}
        updating={statusUpdating}
        onClose={closePanel}
        onStatusChange={updateStatus}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

function StatusTimeline({ status }: { status: OrderStatus }) {
  const isCancelled = status === 'cancelled';
  const activeIndex = TIMELINE_STEPS.indexOf(status);

  return (
    <div className="flex items-center gap-1">
      {TIMELINE_STEPS.map((step, i) => {
        const reached = !isCancelled && i <= activeIndex;
        return (
          <div key={step} className="flex items-center gap-1">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                  reached
                    ? 'text-white'
                    : 'border-2 border-gray-300 text-gray-400'
                }`}
                style={reached ? { backgroundColor: '#1E6B4F' } : undefined}
              >
                {reached ? '✓' : i + 1}
              </div>
              <span className={`mt-1 text-[10px] ${reached ? 'font-medium text-gray-900' : 'text-gray-400'}`}>
                {STATUS_LABEL[step]}
              </span>
            </div>
            {i < TIMELINE_STEPS.length - 1 && (
              <div
                className={`mb-4 h-0.5 w-6 ${
                  !isCancelled && i < activeIndex ? 'bg-[#1E6B4F]' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        );
      })}
      {isCancelled && (
        <div className="ml-3 flex flex-col items-center">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
            ✕
          </div>
          <span className="mt-1 text-[10px] font-medium text-red-700">Cancelled</span>
        </div>
      )}
    </div>
  );
}

function OrderDetailPanel({
  open,
  order,
  loading,
  updating,
  onClose,
  onStatusChange,
}: {
  open: boolean;
  order: Order | null;
  loading: boolean;
  updating: boolean;
  onClose: () => void;
  onStatusChange: (orderId: string, status: OrderStatus) => void;
}) {
  const transitions = order ? TRANSITIONS[order.status] : [];

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity duration-300 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-lg transform overflow-y-auto bg-white shadow-xl transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Panel Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
          <h2 className="text-lg font-semibold" style={{ color: '#1A1A2E' }}>
            Order Details
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5">
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <p className="text-sm text-gray-500">Loading order details…</p>
            </div>
          ) : !order ? (
            <div className="flex h-40 items-center justify-center">
              <p className="text-sm text-red-500">Failed to load order.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Order ID + Status */}
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Order ID</p>
                <p className="mt-0.5 break-all font-mono text-sm" style={{ color: '#1A1A2E' }}>
                  {order.id}
                </p>
                <div className="mt-2">
                  <StatusBadge status={order.status} />
                </div>
              </div>

              {/* Timeline */}
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-400">
                  Status Timeline
                </p>
                <StatusTimeline status={order.status} />
              </div>

              {/* Items Table */}
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-400">
                  Items ({order.items.length})
                </p>
                <div className="overflow-hidden rounded-lg ring-1 ring-black/5">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Product</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Qty</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Price</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {order.items.map((item) => {
                        const lineTotal = item.quantity * parseFloat(item.unit_price);
                        return (
                          <tr key={item.id}>
                            <td className="px-3 py-2 text-sm text-gray-900">
                              {item.product_name ?? 'Unknown Product'}
                            </td>
                            <td className="px-3 py-2 text-center text-sm text-gray-700">
                              {item.quantity}
                            </td>
                            <td className="px-3 py-2 text-right text-sm text-gray-700">
                              {formatCurrency(item.unit_price)}
                            </td>
                            <td className="px-3 py-2 text-right text-sm font-medium text-gray-900">
                              {formatCurrency(lineTotal)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals */}
              <div className="rounded-lg p-4 ring-1 ring-black/5" style={{ backgroundColor: '#F4F4F8' }}>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(parseFloat(order.total) - parseFloat(order.delivery_fee))}</span>
                </div>
                <div className="mt-1 flex justify-between text-sm text-gray-600">
                  <span>Delivery Fee</span>
                  <span>{formatCurrency(order.delivery_fee)}</span>
                </div>
                <div className="mt-2 flex justify-between border-t border-gray-300 pt-2 text-sm font-semibold text-gray-900">
                  <span>Total</span>
                  <span>{formatCurrency(order.total)} ETB</span>
                </div>
              </div>

              {/* Meta */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Payment Method</p>
                  <p className="mt-0.5 text-sm text-gray-900">{order.payment_method ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Distributor</p>
                  <p className="mt-0.5 break-all font-mono text-xs text-gray-600">
                    {order.distributor_id.slice(0, 8)}…
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Created</p>
                  <p className="mt-0.5 text-sm text-gray-700">{formatDateTime(order.created_at)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Updated</p>
                  <p className="mt-0.5 text-sm text-gray-700">{formatDateTime(order.updated_at)}</p>
                </div>
              </div>

              {/* Status Action Buttons */}
              {transitions.length > 0 && (
                <div className="flex flex-wrap gap-3 border-t border-gray-200 pt-4">
                  {transitions.map((t) => (
                    <button
                      key={t.status}
                      onClick={() => onStatusChange(order.id, t.status)}
                      disabled={updating}
                      className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${t.style}`}
                    >
                      {updating ? 'Updating…' : t.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// State indicators
// ---------------------------------------------------------------------------

function LoadingState() {
  return (
    <div className="flex h-64 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-black/5">
      <div className="text-center">
        <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-[#1E6B4F]" />
        <p className="text-sm text-gray-500">Loading orders…</p>
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex h-64 flex-col items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-black/5">
      <p className="text-sm text-red-600">{message}</p>
      <button
        onClick={onRetry}
        className="mt-3 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
        style={{ backgroundColor: '#1E6B4F' }}
      >
        Retry
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex h-64 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-black/5">
      <div className="text-center">
        <svg className="mx-auto h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
        <p className="mt-2 text-sm text-gray-500">No orders found</p>
      </div>
    </div>
  );
}
