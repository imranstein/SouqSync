import { Fragment, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { ApiError, del, get, post, put } from '../lib/api';
import { useAuth } from '../contexts/auth-context';

type TabId =
  | 'overview'
  | 'brand'
  | 'users'
  | 'roles'
  | 'tenants'
  | 'languages'
  | 'translations'
  | 'currencies'
  | 'features'
  | 'backup'
  | 'updates';

interface Language {
  id: string;
  code: string;
  name: string;
  native_name: string;
  is_rtl: boolean;
  is_default: boolean;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface LanguageListResponse {
  items: Language[];
  total: number;
}

interface Translation {
  id: string;
  language_id: string;
  tenant_id: string | null;
  namespace: string;
  key: string;
  value: string;
  created_at: string;
  updated_at: string;
}

interface TranslationListResponse {
  items: Translation[];
  total: number;
}

interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  decimal_places: number;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CurrencyListResponse {
  items: Currency[];
  total: number;
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
  locale: string;
  currency_code: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface TenantListResponse {
  items: Tenant[];
  total: number;
}

interface BrandSettings {
  app_name: string | null;
  logo_url: string | null;
  primary_color: string | null;
  accent_color: string | null;
}

interface FeatureFlagsResponse {
  features: Record<string, boolean>;
}

interface UserRow {
  id: string;
  phone: string;
  name: string | null;
  role: 'kiosk_owner' | 'distributor' | 'admin' | 'super_admin' | string;
  language_pref: string;
  tenant_id: string | null;
  is_active: boolean;
  created_at: string;
}

const TABS: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'brand', label: 'Brand' },
  { id: 'users', label: 'Users' },
  { id: 'roles', label: 'Roles & Permissions' },
  { id: 'tenants', label: 'Tenants' },
  { id: 'languages', label: 'Languages' },
  { id: 'translations', label: 'Translations' },
  { id: 'currencies', label: 'Currencies' },
  { id: 'features', label: 'Features' },
  { id: 'backup', label: 'Backup & Restore' },
  { id: 'updates', label: 'Updates' },
];

function canAccessSettings(role?: string): boolean {
  return role === 'admin' || role === 'super_admin';
}

function isSuperAdmin(role?: string): boolean {
  return role === 'super_admin';
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function classNames(...parts: Array<string | false | undefined | null>): string {
  return parts.filter(Boolean).join(' ');
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const tabs = useMemo(() => {
    const base = [...TABS];
    if (!isSuperAdmin(user?.role)) {
      return base.filter((t) => t.id !== 'tenants');
    }
    return base;
  }, [user?.role]);

  if (!canAccessSettings(user?.role)) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <h1 className="text-lg font-semibold text-dark">Settings</h1>
          <p className="mt-2 text-sm text-gray-600">
            You don’t have access to Settings. Please contact an administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-dark">Settings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage languages, translations, currencies, brand, users, features, backups, and updates.
          </p>
        </div>
        <div className="rounded-2xl bg-white px-4 py-3 text-sm shadow-sm ring-1 ring-black/5">
          <div className="flex items-center justify-between gap-4">
            <span className="text-gray-500">Role</span>
            <span className="font-semibold text-dark">{user?.role ?? '—'}</span>
          </div>
          <div className="mt-1 flex items-center justify-between gap-4">
            <span className="text-gray-500">Tenant</span>
            <span className="font-mono text-xs text-gray-700">{user?.tenant_id ?? '—'}</span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-2 shadow-sm ring-1 ring-black/5">
        <div className="no-scrollbar flex gap-1 overflow-x-auto p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={classNames(
                'whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition',
                activeTab === tab.id
                  ? 'bg-dark text-white'
                  : 'text-gray-600 hover:bg-light hover:text-dark',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'overview' && <OverviewSection />}
      {activeTab === 'brand' && <BrandSection />}
      {activeTab === 'users' && <UsersSection isSuperAdmin={isSuperAdmin(user?.role)} />}
      {activeTab === 'roles' && <RolesSection />}
      {activeTab === 'tenants' && isSuperAdmin(user?.role) && <TenantsSection />}
      {activeTab === 'languages' && <LanguagesSection isSuperAdmin={isSuperAdmin(user?.role)} />}
      {activeTab === 'translations' && <TranslationsSection isSuperAdmin={isSuperAdmin(user?.role)} />}
      {activeTab === 'currencies' && <CurrenciesSection isSuperAdmin={isSuperAdmin(user?.role)} />}
      {activeTab === 'features' && <FeaturesSection />}
      {activeTab === 'backup' && <BackupSection />}
      {activeTab === 'updates' && <UpdatesSection />}
    </div>
  );
}

function SectionShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-dark">{title}</h2>
        {subtitle ? <p className="text-sm text-gray-500">{subtitle}</p> : null}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function OverviewSection() {
  return (
    <SectionShell
      title="Overview"
      subtitle="Quick admin summary. Most settings are tenant-scoped (brand, features, backups), while languages/currencies are platform-wide."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-light p-4 ring-1 ring-black/5">
          <h3 className="text-sm font-semibold text-dark">Multi-tenancy</h3>
          <p className="mt-2 text-sm text-gray-600">
            Admin actions are tenant-bound. Super Admin can manage tenants and global data.
          </p>
        </div>
        <div className="rounded-2xl bg-light p-4 ring-1 ring-black/5">
          <h3 className="text-sm font-semibold text-dark">Localization</h3>
          <p className="mt-2 text-sm text-gray-600">
            Manage languages + translations for Ethiopia and neighboring regions. Use tenant-specific translations where needed.
          </p>
        </div>
      </div>
    </SectionShell>
  );
}

