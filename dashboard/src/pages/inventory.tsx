import { useEffect, useState, useCallback } from 'react';
import { get, post, put, del, ApiError } from '../lib/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

interface ProductFormData {
  name: string;
  price: string;
  sku: string;
  category: string;
}

type SortField = 'name' | 'sku' | 'price' | 'category' | 'is_active' | 'created_at';
type SortDir = 'asc' | 'desc';

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'beverages', label: 'Beverages' },
  { value: 'cooking_oil', label: 'Cooking Oil' },
  { value: 'flour', label: 'Flour' },
  { value: 'snacks', label: 'Snacks' },
  { value: 'personal_care', label: 'Personal Care' },
  { value: 'household', label: 'Household' },
];

const PER_PAGE = 20;
const PLACEHOLDER_DISTRIBUTOR = '00000000-0000-0000-0000-000000000001';

const EMPTY_FORM: ProductFormData = { name: '', price: '', sku: '', category: '' };

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function InventoryPage() {
  const [data, setData] = useState<ProductListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);

  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductFormData>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ---- debounce search ----
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  // ---- fetch products ----
  const fetchProducts = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('per_page', String(PER_PAGE));
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (categoryFilter) params.set('category', categoryFilter);

    get<ProductListResponse>(`/products?${params.toString()}`)
      .then((res) => { if (!cancelled) setData(res); })
      .catch((err) => { if (!cancelled) setError(err?.message ?? 'Failed to load products'); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [page, debouncedSearch, categoryFilter]);

  useEffect(() => fetchProducts(), [fetchProducts]);

  // ---- sorting (client-side on current page) ----
  const sortedItems = data ? [...data.items].sort((a, b) => {
    let aVal: string | number | boolean = '';
    let bVal: string | number | boolean = '';

    switch (sortField) {
      case 'name':       aVal = a.name.toLowerCase();           bVal = b.name.toLowerCase(); break;
      case 'sku':        aVal = (a.sku ?? '').toLowerCase();    bVal = (b.sku ?? '').toLowerCase(); break;
      case 'price':      aVal = parseFloat(a.price) || 0;       bVal = parseFloat(b.price) || 0; break;
      case 'category':   aVal = (a.category ?? '').toLowerCase(); bVal = (b.category ?? '').toLowerCase(); break;
      case 'is_active':  aVal = a.is_active ? 1 : 0;            bVal = b.is_active ? 1 : 0; break;
      case 'created_at': aVal = a.created_at;                    bVal = b.created_at; break;
    }

    if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
    return 0;
  }) : [];

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PER_PAGE)) : 1;

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  }

  function sortIndicator(field: SortField) {
    if (sortField !== field) return ' ↕';
    return sortDir === 'asc' ? ' ↑' : ' ↓';
  }

  // ---- modal helpers ----
  function openCreateModal() {
    setEditingProduct(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setModalOpen(true);
  }

  function openEditModal(p: Product) {
    setEditingProduct(p);
    setForm({
      name: p.name,
      price: p.price,
      sku: p.sku ?? '',
      category: p.category ?? '',
    });
    setFormError(null);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingProduct(null);
    setForm(EMPTY_FORM);
    setFormError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setFormError('Name is required.'); return; }
    const price = parseFloat(form.price);
    if (isNaN(price) || price < 0) { setFormError('Price must be a valid number.'); return; }

    setSubmitting(true);
    setFormError(null);

    try {
      const body: Record<string, unknown> = {
        name: form.name.trim(),
        price,
      };
      if (form.sku.trim()) body.sku = form.sku.trim();
      if (form.category) body.category = form.category;

      if (editingProduct) {
        await put(`/products/${editingProduct.id}`, body);
      } else {
        body.distributor_id = PLACEHOLDER_DISTRIBUTOR;
        await post('/products', body);
      }
      closeModal();
      fetchProducts();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  // ---- delete ----
  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await del(`/products/${deleteTarget.id}`).catch((err) => {
        if (err instanceof ApiError) throw err;
        // 204 No Content causes JSON parse to fail — that's a success
      });
      setDeleteTarget(null);
      fetchProducts();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete product.');
    } finally {
      setDeleting(false);
    }
  }

  // ---- CSV export ----
  function exportCSV() {
    if (!sortedItems.length) return;
    const header = ['Name', 'SKU', 'Price (ETB)', 'Category', 'Status', 'Created'];
    const rows = sortedItems.map((p) => [
      `"${p.name.replace(/"/g, '""')}"`,
      p.sku ?? '',
      p.price,
      p.category ?? '',
      p.is_active ? 'Active' : 'Inactive',
      new Date(p.created_at).toLocaleDateString(),
    ]);
    const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `souksync-products-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ---- render ----
  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark">Inventory Management</h1>
          <p className="mt-1 text-sm text-gray-500">Track and manage your product catalog.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90"
        >
          <PlusIcon />
          Add Product
        </button>
      </div>

      {/* Filters + Bulk Actions */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-3">
          <div className="relative flex-1 max-w-md">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search products…"
              aria-label="Search products"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm text-dark placeholder:text-gray-400 ring-1 ring-black/5 focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-dark ring-1 ring-black/5 focus:outline-none focus:ring-2 focus:ring-primary/40"
            aria-label="Filter by category"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        <button
          onClick={exportCSV}
          disabled={!sortedItems.length}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-dark ring-1 ring-black/5 transition hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <DownloadIcon />
          Export CSV
        </button>
      </div>

      {/* Content */}
      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner />
            <span className="ml-3 text-sm text-gray-500">Loading products…</span>
          </div>
        ) : error ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm text-red-600">{error}</p>
            <button onClick={fetchProducts} className="mt-3 text-sm font-medium text-primary hover:underline">
              Try again
            </button>
          </div>
        ) : sortedItems.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm text-gray-500">
              {debouncedSearch || categoryFilter ? 'No products match your filters.' : 'No products yet.'}
            </p>
            {!debouncedSearch && !categoryFilter && (
              <button onClick={openCreateModal} className="mt-3 text-sm font-medium text-primary hover:underline">
                Add your first product
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead>
                  <tr className="bg-light/60">
                    {([
                      ['name', 'Name'],
                      ['sku', 'SKU'],
                      ['price', 'Price (ETB)'],
                      ['category', 'Category'],
                      ['is_active', 'Status'],
                      ['created_at', 'Created'],
                    ] as [SortField, string][]).map(([field, label]) => (
                      <th
                        key={field}
                        onClick={() => toggleSort(field)}
                        aria-sort={sortField === field ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}
                        className={`cursor-pointer select-none px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 hover:text-dark ${
                          field === 'price' ? 'text-right' : ''
                        }`}
                      >
                        {label}{sortIndicator(field)}
                      </th>
                    ))}
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {sortedItems.map((p) => (
                    <tr key={p.id} className="transition hover:bg-light/40">
                      <td className="whitespace-nowrap px-5 py-3.5 text-sm font-medium text-dark">{p.name}</td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-sm text-gray-500">{p.sku ?? '—'}</td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-right text-sm tabular-nums text-gray-700">
                        {parseFloat(p.price).toLocaleString('en-ET', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-sm text-gray-500 capitalize">
                        {p.category?.replace(/_/g, ' ') ?? '—'}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          p.is_active
                            ? 'bg-green-50 text-green-700 ring-1 ring-green-600/20'
                            : 'bg-gray-100 text-gray-600 ring-1 ring-gray-500/20'
                        }`}>
                          {p.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-sm text-gray-500">
                        {new Date(p.created_at).toLocaleDateString()}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-right">
                        <div className="inline-flex gap-1">
                          <button
                            onClick={() => openEditModal(p)}
                            className="rounded-md p-1.5 text-gray-400 transition hover:bg-primary/10 hover:text-primary"
                            title="Edit"
                            aria-label={`Edit ${p.name}`}
                          >
                            <EditIcon />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(p)}
                            className="rounded-md p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                            title="Delete"
                            aria-label={`Delete ${p.name}`}
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
              <p className="text-sm text-gray-500">
                {data!.total} product{data!.total !== 1 ? 's' : ''} &middot; Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-dark transition hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-dark transition hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40" onClick={closeModal} />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl ring-1 ring-black/5">
            <h2 className="text-lg font-bold text-dark">
              {editingProduct ? 'Edit Product' : 'Add Product'}
            </h2>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <Field label="Name" required>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-dark ring-1 ring-black/5 focus:outline-none focus:ring-2 focus:ring-primary/40"
                  autoFocus
                />
              </Field>

              <Field label="Price (ETB)" required>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-dark ring-1 ring-black/5 focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </Field>

              <Field label="SKU">
                <input
                  type="text"
                  value={form.sku}
                  onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-dark ring-1 ring-black/5 focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </Field>

              <Field label="Category">
                <select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-dark ring-1 ring-black/5 focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="">None</option>
                  {CATEGORIES.filter((c) => c.value).map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </Field>

              {formError && <p className="text-sm text-red-600">{formError}</p>}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-dark transition hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 disabled:opacity-60"
                >
                  {submitting ? 'Saving…' : editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40" onClick={() => !deleting && setDeleteTarget(null)} />
          <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl ring-1 ring-black/5">
            <h2 className="text-lg font-bold text-dark">Delete Product</h2>
            <p className="mt-2 text-sm text-gray-600">
              Are you sure you want to delete <span className="font-semibold text-dark">{deleteTarget.name}</span>?
              This action cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-dark transition hover:bg-gray-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-60"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Small components
// ---------------------------------------------------------------------------

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-dark">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}

function Spinner() {
  return (
    <svg aria-hidden="true" className="h-5 w-5 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Icons (inline SVG to avoid new dependencies)
// ---------------------------------------------------------------------------

function PlusIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={`h-4 w-4 ${className ?? ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zM19.5 7.125L16.862 4.487" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  );
}
