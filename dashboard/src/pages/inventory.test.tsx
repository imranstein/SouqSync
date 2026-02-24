import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import * as api from '../lib/api';
import InventoryPage from './inventory';

vi.mock('../lib/api', () => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
  ApiError: class ApiError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
    }
  },
}));

const mockProductList = {
  items: [
    { id: '1', name: 'Product A', sku: 'SKU-A', price: '99.00', category: 'beverages', distributor_id: 'd1', is_active: true, created_at: '2026-01-01T00:00:00Z' },
    { id: '2', name: 'Product B', sku: 'SKU-B', price: '149.50', category: 'snacks', distributor_id: 'd1', is_active: true, created_at: '2026-01-01T00:00:00Z' },
  ],
  total: 2,
  page: 1,
  per_page: 20,
};

describe('InventoryPage', () => {
  beforeEach(() => {
    vi.mocked(api.get).mockReset();
  });

  it('shows loading state initially', () => {
    vi.mocked(api.get).mockImplementation(() => new Promise(() => {}));
    render(<InventoryPage />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('displays product list when fetch succeeds', async () => {
    vi.mocked(api.get).mockResolvedValue(mockProductList);
    render(<InventoryPage />);
    await waitFor(() => {
      expect(screen.getByText('Product A')).toBeInTheDocument();
      expect(screen.getByText('Product B')).toBeInTheDocument();
    });
    expect(screen.getByText(/2 product/)).toBeInTheDocument();
  });

  it('shows error message when fetch fails', async () => {
    vi.mocked(api.get).mockRejectedValue(new api.ApiError(500, 'Server error'));
    render(<InventoryPage />);
    await waitFor(() => {
      expect(screen.getByText(/error|failed|server/i)).toBeInTheDocument();
    });
  });

  it('shows empty state when no products', async () => {
    vi.mocked(api.get).mockResolvedValue({ items: [], total: 0, page: 1, per_page: 20 });
    render(<InventoryPage />);
    await waitFor(() => {
      expect(screen.getByText(/no products/i)).toBeInTheDocument();
    });
  });
});