function BrandSection() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<BrandSettings>({
    app_name: null,
    logo_url: null,
    primary_color: null,
    accent_color: null,
  });
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    get<BrandSettings>('/settings/brand')
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message ?? 'Failed to load brand settings');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const updated = await put<BrandSettings>('/settings/brand', data);
      setData(updated);
      setMsg({ type: 'success', text: 'Brand settings saved.' });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to save brand settings';
      setMsg({ type: 'error', text: message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <SectionShell title="Brand" subtitle="Tenant brand: app name, logo, and primary colors.">
      {loading ? (
        <div className="text-sm text-gray-500">Loading…</div>
      ) : error ? (
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-200">{error}</div>
      ) : (
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="App name"
              value={data.app_name ?? ''}
              onChange={(v) => setData((s) => ({ ...s, app_name: v || null }))}
              placeholder="SoukSync"
            />
            <Field
              label="Logo URL"
              value={data.logo_url ?? ''}
              onChange={(v) => setData((s) => ({ ...s, logo_url: v || null }))}
              placeholder="https://…"
            />
            <Field
              label="Primary color"
              value={data.primary_color ?? ''}
              onChange={(v) => setData((s) => ({ ...s, primary_color: v || null }))}
              placeholder="#1E6B4F"
            />
            <Field
              label="Accent color"
              value={data.accent_color ?? ''}
              onChange={(v) => setData((s) => ({ ...s, accent_color: v || null }))}
              placeholder="#F5A623"
            />
          </div>

          {msg ? (
            <div
              className={classNames(
                'rounded-xl p-4 text-sm ring-1',
                msg.type === 'success' ? 'bg-emerald-50 text-emerald-800 ring-emerald-200' : 'bg-red-50 text-red-700 ring-red-200',
              )}
            >
              {msg.text}
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save brand'}
            </button>
          </div>
        </form>
      )}
    </SectionShell>
  );
}

function UsersSection({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [showCreate, setShowCreate] = useState(false);

  const [createPhone, setCreatePhone] = useState('');
  const [createName, setCreateName] = useState('');
  const [createRole, setCreateRole] = useState<UserRow['role']>('kiosk_owner');
  const [createTenantId, setCreateTenantId] = useState<string>('');
  const [createLanguagePref, setCreateLanguagePref] = useState('am');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  function loadUsers() {
    setLoading(true);
    setError(null);
    get<UserRow[]>('/users')
      .then((res) => setUsers(res))
      .catch((err) => setError(err?.message ?? 'Failed to load users'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      await post<UserRow>('/users', {
        phone: createPhone.trim(),
        name: createName.trim() || null,
        role: createRole,
        language_pref: createLanguagePref,
        tenant_id: isSuperAdmin ? (createTenantId.trim() || null) : null,
        is_active: true,
      });
      setShowCreate(false);
      setCreatePhone('');
      setCreateName('');
      setCreateRole('kiosk_owner');
      setCreateTenantId('');
      setCreateLanguagePref('am');
      setMsg({ type: 'success', text: 'User created.' });
      loadUsers();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to create user';
      setMsg({ type: 'error', text: message });
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(userId: string, patch: Partial<UserRow>) {
    setMsg(null);
    try {
      const updated = await put<UserRow>(`/users/by-id/${userId}`, patch);
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
      setMsg({ type: 'success', text: 'User updated.' });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to update user';
      setMsg({ type: 'error', text: message });
    }
  }

  return (
    <SectionShell
      title="Users"
      subtitle="Admin user management (tenant-scoped). Create users, set roles, and activate/deactivate."
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-gray-500">{loading ? 'Loading…' : `${users.length} users`}</div>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center justify-center rounded-xl bg-dark px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
          >
            Create user
          </button>
        </div>

        {msg ? (
          <div
            className={classNames(
              'rounded-xl p-4 text-sm ring-1',
              msg.type === 'success' ? 'bg-emerald-50 text-emerald-800 ring-emerald-200' : 'bg-red-50 text-red-700 ring-red-200',
            )}
          >
            {msg.text}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-200">{error}</div>
        ) : null}

        <div className="overflow-hidden rounded-2xl ring-1 ring-black/5">
          <table className="min-w-full divide-y divide-black/5 bg-white">
            <thead className="bg-light">
              <tr>
                <Th>Name</Th>
                <Th>Phone</Th>
                <Th>Role</Th>
                <Th>Language</Th>
                <Th>Status</Th>
                {isSuperAdmin ? <Th>Tenant</Th> : null}
                <Th>Created</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {loading ? (
                <tr>
                  <td className="px-4 py-6 text-sm text-gray-500" colSpan={isSuperAdmin ? 7 : 6}>
                    Loading…
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-sm text-gray-500" colSpan={isSuperAdmin ? 7 : 6}>
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-light/50">
                    <td className="px-4 py-3 text-sm text-dark">
                      <div className="font-medium">{u.name ?? '—'}</div>
                      <div className="mt-1 font-mono text-xs text-gray-400">{u.id}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{u.phone}</td>
                    <td className="px-4 py-3">
                      <select
                        value={u.role}
                        onChange={(e) => handleUpdate(u.id, { role: e.target.value })}
                        className="w-40 rounded-lg border border-black/10 bg-white px-2 py-1 text-sm text-dark shadow-sm outline-none focus:border-primary"
                      >
                        <option value="kiosk_owner">Kiosk Owner</option>
                        <option value="distributor">Distributor</option>
                        <option value="admin">Admin</option>
                        <option value="super_admin">Super Admin</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        value={u.language_pref}
                        onChange={(e) => handleUpdate(u.id, { language_pref: e.target.value })}
                        className="w-20 rounded-lg border border-black/10 bg-white px-2 py-1 text-sm text-dark shadow-sm outline-none focus:border-primary"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleUpdate(u.id, { is_active: !u.is_active })}
                        className={classNames(
                          'rounded-full px-3 py-1 text-xs font-semibold ring-1 transition',
                          u.is_active
                            ? 'bg-emerald-50 text-emerald-700 ring-emerald-200 hover:bg-emerald-100'
                            : 'bg-gray-100 text-gray-600 ring-gray-200 hover:bg-gray-200',
                        )}
                      >
                        {u.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    {isSuperAdmin ? (
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{u.tenant_id ?? '—'}</td>
                    ) : null}
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDate(u.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Create user"
        subtitle="This creates a user record so they can log in via OTP."
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Field label="Phone" value={createPhone} onChange={setCreatePhone} placeholder="+2519…" />
          <Field label="Name" value={createName} onChange={setCreateName} placeholder="Optional" />
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Role"
              value={createRole}
              onChange={setCreateRole}
              options={[
                { value: 'kiosk_owner', label: 'Kiosk Owner' },
                { value: 'distributor', label: 'Distributor' },
                { value: 'admin', label: 'Admin' },
                { value: 'super_admin', label: 'Super Admin' },
              ]}
            />
            <Field
              label="Language"
              value={createLanguagePref}
              onChange={setCreateLanguagePref}
              placeholder="am"
            />
          </div>
          {isSuperAdmin ? (
            <Field
              label="Tenant ID"
              value={createTenantId}
              onChange={setCreateTenantId}
              placeholder="Optional UUID"
            />
          ) : null}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-black/10 hover:bg-light"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60"
            >
              {saving ? 'Creating…' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </SectionShell>
  );
}

function RolesSection() {
  return (
    <SectionShell
      title="Roles & Permissions"
      subtitle="SoukSync uses a simple role model today (fast and safe for MVP)."
    >
      <div className="overflow-hidden rounded-2xl ring-1 ring-black/5">
        <table className="min-w-full divide-y divide-black/5 bg-white">
          <thead className="bg-light">
            <tr>
              <Th>Role</Th>
              <Th>Scope</Th>
              <Th>Permissions (MVP)</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            <tr>
              <td className="px-4 py-3 text-sm font-semibold text-dark">Kiosk Owner</td>
              <td className="px-4 py-3 text-sm text-gray-600">Own account</td>
              <td className="px-4 py-3 text-sm text-gray-600">View credit, place orders, view profile</td>
            </tr>
            <tr>
              <td className="px-4 py-3 text-sm font-semibold text-dark">Distributor</td>
              <td className="px-4 py-3 text-sm text-gray-600">Own tenant</td>
              <td className="px-4 py-3 text-sm text-gray-600">Manage inventory, manage orders, view analytics</td>
            </tr>
            <tr>
              <td className="px-4 py-3 text-sm font-semibold text-dark">Admin</td>
              <td className="px-4 py-3 text-sm text-gray-600">Tenant-scoped</td>
              <td className="px-4 py-3 text-sm text-gray-600">All distributor permissions + users + settings + features</td>
            </tr>
            <tr>
              <td className="px-4 py-3 text-sm font-semibold text-dark">Super Admin</td>
              <td className="px-4 py-3 text-sm text-gray-600">Platform-wide</td>
              <td className="px-4 py-3 text-sm text-gray-600">All admin permissions + tenants + delete global records</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-4 rounded-2xl bg-light p-4 ring-1 ring-black/5">
        <p className="text-sm text-gray-600">
          Next step (when needed): add <span className="font-semibold">custom roles + granular permissions</span> tables.
          For now, keeping it simple reduces security risk and speeds delivery.
        </p>
      </div>
    </SectionShell>
  );
}

function TenantsSection() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Tenant[]>([]);
  const [showCreate, setShowCreate] = useState(false);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [locale, setLocale] = useState('en');
  const [currencyCode, setCurrencyCode] = useState('ETB');
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    setError(null);
    get<TenantListResponse>('/tenants')
      .then((res) => setItems(res.items))
      .catch((err) => setError(err?.message ?? 'Failed to load tenants'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await post<Tenant>('/tenants', {
        name: name.trim(),
        slug: slug.trim(),
        locale: locale.trim(),
        currency_code: currencyCode.trim().toUpperCase(),
      });
      setShowCreate(false);
      setName('');
      setSlug('');
      setLocale('en');
      setCurrencyCode('ETB');
      load();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to create tenant';
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <SectionShell title="Tenants" subtitle="Platform tenants (Super Admin only).">
      <div className="flex items-center justify-between gap-4">
        <div className="text-sm text-gray-500">{loading ? 'Loading…' : `${items.length} tenants`}</div>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="rounded-xl bg-dark px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
        >
          Create tenant
        </button>
      </div>

      {error ? (
        <div className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-200">{error}</div>
      ) : null}

      <div className="mt-4 overflow-hidden rounded-2xl ring-1 ring-black/5">
        <table className="min-w-full divide-y divide-black/5 bg-white">
          <thead className="bg-light">
            <tr>
              <Th>Name</Th>
              <Th>Slug</Th>
              <Th>Locale</Th>
              <Th>Currency</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {loading ? (
              <tr>
                <td className="px-4 py-6 text-sm text-gray-500" colSpan={5}>
                  Loading…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-sm text-gray-500" colSpan={5}>
                  No tenants found.
                </td>
              </tr>
            ) : (
              items.map((t) => (
                <tr key={t.id} className="hover:bg-light/50">
                  <td className="px-4 py-3 text-sm text-dark">
                    <div className="font-medium">{t.name}</div>
                    <div className="mt-1 font-mono text-xs text-gray-400">{t.id}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{t.slug}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{t.locale}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{t.currency_code}</td>
                  <td className="px-4 py-3">
                    <span
                      className={classNames(
                        'rounded-full px-3 py-1 text-xs font-semibold ring-1',
                        t.is_active ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-gray-100 text-gray-600 ring-gray-200',
                      )}
                    >
                      {t.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create tenant">
        <form onSubmit={handleCreate} className="space-y-4">
          <Field label="Name" value={name} onChange={setName} placeholder="e.g. Addis Distributor Group" />
          <Field label="Slug" value={slug} onChange={setSlug} placeholder="e.g. addis-distributors" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Locale" value={locale} onChange={setLocale} placeholder="en" />
            <Field label="Currency code" value={currencyCode} onChange={setCurrencyCode} placeholder="ETB" />
          </div>
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-black/10 hover:bg-light"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60"
            >
              {saving ? 'Creating…' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </SectionShell>
  );
}

function LanguagesSection({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Language[]>([]);
  const [showUpsert, setShowUpsert] = useState(false);
  const [editing, setEditing] = useState<Language | null>(null);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [nativeName, setNativeName] = useState('');
  const [isRtl, setIsRtl] = useState(false);
  const [isDefault, setIsDefault] = useState(false);
  const [sortOrder, setSortOrder] = useState('0');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    setError(null);
    get<LanguageListResponse>('/languages?active_only=false')
      .then((res) => setItems(res.items))
      .catch((err) => setError(err?.message ?? 'Failed to load languages'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditing(null);
    setCode('');
    setName('');
    setNativeName('');
    setIsRtl(false);
    setIsDefault(false);
    setSortOrder('0');
    setIsActive(true);
    setShowUpsert(true);
  }

  function openEdit(lang: Language) {
    setEditing(lang);
    setCode(lang.code);
    setName(lang.name);
    setNativeName(lang.native_name);
    setIsRtl(lang.is_rtl);
    setIsDefault(lang.is_default);
    setSortOrder(String(lang.sort_order));
    setIsActive(lang.is_active);
    setShowUpsert(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (editing) {
        await put<Language>(`/languages/${editing.id}`, {
          name: name.trim() || null,
          native_name: nativeName.trim() || null,
          is_rtl: isRtl,
          is_default: isDefault,
          sort_order: Number(sortOrder || 0),
          is_active: isActive,
        });
      } else {
        await post<Language>('/languages', {
          code: code.trim(),
          name: name.trim(),
          native_name: nativeName.trim(),
          is_rtl: isRtl,
          is_default: isDefault,
          sort_order: Number(sortOrder || 0),
        });
      }
      setShowUpsert(false);
      load();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to save language';
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(lang: Language) {
    if (!isSuperAdmin) return;
    const ok = window.confirm(`Delete language "${lang.code}"? This cannot be undone.`);
    if (!ok) return;
    setError(null);
    try {
      await del<void>(`/languages/${lang.id}`);
      load();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to delete language';
      setError(message);
    }
  }

  return (
    <SectionShell
      title="Languages"
      subtitle="Platform languages (seeded for Ethiopia + neighbors). Add or update supported languages."
    >
      <div className="flex items-center justify-between gap-4">
        <div className="text-sm text-gray-500">{loading ? 'Loading…' : `${items.length} languages`}</div>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-xl bg-dark px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
        >
          Add language
        </button>
      </div>

      {error ? (
        <div className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-200">{error}</div>
      ) : null}

      <div className="mt-4 overflow-hidden rounded-2xl ring-1 ring-black/5">
        <table className="min-w-full divide-y divide-black/5 bg-white">
          <thead className="bg-light">
            <tr>
              <Th>Code</Th>
              <Th>Name</Th>
              <Th>Native</Th>
              <Th>RTL</Th>
              <Th>Default</Th>
              <Th>Status</Th>
              <Th />
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {loading ? (
              <tr>
                <td className="px-4 py-6 text-sm text-gray-500" colSpan={7}>
                  Loading…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-sm text-gray-500" colSpan={7}>
                  No languages found.
                </td>
              </tr>
            ) : (
              items
                .slice()
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((l) => (
                  <tr key={l.id} className="hover:bg-light/50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">{l.code}</td>
                    <td className="px-4 py-3 text-sm text-dark">{l.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{l.native_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{l.is_rtl ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-3">
                      {l.is_default ? (
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                          Default
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={classNames(
                          'rounded-full px-3 py-1 text-xs font-semibold ring-1',
                          l.is_active ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-gray-100 text-gray-600 ring-gray-200',
                        )}
                      >
                        {l.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(l)}
                          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-dark ring-1 ring-black/10 hover:bg-light"
                        >
                          Edit
                        </button>
                        {isSuperAdmin ? (
                          <button
                            type="button"
                            onClick={() => handleDelete(l)}
                            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600 ring-1 ring-red-200 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={showUpsert}
        onClose={() => setShowUpsert(false)}
        title={editing ? 'Edit language' : 'Add language'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Code" value={code} onChange={setCode} placeholder="e.g. am" disabled={!!editing} />
            <Field label="Sort order" value={sortOrder} onChange={setSortOrder} placeholder="0" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" value={name} onChange={setName} placeholder="e.g. Amharic" />
            <Field label="Native name" value={nativeName} onChange={setNativeName} placeholder="e.g. አማርኛ" />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <ToggleField label="RTL" checked={isRtl} onChange={setIsRtl} />
            <ToggleField label="Default" checked={isDefault} onChange={setIsDefault} />
            {editing ? <ToggleField label="Active" checked={isActive} onChange={setIsActive} /> : null}
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowUpsert(false)}
              className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-black/10 hover:bg-light"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </Modal>
    </SectionShell>
  );
}

function TranslationsSection({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [languages, setLanguages] = useState<Language[]>([]);
  const [selectedLanguageId, setSelectedLanguageId] = useState<string>('');
  const [namespace, setNamespace] = useState('common');
  const [tenantId, setTenantId] = useState<string>(user?.tenant_id ?? '');

  const [items, setItems] = useState<Translation[]>([]);
  const [showCreate, setShowCreate] = useState(false);

  const [createKey, setCreateKey] = useState('');
  const [createValue, setCreateValue] = useState('');
  const [saving, setSaving] = useState(false);

  async function loadLanguages() {
    const res = await get<LanguageListResponse>('/languages?active_only=true');
    setLanguages(res.items);
    if (!selectedLanguageId) {
      const defaultLang = res.items.find((l) => l.is_default) ?? res.items[0];
      if (defaultLang) setSelectedLanguageId(defaultLang.id);
    }
  }

  async function loadTranslations(langId: string) {
    setLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams();
      q.set('language_id', langId);
      q.set('namespace', namespace);
      if (tenantId.trim()) q.set('tenant_id', tenantId.trim());
      const res = await get<TranslationListResponse>(`/translations?${q.toString()}`);
      setItems(res.items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load translations');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    loadLanguages()
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Failed to load languages');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedLanguageId) return;
    loadTranslations(selectedLanguageId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLanguageId, namespace, tenantId]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedLanguageId) return;
    setSaving(true);
    setError(null);
    try {
      await post<Translation>('/translations', {
        language_id: selectedLanguageId,
        tenant_id: tenantId.trim() || null,
        namespace: namespace.trim(),
        key: createKey.trim(),
        value: createValue,
      });
      setShowCreate(false);
      setCreateKey('');
      setCreateValue('');
      await loadTranslations(selectedLanguageId);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to create translation';
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(id: string, value: string) {
    setError(null);
    try {
      const updated = await put<Translation>(`/translations/${id}`, { value });
      setItems((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to update translation';
      setError(message);
    }
  }

  async function handleDelete(t: Translation) {
    if (!isSuperAdmin) return;
    const ok = window.confirm(`Delete translation "${t.namespace}.${t.key}"?`);
    if (!ok) return;
    setError(null);
    try {
      await del<void>(`/translations/${t.id}`);
      setItems((prev) => prev.filter((x) => x.id !== t.id));
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to delete translation';
      setError(message);
    }
  }

  return (
    <SectionShell title="Translations" subtitle="Manage translation key/value pairs by language and namespace.">
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl bg-light p-4 ring-1 ring-black/5 lg:col-span-1">
          <div className="space-y-3">
            <SelectField
              label="Language"
              value={selectedLanguageId}
              onChange={setSelectedLanguageId}
              options={languages.map((l) => ({
                value: l.id,
                label: `${l.name} (${l.code})`,
              }))}
            />
            <Field label="Namespace" value={namespace} onChange={setNamespace} placeholder="common" />
            {isSuperAdmin ? (
              <Field
                label="Tenant ID (optional)"
                value={tenantId}
                onChange={setTenantId}
                placeholder="Leave empty for global translations"
              />
            ) : (
              <div className="rounded-xl bg-white/70 p-3 text-xs text-gray-600 ring-1 ring-black/5">
                <div className="font-semibold text-gray-700">Tenant scope</div>
                <div className="mt-1 font-mono">{user?.tenant_id ?? '—'}</div>
                <div className="mt-1 text-gray-500">
                  Tenant admins manage only their tenant translations.
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="w-full rounded-xl bg-dark px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
            >
              Add translation
            </button>
            <p className="text-xs text-gray-500">
              Tip: use tenant-specific translations for brand wording or custom terms; keep most keys global.
            </p>
          </div>
        </div>

        <div className="lg:col-span-2">
          {error ? (
            <div className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-200">{error}</div>
          ) : null}

          <div className="overflow-hidden rounded-2xl ring-1 ring-black/5">
            <table className="min-w-full divide-y divide-black/5 bg-white">
              <thead className="bg-light">
                <tr>
                  <Th>Key</Th>
                  <Th>Value</Th>
                  <Th>Scope</Th>
                  <Th />
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {loading ? (
                  <tr>
                    <td className="px-4 py-6 text-sm text-gray-500" colSpan={4}>
                      Loading…
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-sm text-gray-500" colSpan={4}>
                      No translations found.
                    </td>
                  </tr>
                ) : (
                  items.map((t) => (
                    <TranslationRow
                      key={`${t.id}:${t.updated_at}`}
                      translation={t}
                      onSave={(v) => handleUpdate(t.id, v)}
                      onDelete={isSuperAdmin ? () => handleDelete(t) : undefined}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add translation">
        <form onSubmit={handleCreate} className="space-y-4">
          <Field label="Key" value={createKey} onChange={setCreateKey} placeholder="e.g. dashboard.title" />
          <TextAreaField label="Value" value={createValue} onChange={setCreateValue} placeholder="Translation text" />
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-black/10 hover:bg-light"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </SectionShell>
  );
}

function TranslationRow({
  translation,
  onSave,
  onDelete,
}: {
  translation: Translation;
  onSave: (value: string) => void;
  onDelete?: () => void;
}) {
  const [value, setValue] = useState(translation.value);
  const dirty = value !== translation.value;

  return (
    <tr className="hover:bg-light/50">
      <td className="px-4 py-3 font-mono text-xs text-gray-700">{translation.key}</td>
      <td className="px-4 py-3">
        <input
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
          }}
          className="w-full rounded-lg border border-black/10 bg-white px-2 py-1 text-sm text-dark shadow-sm outline-none focus:border-primary"
        />
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">{translation.tenant_id ? 'Tenant' : 'Global'}</td>
      <td className="px-4 py-3 text-right">
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => onSave(value)}
            disabled={!dirty}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-dark ring-1 ring-black/10 hover:bg-light disabled:opacity-50"
          >
            Save
          </button>
          {onDelete ? (
            <button
              type="button"
              onClick={onDelete}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600 ring-1 ring-red-200 hover:bg-red-50"
            >
              Delete
            </button>
          ) : null}
        </div>
      </td>
    </tr>
  );
}

function CurrenciesSection({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Currency[]>([]);
  const [showUpsert, setShowUpsert] = useState(false);
  const [editing, setEditing] = useState<Currency | null>(null);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [decimalPlaces, setDecimalPlaces] = useState('2');
  const [isDefault, setIsDefault] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    setError(null);
    get<CurrencyListResponse>('/currencies?active_only=false')
      .then((res) => setItems(res.items))
      .catch((err) => setError(err?.message ?? 'Failed to load currencies'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditing(null);
    setCode('');
    setName('');
    setSymbol('');
    setDecimalPlaces('2');
    setIsDefault(false);
    setIsActive(true);
    setShowUpsert(true);
  }

  function openEdit(c: Currency) {
    setEditing(c);
    setCode(c.code);
    setName(c.name);
    setSymbol(c.symbol);
    setDecimalPlaces(String(c.decimal_places));
    setIsDefault(c.is_default);
    setIsActive(c.is_active);
    setShowUpsert(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (editing) {
        await put<Currency>(`/currencies/${editing.id}`, {
          name: name.trim() || null,
          symbol: symbol.trim() || null,
          decimal_places: Number(decimalPlaces || 2),
          is_default: isDefault,
          is_active: isActive,
        });
      } else {
        await post<Currency>('/currencies', {
          code: code.trim().toUpperCase(),
          name: name.trim(),
          symbol: symbol.trim(),
          decimal_places: Number(decimalPlaces || 2),
          is_default: isDefault,
        });
      }
      setShowUpsert(false);
      load();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to save currency';
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(c: Currency) {
    if (!isSuperAdmin) return;
    const ok = window.confirm(`Delete currency "${c.code}"? This cannot be undone.`);
    if (!ok) return;
    setError(null);
    try {
      await del<void>(`/currencies/${c.id}`);
      load();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to delete currency';
      setError(message);
    }
  }

  return (
    <SectionShell title="Currencies" subtitle="Platform currencies. Seeded for Ethiopia and neighboring regions.">
      <div className="flex items-center justify-between gap-4">
        <div className="text-sm text-gray-500">{loading ? 'Loading…' : `${items.length} currencies`}</div>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-xl bg-dark px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
        >
          Add currency
        </button>
      </div>

      {error ? (
        <div className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-200">{error}</div>
      ) : null}

      <div className="mt-4 overflow-hidden rounded-2xl ring-1 ring-black/5">
        <table className="min-w-full divide-y divide-black/5 bg-white">
          <thead className="bg-light">
            <tr>
              <Th>Code</Th>
              <Th>Name</Th>
              <Th>Symbol</Th>
              <Th>Decimals</Th>
              <Th>Default</Th>
              <Th>Status</Th>
              <Th />
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {loading ? (
              <tr>
                <td className="px-4 py-6 text-sm text-gray-500" colSpan={7}>
                  Loading…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-sm text-gray-500" colSpan={7}>
                  No currencies found.
                </td>
              </tr>
            ) : (
              items.map((c) => (
                <tr key={c.id} className="hover:bg-light/50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-700">{c.code}</td>
                  <td className="px-4 py-3 text-sm text-dark">{c.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{c.symbol}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{c.decimal_places}</td>
                  <td className="px-4 py-3">
                    {c.is_default ? (
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                        Default
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={classNames(
                        'rounded-full px-3 py-1 text-xs font-semibold ring-1',
                        c.is_active ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-gray-100 text-gray-600 ring-gray-200',
                      )}
                    >
                      {c.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(c)}
                        className="rounded-lg px-3 py-1.5 text-xs font-semibold text-dark ring-1 ring-black/10 hover:bg-light"
                      >
                        Edit
                      </button>
                      {isSuperAdmin ? (
                        <button
                          type="button"
                          onClick={() => handleDelete(c)}
                          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600 ring-1 ring-red-200 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={showUpsert}
        onClose={() => setShowUpsert(false)}
        title={editing ? 'Edit currency' : 'Add currency'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Code" value={code} onChange={setCode} placeholder="ETB" disabled={!!editing} />
            <Field label="Decimals" value={decimalPlaces} onChange={setDecimalPlaces} placeholder="2" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" value={name} onChange={setName} placeholder="Ethiopian Birr" />
            <Field label="Symbol" value={symbol} onChange={setSymbol} placeholder="Br" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <ToggleField label="Default" checked={isDefault} onChange={setIsDefault} />
            {editing ? <ToggleField label="Active" checked={isActive} onChange={setIsActive} /> : null}
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowUpsert(false)}
              className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-black/10 hover:bg-light"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </Modal>
    </SectionShell>
  );
}

function FeaturesSection() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [features, setFeatures] = useState<Record<string, boolean>>({});
  const [newKey, setNewKey] = useState('');
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    setError(null);
    get<FeatureFlagsResponse>('/settings/features')
      .then((res) => setFeatures(res.features ?? {}))
      .catch((err) => setError(err?.message ?? 'Failed to load features'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function toggle(key: string, enabled: boolean) {
    setSaving(true);
    setError(null);
    try {
      await put<Record<string, boolean>>(`/settings/features/${encodeURIComponent(key)}?enabled=${enabled}`, undefined);
      setFeatures((prev) => ({ ...prev, [key]: enabled }));
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to update feature';
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  async function addFeature(e: React.FormEvent) {
    e.preventDefault();
    const key = newKey.trim();
    if (!key) return;
    await toggle(key, false);
    setNewKey('');
  }

  const keys = Object.keys(features).sort();

  return (
    <SectionShell title="Features" subtitle="Tenant feature flags (feature toggles).">
      {error ? (
        <div className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-200">{error}</div>
      ) : null}

      <form onSubmit={addFeature} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="block text-xs font-semibold text-gray-600">New feature key</label>
          <input
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            placeholder="e.g. new_checkout"
            className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-dark shadow-sm outline-none focus:border-primary"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-dark px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60"
        >
          Add
        </button>
        <button
          type="button"
          onClick={load}
          className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-black/10 hover:bg-light"
        >
          Refresh
        </button>
      </form>

      <div className="mt-4 overflow-hidden rounded-2xl ring-1 ring-black/5">
        <table className="min-w-full divide-y divide-black/5 bg-white">
          <thead className="bg-light">
            <tr>
              <Th>Key</Th>
              <Th>Status</Th>
              <Th />
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {loading ? (
              <tr>
                <td className="px-4 py-6 text-sm text-gray-500" colSpan={3}>
                  Loading…
                </td>
              </tr>
            ) : keys.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-sm text-gray-500" colSpan={3}>
                  No feature flags yet.
                </td>
              </tr>
            ) : (
              keys.map((k) => (
                <tr key={k} className="hover:bg-light/50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-700">{k}</td>
                  <td className="px-4 py-3">
                    <span
                      className={classNames(
                        'rounded-full px-3 py-1 text-xs font-semibold ring-1',
                        features[k] ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-gray-100 text-gray-600 ring-gray-200',
                      )}
                    >
                      {features[k] ? 'Enabled' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => toggle(k, !features[k])}
                      disabled={saving}
                      className="rounded-lg px-3 py-1.5 text-xs font-semibold text-dark ring-1 ring-black/10 hover:bg-light disabled:opacity-50"
                    >
                      Toggle
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </SectionShell>
  );
}

function BackupSection() {
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [backups, setBackups] = useState<{ items: unknown[]; total: number } | null>(null);

  async function trigger() {
    setLoading(true);
    setMsg(null);
    try {
      const res = await post<{ status: string; message: string }>('/settings/backup');
      setMsg({ type: 'success', text: res.message ?? 'Backup requested.' });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to request backup';
      setMsg({ type: 'error', text: message });
    } finally {
      setLoading(false);
    }
  }

  async function loadList() {
    setLoading(true);
    setMsg(null);
    try {
      const res = await get<{ items: unknown[]; total: number }>('/settings/backups');
      setBackups(res);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to load backups';
      setMsg({ type: 'error', text: message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadList();
  }, []);

  return (
    <SectionShell
      title="Backup & Restore"
      subtitle="Backups are queued (MVP stub). Next step: implement actual DB backups and restore workflow."
    >
      {msg ? (
        <div
          className={classNames(
            'mb-4 rounded-xl p-4 text-sm ring-1',
            msg.type === 'success' ? 'bg-emerald-50 text-emerald-800 ring-emerald-200' : 'bg-red-50 text-red-700 ring-red-200',
          )}
        >
          {msg.text}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={trigger}
          disabled={loading}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60"
        >
          {loading ? 'Working…' : 'Trigger backup'}
        </button>
        <button
          type="button"
          onClick={loadList}
          disabled={loading}
          className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-black/10 hover:bg-light disabled:opacity-60"
        >
          Refresh list
        </button>
      </div>

      <div className="mt-4 rounded-2xl bg-light p-4 ring-1 ring-black/5">
        <p className="text-sm text-gray-600">
          Backups found: <span className="font-semibold">{backups?.total ?? '—'}</span>
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Restore flow will be added once backups are stored (S3/R2) with encryption + audit logging.
        </p>
      </div>
    </SectionShell>
  );
}

function UpdatesSection() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await get<Record<string, unknown>>('/settings/updates');
      setData(res);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to check for updates';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const updateAvailable = Boolean(data && data.update_available);

  return (
    <SectionShell
      title="Updates"
      subtitle="Checks GitHub releases. Production self-update requires deployment automation (not enabled by default)."
    >
      <div className="flex items-center justify-between gap-4">
        <div className="text-sm text-gray-500">{loading ? 'Checking…' : 'Status'}</div>
        <button
          type="button"
          onClick={load}
          className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-black/10 hover:bg-light"
        >
          Check again
        </button>
      </div>

      {error ? (
        <div className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-200">{error}</div>
      ) : null}

      {data ? (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-light p-4 ring-1 ring-black/5">
            <p className="text-sm text-gray-500">Current version</p>
            <p className="mt-1 font-mono text-sm font-semibold text-dark">{String(data.current_version ?? '—')}</p>
          </div>
          <div className="rounded-2xl bg-light p-4 ring-1 ring-black/5">
            <p className="text-sm text-gray-500">Latest release</p>
            <p className="mt-1 font-mono text-sm font-semibold text-dark">{String(data.latest_version ?? '—')}</p>
          </div>
          <div className="md:col-span-2">
            <div
              className={classNames(
                'rounded-2xl p-4 ring-1',
                updateAvailable ? 'bg-amber-50 text-amber-900 ring-amber-200' : 'bg-emerald-50 text-emerald-900 ring-emerald-200',
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold">
                  {updateAvailable ? 'Update available' : 'You are up to date'}
                </p>
                {typeof data.url === 'string' ? (
                  <a
                    href={data.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg bg-white/70 px-3 py-1.5 text-xs font-semibold text-dark ring-1 ring-black/10 hover:bg-white"
                  >
                    View on GitHub
                  </a>
                ) : null}
              </div>
              {updateAvailable ? (
                <p className="mt-2 text-sm">
                  To update the hosted environment, deploy the new release (CI/CD or container pull). Automatic self-update
                  is intentionally not enabled by default for safety.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </SectionShell>
  );
}

function Th({ children }: { children?: ReactNode }) {
  return (
    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
      {children}
    </th>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-dark shadow-sm outline-none focus:border-primary disabled:bg-gray-50 disabled:text-gray-500"
      />
    </div>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-dark shadow-sm outline-none focus:border-primary"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-dark shadow-sm outline-none focus:border-primary"
      >
        {options.length === 0 ? <option value="">No options</option> : null}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-xl bg-light px-3 py-2 ring-1 ring-black/5">
      <span className="text-sm font-medium text-dark">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={classNames(
          'relative inline-flex h-6 w-11 items-center rounded-full transition',
          checked ? 'bg-primary' : 'bg-gray-300',
        )}
        aria-pressed={checked}
      >
        <span
          className={classNames(
            'inline-block h-5 w-5 transform rounded-full bg-white transition',
            checked ? 'translate-x-5' : 'translate-x-1',
          )}
        />
      </button>
    </label>
  );
}

function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <TransitionChild
          as={Fragment}
          enter="transition-opacity duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-dark/40" />
        </TransitionChild>
        <div className="fixed inset-0 overflow-y-auto p-4">
          <div className="flex min-h-full items-center justify-center">
            <TransitionChild
              as={Fragment}
              enter="transition-transform duration-200"
              enterFrom="translate-y-2 opacity-0"
              enterTo="translate-y-0 opacity-100"
              leave="transition-transform duration-150"
              leaveFrom="translate-y-0 opacity-100"
              leaveTo="translate-y-2 opacity-0"
            >
              <DialogPanel className="w-full max-w-xl overflow-hidden rounded-2xl bg-white p-6 shadow-xl ring-1 ring-black/10">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-dark">{title}</h3>
                    {subtitle ? <p className="mt-1 text-sm text-gray-500">{subtitle}</p> : null}
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg p-2 text-gray-400 hover:bg-light hover:text-dark"
                    aria-label="Close"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="mt-5">{children}</div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

