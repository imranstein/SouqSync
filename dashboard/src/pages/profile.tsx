import { useEffect, useState } from 'react';
import { get, put, ApiError } from '../lib/api';

interface UserProfile {
  id: string;
  phone: string;
  name: string | null;
  role: string;
  language_pref: string;
  telegram_chat_id: number | null;
  distributor_id: string | null;
  is_active: boolean;
  created_at: string;
}

const LANGUAGES: { value: string; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'am', label: 'Amharic' },
  { value: 'om', label: 'Afaan Oromo' },
];

const ROLE_STYLES: Record<string, string> = {
  distributor_admin: 'bg-blue-100 text-blue-700',
  kiosk_owner: 'bg-emerald-100 text-emerald-700',
  super_admin: 'bg-purple-100 text-purple-700',
};

function roleBadgeClass(role: string): string {
  return ROLE_STYLES[role] ?? 'bg-gray-100 text-gray-700';
}

function formatRole(role: string): string {
  return role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function truncateId(id: string): string {
  return id.length > 12 ? `${id.slice(0, 6)}...${id.slice(-4)}` : id;
}

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const [formName, setFormName] = useState('');
  const [formLang, setFormLang] = useState('en');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    get<UserProfile>('/users/me')
      .then((res) => {
        if (!cancelled) {
          setProfile(res);
          setFormName(res.name ?? '');
          setFormLang(res.language_pref ?? 'en');
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message ?? 'Failed to load profile');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveMsg(null);
    try {
      const updated = await put<UserProfile>('/users/me', {
        name: formName.trim() || null,
        language_pref: formLang,
      });
      setProfile(updated);
      setSaveMsg({ type: 'success', text: 'Profile updated successfully.' });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to update profile';
      setSaveMsg({ type: 'error', text: message });
    } finally {
      setSaving(false);
    }
  }

  const memberSince = profile
    ? new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  if (loading) return <PageShell><p className="text-gray-500">Loading profile...</p></PageShell>;
  if (error) return <PageShell><p className="text-red-600">{error}</p></PageShell>;
  if (!profile) return <PageShell><p className="text-gray-500">No profile found.</p></PageShell>;

  return (
    <PageShell>
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile Card */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-xl font-bold text-white">
              {(profile.name ?? profile.phone).charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold text-dark">{profile.name ?? 'Unnamed User'}</h2>
              <p className="text-sm text-gray-500">{profile.phone}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${roleBadgeClass(profile.role)}`}>
                  {formatRole(profile.role)}
                </span>
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${profile.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${profile.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  {profile.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-3 border-t border-gray-100 pt-5">
            <InfoRow label="Language" value={LANGUAGES.find((l) => l.value === profile.language_pref)?.label ?? profile.language_pref} />
            <InfoRow label="Member Since" value={memberSince} />
          </div>
        </div>

        {/* Edit Profile Form */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <h2 className="text-lg font-semibold text-dark">Edit Profile</h2>
          <form onSubmit={handleSave} className="mt-4 space-y-4">
            <div>
              <label htmlFor="profile-name" className="block text-sm font-medium text-gray-700">Name</label>
              <input
                id="profile-name"
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Your full name"
                className="mt-1 block w-full rounded-xl border border-gray-200 bg-light px-4 py-2.5 text-sm text-dark placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label htmlFor="profile-lang" className="block text-sm font-medium text-gray-700">Language Preference</label>
              <select
                id="profile-lang"
                value={formLang}
                onChange={(e) => setFormLang(e.target.value)}
                className="mt-1 block w-full rounded-xl border border-gray-200 bg-light px-4 py-2.5 text-sm text-dark focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.value} value={lang.value}>{lang.label}</option>
                ))}
              </select>
            </div>

            {saveMsg && (
              <div className={`rounded-xl px-4 py-3 text-sm ${saveMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                {saveMsg.text}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>

      {/* Account Info */}
      <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <h2 className="text-lg font-semibold text-dark">Account Information</h2>
        <div className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
          <InfoRow label="User ID" value={truncateId(profile.id)} mono />
          <InfoRow label="Phone" value={profile.phone} />
          <InfoRow label="Role" value={formatRole(profile.role)} />
          <InfoRow label="Account Status" value={profile.is_active ? 'Active' : 'Inactive'} />
          {profile.distributor_id && (
            <InfoRow label="Distributor ID" value={truncateId(profile.distributor_id)} mono />
          )}
          {profile.telegram_chat_id && (
            <InfoRow label="Telegram" value={`Connected (${profile.telegram_chat_id})`} />
          )}
        </div>
      </div>
    </PageShell>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-dark">Profile &amp; Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Manage your account details and preferences.</p>
      </div>
      {children}
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 sm:justify-start">
      <span className="w-32 shrink-0 text-sm text-gray-500">{label}</span>
      <span className={`text-sm font-medium text-dark ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}
