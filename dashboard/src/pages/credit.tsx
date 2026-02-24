import { useEffect, useState } from 'react';
import { get } from '../lib/api';

interface CreditProfile {
  id: string;
  user_id: string;
  credit_limit: string;
  current_balance: string;
  risk_score: number | null;
  is_active: boolean;
  created_at: string;
  available_credit: string;
}

function formatETB(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: 'ETB',
    minimumFractionDigits: 2,
  }).format(num);
}

function riskColor(score: number): { bg: string; text: string; label: string } {
  if (score < 30) return { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Low Risk' };
  if (score <= 60) return { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Medium Risk' };
  return { bg: 'bg-red-100', text: 'text-red-700', label: 'High Risk' };
}

function riskRingColor(score: number): string {
  if (score < 30) return 'stroke-emerald-500';
  if (score <= 60) return 'stroke-amber-500';
  return 'stroke-red-500';
}

export default function CreditPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<CreditProfile | null>(null);

  useEffect(() => {
    let cancelled = false;
    get<CreditProfile>('/credit/profile')
      .then((res) => {
        if (!cancelled) setProfile(res);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message ?? 'Failed to load credit profile');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <PageShell><p className="text-gray-500">Loading credit profile...</p></PageShell>;
  if (error) return <PageShell><p className="text-red-600">{error}</p></PageShell>;
  if (!profile) return <PageShell><p className="text-gray-500">No credit profile found.</p></PageShell>;

  const limit = parseFloat(profile.credit_limit);
  const balance = parseFloat(profile.current_balance);
  const available = parseFloat(profile.available_credit);
  const utilization = limit > 0 ? (balance / limit) * 100 : 0;
  const memberSince = new Date(profile.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <PageShell>
      {/* Credit Health Card */}
      <div className="rounded-2xl bg-linear-to-r from-primary to-primary-dark p-6 text-white shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-white/70">Available Credit</p>
            <p className="mt-1 text-3xl font-bold sm:text-4xl">{formatETB(available)}</p>

            <div className="mt-5">
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="text-white/70">Balance: {formatETB(balance)}</span>
                <span className="text-white/70">Limit: {formatETB(limit)}</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full rounded-full bg-accent transition-all duration-500"
                  style={{ width: `${Math.min(utilization, 100)}%` }}
                />
              </div>
              <p className="mt-1.5 text-xs text-white/50">{utilization.toFixed(1)}% utilized</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Risk Score Ring */}
            {profile.risk_score !== null ? (
              <div className="flex flex-col items-center">
                <div className="relative h-20 w-20">
                  <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="34" fill="none" stroke="white" strokeOpacity="0.2" strokeWidth="6" />
                    <circle
                      cx="40" cy="40" r="34" fill="none"
                      className={riskRingColor(profile.risk_score)}
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={`${(profile.risk_score / 100) * 213.6} 213.6`}
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-lg font-bold">
                    {Math.round(profile.risk_score)}
                  </span>
                </div>
                <span className={`mt-1.5 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${riskColor(profile.risk_score).bg} ${riskColor(profile.risk_score).text}`}>
                  {riskColor(profile.risk_score).label}
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white/20">
                  <span className="text-sm text-white/50">N/A</span>
                </div>
                <span className="mt-1.5 text-xs text-white/50">No score yet</span>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${profile.is_active ? 'bg-emerald-400/20 text-emerald-100' : 'bg-red-400/20 text-red-200'}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${profile.is_active ? 'bg-emerald-400' : 'bg-red-400'}`} />
                {profile.is_active ? 'Active' : 'Inactive'}
              </span>
              <p className="text-xs text-white/50">Member since {memberSince}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <SummaryCard label="Credit Limit" value={formatETB(limit)} icon={
          <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
          </svg>
        } />
        <SummaryCard label="Current Balance" value={formatETB(balance)} icon={
          <svg className="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        } />
        <SummaryCard label="Utilization Rate" value={`${utilization.toFixed(1)}%`} icon={
          <svg className="h-5 w-5 text-dark-light" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
        } />
      </div>

      {/* Info Section */}
      <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <h2 className="text-lg font-semibold text-dark">How Credit Works</h2>
        <div className="mt-3 space-y-3 text-sm leading-relaxed text-gray-600">
          <p>
            Your credit line lets you place orders up to your available credit limit and pay later.
            As you make payments, your available credit replenishes automatically.
          </p>
          <div>
            <h3 className="font-medium text-dark">Tips to Improve Your Credit Limit</h3>
            <ul className="mt-1.5 list-inside list-disc space-y-1 text-gray-500">
              <li>Maintain a consistent order history and pay on time</li>
              <li>Keep your utilization rate below 60%</li>
              <li>Verify your business details with your distributor</li>
              <li>Build a longer track record on the platform</li>
            </ul>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-dark">Credit Profile</h1>
        <p className="mt-1 text-sm text-gray-500">View your credit standing and utilization.</p>
      </div>
      {children}
    </div>
  );
}

function SummaryCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-light">
          {icon}
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500">{label}</p>
          <p className="text-xl font-bold text-dark">{value}</p>
        </div>
      </div>
    </div>
  );
}
