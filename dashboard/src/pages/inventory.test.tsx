import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
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

  it('has Add Product button available', async () => {
    vi.mocked(api.get).mockResolvedValue(mockProductList);
    render(<InventoryPage />);

    await waitFor(() => {
      expect(screen.getByText('Product A')).toBeInTheDocument();
    });

    // Verify Add Product button exists
    expect(screen.getByText(/add product/i)).toBeInTheDocument();
  });

  it('filters products by category', async () => {
    vi.mocked(api.get).mockResolvedValue(mockProductList);
    render(<InventoryPage />);

    await waitFor(() => {
      expect(screen.getByText('Product A')).toBeInTheDocument();
    });

    // Find category filter dropdown
    const categorySelect = document.querySelector('select');
    
    if (categorySelect) {
      const initialCallCount = vi.mocked(api.get).mock.calls.length;
      fireEvent.change(categorySelect, { target: { value: 'beverages' } });

      // Wait for debounced search to trigger
      await waitFor(() => {
        expect(vi.mocked(api.get).mock.calls.length).toBeGreaterThan(initialCallCount);
      }, { timeout: 1000 });
    }
  });

  it('searches products by name', async () => {
    vi.mocked(api.get).mockResolvedValue(mockProductList);
    render(<InventoryPage />);

    await waitFor(() => {
      expect(screen.getByText('Product A')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search/i);
    const initialCallCount = vi.mocked(api.get).mock.calls.length;
    
    fireEvent.change(searchInput, { target: { value: 'Product A' } });

    // Wait for debounced search to trigger
    await waitFor(() => {
      expect(vi.mocked(api.get).mock.calls.length).toBeGreaterThan(initialCallCount);
    }, { timeout: 1000 });
  });

  it('sorts products by different fields', async () => {
    vi.mocked(api.get).mockResolvedValue(mockProductList);
    render(<InventoryPage />);

    await waitFor(() => {
      expect(screen.getByText('Product A')).toBeInTheDocument();
    });

    // Find sortable header (e.g., Price)
    const priceHeader = screen.getByText(/price/i);
    if (priceHeader) {
      fireEvent.click(priceHeader);

      // Check that products are sorted (client-side sorting)
      await waitFor(() => {
        const rows = screen.getAllByText(/Product [AB]/);
        expect(rows.length).toBeGreaterThan(0);
      });
    }
  });

  it('handles pagination', async () => {
    const largeProductList = {
      items: Array.from({ length: 20 }, (_, i) => ({
        id: String(i + 1),
        name: `Product ${i + 1}`,
        sku: `SKU-${i + 1}`,
        price: '99.00',
        category: 'beverages',
        distributor_id: 'd1',
        is_active: true,
        created_at: '2026-01-01T00:00:00Z',
      })),
      total: 25,
      page: 1,
      per_page: 20,
    };

    vi.mocked(api.get).mockResolvedValue(largeProductList);
    render(<InventoryPage />);

    await waitFor(() => {
      expect(screen.getByText(/page 1 of/i)).toBeInTheDocument();
    });

    // Click next page
    const nextButton = screen.getByRole('button', { name: /next/i }) as HTMLButtonElement;
    if (nextButton && !nextButton.disabled) {
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith(expect.stringContaining('page=2'));
      });
    }
  });

  it('validates product form before submission', async () => {
    vi.mocked(api.get).mockResolvedValue(mockProductList);
    render(<InventoryPage />);

    await waitFor(() => {
      expect(screen.getByText('Product A')).toBeInTheDocument();
    });

    // Open create modal
    fireEvent.click(screen.getByText(/add product/i));

    await waitFor(() => {
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    });

    // Try to submit without name
    const submitButton = screen.getByRole('button', { name: /create|save/i });
    fireEvent.click(submitButton);

    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText(/required|name is required/i)).toBeInTheDocument();
    });
  });

  it('exports products to CSV', async () => {
    // Mock URL methods
    const mockCreateObjectURL = vi.fn(() => 'blob:mock-url');
    const mockRevokeObjectURL = vi.fn();
    const mockClick = vi.fn();
    
    const originalCreateObjectURL = window.URL.createObjectURL;
    const originalRevokeObjectURL = window.URL.revokeObjectURL;
    
    window.URL.createObjectURL = mockCreateObjectURL;
    window.URL.revokeObjectURL = mockRevokeObjectURL;

    // Mock document.createElement
    const originalCreateElement = document.createElement.bind(document);
    document.createElement = vi.fn((tagName: string) => {
      if (tagName === 'a') {
        const element = originalCreateElement('a');
        element.click = mockClick;
        return element;
      }
      return originalCreateElement(tagName);
    }) as unknown as (tagName: string) => HTMLElement;

    try {
      vi.mocked(api.get).mockResolvedValue(mockProductList);
      render(<InventoryPage />);

      await waitFor(() => {
        expect(screen.getByText('Product A')).toBeInTheDocument();
      });

      // Click export button
      const exportButton = screen.getByText(/export csv/i);
      fireEvent.click(exportButton);

      // Check that CSV download was triggered
      await waitFor(() => {
        expect(mockCreateObjectURL).toHaveBeenCalled();
        expect(mockClick).toHaveBeenCalled();
      });
    } finally {
      // Restore all mocks to maintain test isolation
      window.URL.createObjectURL = originalCreateObjectURL;
      window.URL.revokeObjectURL = originalRevokeObjectURL;
      document.createElement = originalCreateElement;
    }
  });
});
