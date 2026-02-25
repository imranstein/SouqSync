import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import DashboardPage from './dashboard';
import { AuthProvider } from '../contexts/auth-context';
import { I18nProvider } from '../contexts/i18n-context';
import * as api from '../lib/api';

vi.mock('../lib/api', () => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
  setTokens: vi.fn(),
  getAccessToken: vi.fn(),
  clearTokens: vi.fn(),
  ApiError: class ApiError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
      this.name = 'ApiError';
    }
  },
}));

const mockUser = {
  id: 'user1',
  phone: '+251912345678',
  name: 'Test User',
  role: 'admin',
};

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <I18nProvider>{ui}</I18nProvider>
      </AuthProvider>
    </BrowserRouter>,
  );
}

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.mocked(api.getAccessToken).mockReturnValue('token123');
    vi.mocked(api.get).mockReset();
  });

  it('shows loading state initially', () => {
    vi.mocked(api.get).mockImplementation(() => new Promise(() => {})); // Never resolves

    renderWithProviders(<DashboardPage />);

    // Check for loading skeleton or spinner
    const loadingElements = screen.queryAllByText(/loading/i);
    const skeletonElements = document.querySelectorAll('.animate-pulse');
    expect(loadingElements.length > 0 || skeletonElements.length > 0).toBe(true);
  });

  it('displays dashboard KPIs when data loads', async () => {
    const mockProducts = {
      items: [
        {
          id: 'p1',
          name: 'Product A',
          sku: 'SKU-A',
          price: '99.00',
          category: 'beverages',
          distributor_id: 'd1',
          is_active: true,
          created_at: '2026-01-01T00:00:00Z',
        },
      ],
      total: 1,
      page: 1,
      per_page: 20,
    };

    const mockOrders = {
      items: [
        {
          id: 'o1',
          user_id: 'u1',
          distributor_id: 'd1',
          status: 'pending',
          total: '250.00',
          delivery_fee: '10.00',
          payment_method: 'cash',
          items: [],
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
      ],
      total: 1,
      page: 1,
      per_page: 20,
    };

    const mockCredit = {
      credit_limit: 1000,
      available_credit: 750,
    };

    vi.mocked(api.get)
      .mockResolvedValueOnce(mockProducts)
      .mockResolvedValueOnce(mockOrders)
      .mockResolvedValueOnce(mockCredit);

    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      // Check for total products KPI
      expect(screen.getByText(/total_products|total products/i)).toBeInTheDocument();
      // Check for pending orders KPI
      expect(screen.getByText(/pending_orders|pending orders/i)).toBeInTheDocument();
    });
  });

  it('displays recent orders table', async () => {
    const mockProducts = {
      items: [],
      total: 0,
      page: 1,
      per_page: 20,
    };

    const mockOrders = {
      items: [
        {
          id: 'o1',
          user_id: 'u1',
          distributor_id: 'd1',
          status: 'pending',
          total: '250.00',
          delivery_fee: '10.00',
          payment_method: 'cash',
          items: [],
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
        {
          id: 'o2',
          user_id: 'u1',
          distributor_id: 'd1',
          status: 'delivered',
          total: '150.00',
          delivery_fee: '5.00',
          payment_method: 'cash',
          items: [],
          created_at: '2026-01-02T00:00:00Z',
          updated_at: '2026-01-02T00:00:00Z',
        },
      ],
      total: 2,
      page: 1,
      per_page: 20,
    };

    vi.mocked(api.get)
      .mockResolvedValueOnce(mockProducts)
      .mockResolvedValueOnce(mockOrders)
      .mockResolvedValueOnce(null); // Credit limit fails

    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/recent_orders|recent orders/i)).toBeInTheDocument();
    });

    // Check that order data is displayed
    expect(screen.getByText(/250/i)).toBeInTheDocument();
  });

  it('displays product catalog table', async () => {
    const mockProducts = {
      items: [
        {
          id: 'p1',
          name: 'Product A',
          sku: 'SKU-A',
          price: '99.00',
          category: 'beverages',
          distributor_id: 'd1',
          is_active: true,
          created_at: '2026-01-01T00:00:00Z',
        },
        {
          id: 'p2',
          name: 'Product B',
          sku: 'SKU-B',
          price: '149.50',
          category: 'snacks',
          distributor_id: 'd1',
          is_active: true,
          created_at: '2026-01-01T00:00:00Z',
        },
      ],
      total: 2,
      page: 1,
      per_page: 20,
    };

    const mockOrders = {
      items: [],
      total: 0,
      page: 1,
      per_page: 20,
    };

    vi.mocked(api.get)
      .mockResolvedValueOnce(mockProducts)
      .mockResolvedValueOnce(mockOrders)
      .mockResolvedValueOnce(null); // Credit limit fails

    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/product_catalog|product catalog/i)).toBeInTheDocument();
    });

    expect(screen.getByText('Product A')).toBeInTheDocument();
    expect(screen.getByText('Product B')).toBeInTheDocument();
  });

  it('shows empty state when no orders', async () => {
    const mockProducts = {
      items: [],
      total: 0,
      page: 1,
      per_page: 20,
    };

    const mockOrders = {
      items: [],
      total: 0,
      page: 1,
      per_page: 20,
    };

    vi.mocked(api.get)
      .mockResolvedValueOnce(mockProducts)
      .mockResolvedValueOnce(mockOrders)
      .mockResolvedValueOnce(null); // Credit limit fails

    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/no_orders|no orders/i)).toBeInTheDocument();
    });
  });

  it('shows empty state when no products', async () => {
    const mockProducts = {
      items: [],
      total: 0,
      page: 1,
      per_page: 20,
    };

    const mockOrders = {
      items: [],
      total: 0,
      page: 1,
      per_page: 20,
    };

    vi.mocked(api.get)
      .mockResolvedValueOnce(mockProducts)
      .mockResolvedValueOnce(mockOrders)
      .mockResolvedValueOnce(null); // Credit limit fails

    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/no_products|no products/i)).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    vi.mocked(api.get).mockRejectedValue(new api.ApiError(500, 'Server error'));

    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/server error|error/i)).toBeInTheDocument();
    });
  });

  it('calculates total revenue correctly', async () => {
    const mockProducts = {
      items: [],
      total: 0,
      page: 1,
      per_page: 20,
    };

    const mockOrders = {
      items: [
        {
          id: 'o1',
          user_id: 'u1',
          distributor_id: 'd1',
          status: 'delivered',
          total: '250.00',
          delivery_fee: '10.00',
          payment_method: 'cash',
          items: [],
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
        {
          id: 'o2',
          user_id: 'u1',
          distributor_id: 'd1',
          status: 'delivered',
          total: '150.00',
          delivery_fee: '5.00',
          payment_method: 'cash',
          items: [],
          created_at: '2026-01-02T00:00:00Z',
          updated_at: '2026-01-02T00:00:00Z',
        },
      ],
      total: 2,
      page: 1,
      per_page: 20,
    };

    vi.mocked(api.get)
      .mockResolvedValueOnce(mockProducts)
      .mockResolvedValueOnce(mockOrders)
      .mockResolvedValueOnce(null); // Credit limit fails

    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      // Total revenue should be 400 (250 + 150)
      expect(screen.getByText(/400/i)).toBeInTheDocument();
    });
  });

  it('displays user name in welcome message', async () => {
    const mockProducts = {
      items: [],
      total: 0,
      page: 1,
      per_page: 20,
    };

    const mockOrders = {
      items: [],
      total: 0,
      page: 1,
      per_page: 20,
    };

    vi.mocked(api.get)
      .mockResolvedValueOnce(mockProducts)
      .mockResolvedValueOnce(mockOrders)
      .mockResolvedValueOnce(null); // Credit limit fails
    vi.mocked(api.get).mockResolvedValueOnce(mockUser); // For auth context

    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/test user/i)).toBeInTheDocument();
    });
  });

  it('handles missing credit limit gracefully', async () => {
    const mockProducts = {
      items: [],
      total: 0,
      page: 1,
      per_page: 20,
    };

    const mockOrders = {
      items: [],
      total: 0,
      page: 1,
      per_page: 20,
    };

    vi.mocked(api.get)
      .mockResolvedValueOnce(mockProducts)
      .mockResolvedValueOnce(mockOrders)
      .mockRejectedValueOnce(new api.ApiError(404, 'Not found')); // Credit limit fails

    renderWithProviders(<DashboardPage />);

    // Should still render dashboard without credit info
    await waitFor(() => {
      // Check for welcome message or dashboard title
      const welcomeText = screen.queryByText(/welcome_back/i);
      const dashboardTitle = screen.queryByText(/dashboard/i);
      expect(welcomeText || dashboardTitle).toBeTruthy();
    });
  });
});
