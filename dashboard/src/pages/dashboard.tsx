import { useAuth } from '../contexts/auth-context';

interface KpiCard {
  label: string;
  value: string;
  change: string;
  positive: boolean;
  icon: React.ReactNode;
}

const MOCK_KPIS: KpiCard[] = [
  {
    label: 'Orders Today',
    value: '47',
    change: '+12%',
    positive: true,
    icon: <ShoppingBagIcon />,
  },
  {
    label: 'Pending Orders',
    value: '8',
    change: '-3',
    positive: true,
    icon: <ClockIcon />,
  },
  {
    label: 'Revenue (ETB)',
    value: '128,450',
    change: '+23%',
    positive: true,
    icon: <CurrencyIcon />,
  },
  {
    label: 'Active Products',
    value: '312',
    change: '+5',
    positive: true,
    icon: <BoxIcon />,
  },
];

export default function DashboardPage() {
  const { user } = useAuth();

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

      {/* KPI Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {MOCK_KPIS.map((kpi) => (
          <div
            key={kpi.label}
            className="group rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 transition hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                {kpi.icon}
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  kpi.positive
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-700'
                }`}
              >
                {kpi.change}
              </span>
            </div>
            <p className="mt-4 text-2xl font-bold text-dark">{kpi.value}</p>
            <p className="mt-1 text-sm text-gray-500">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions / Recent Activity placeholder */}
      <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <h2 className="mb-4 text-lg font-semibold text-dark">Recent Orders</h2>
          <div className="flex flex-col items-center py-8 text-gray-400">
            <ShoppingBagIcon />
            <p className="mt-2 text-sm">Order data will appear here once the backend is connected.</p>
          </div>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <h2 className="mb-4 text-lg font-semibold text-dark">Low Stock Alerts</h2>
          <div className="flex flex-col items-center py-8 text-gray-400">
            <BoxIcon />
            <p className="mt-2 text-sm">Stock alerts will appear here once inventory is synced.</p>
          </div>
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
