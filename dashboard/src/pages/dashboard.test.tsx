/**
 * Tests for DashboardPage component.
 *
 * DashboardPage displays KPIs, recent orders, and product catalog widgets
 * with data fetched from the API.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import type { ReactElement } from 'react';
import { BrowserRouter } from 'react-router-dom';
import DashboardPage from './dashboard';
import { AuthProvider } from '../contexts/auth-context';
import { I18nProvider } from '../contexts/i18n-context';
import * as api from '../lib/api';

// Shared ApiError class definition (matches ../test/mocks/api.ts)
// Defined inline here because vi.mock is hoisted and cannot import from other modules
vi.mock('../lib/api', () => {
  class ApiError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
      this.name = 'ApiError';
    }
  }

  return {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    del: vi.fn(),
    setTokens: vi.fn(),
    getAccessToken: vi.fn(),
    clearTokens: vi.fn(),
    ApiError,
  };
});

const mockUser = {
  id: 'user1',
  phone: '+251912345678',
  name: 'Test User',
  role: 'admin',
};

/**
 * Helper function to create a date string relative to now.
 * Used to avoid hardcoded future dates that become outdated.
 */
function createDateString(daysOffset = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString();
}

/**
 * Creates a URL-based mock implementation that handles all API calls
 * including AuthProvider (/users/me) and I18nProvider (/languages, /translations).
 */
function createApiMock(
  dashboardData: {
    products?: unknown;
    orders?: unknown;
    credit?: unknown;
  },
) {
  return vi.fn((path: string) => {
    // AuthProvider calls
    if (path === '/users/me') {
      return Promise.resolve(mockUser);
    }

    // I18nProvider calls
    if (path.includes('/languages')) {
      return Promise.resolve({ items: [], total: 0 });
    }
    if (path.includes('/translations/map')) {
      return Promise.resolve({ namespace: 'common', translations: {} });
    }

    // DashboardPage calls
    if (path.includes('/products')) {
      return Promise.resolve(dashboardData.products ?? { items: [], total: 0, page: 1, per_page: 20 });
    }
    if (path.includes('/orders')) {
      return Promise.resolve(dashboardData.orders ?? { items: [], total: 0, page: 1, per_page: 20 });
    }
    if (path.includes('/credit/limit')) {
      if (dashboardData.credit === null) {
        return Promise.reject(new api.ApiError(404, 'Not found'));
      }
      return Promise.resolve(dashboardData.credit ?? { credit_limit: 0, available_credit: 0 });
    }

    // Fail fast for unknown paths to catch regressions
    return Promise.reject(
      new api.ApiError(404, `Unhandled API path in test mock: ${path}`),
    );
  });
}

function renderWithProviders(ui: ReactElement) {
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
          created_at: createDateString(),
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
          created_at: createDateString(),
          updated_at: createDateString(),
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

    vi.mocked(api.get).mockImplementation(
      createApiMock({
        products: mockProducts,
        orders: mockOrders,
        credit: mockCredit,
      }),
    );

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
          created_at: createDateString(),
          updated_at: createDateString(),
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
          created_at: createDateString(-1),
          updated_at: createDateString(-1),
        },
      ],
      total: 2,
      page: 1,
      per_page: 20,
    };

    vi.mocked(api.get).mockImplementation(
      createApiMock({
        products: mockProducts,
        orders: mockOrders,
        credit: null,
      }),
    );

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
          created_at: createDateString(),
        },
        {
          id: 'p2',
          name: 'Product B',
          sku: 'SKU-B',
          price: '149.50',
          category: 'snacks',
          distributor_id: 'd1',
          is_active: true,
          created_at: createDateString(),
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

    vi.mocked(api.get).mockImplementation(
      createApiMock({
        products: mockProducts,
        orders: mockOrders,
        credit: null,
      }),
    );

    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/product_catalog|product catalog/i)).toBeInTheDocument();
    });

    expect(screen.getByText('Product A')).toBeInTheDocument();
    expect(screen.getByText('Product B')).toBeInTheDocument();
  });

  it('shows empty state when no orders', async () => {
    // Test isolates the "no orders" scenario: products exist, orders are empty
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
          created_at: createDateString(),
        },
      ],
      total: 1,
      page: 1,
      per_page: 20,
    };

    const mockOrders = {
      items: [],
      total: 0,
      page: 1,
      per_page: 20,
    };

    vi.mocked(api.get).mockImplementation(
      createApiMock({
        products: mockProducts,
        orders: mockOrders,
        credit: null,
      }),
    );

    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/no_orders|no orders/i)).toBeInTheDocument();
    });
  });

  it('shows empty state when no products', async () => {
    // Test isolates the "no products" scenario: orders exist, products are empty
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
          created_at: createDateString(),
          updated_at: createDateString(),
        },
      ],
      total: 1,
      page: 1,
      per_page: 20,
    };

    vi.mocked(api.get).mockImplementation(
      createApiMock({
        products: mockProducts,
        orders: mockOrders,
        credit: null,
      }),
    );

    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/no_products|no products/i)).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    vi.mocked(api.get).mockImplementation((path: string) => {
      // AuthProvider and I18nProvider calls should succeed
      if (path === '/users/me') {
        return Promise.resolve(mockUser);
      }
      if (path.includes('/languages')) {
        return Promise.resolve({ items: [], total: 0 });
      }
      if (path.includes('/translations/map')) {
        return Promise.resolve({ namespace: 'common', translations: {} });
      }
      // DashboardPage calls should fail
      return Promise.reject(new api.ApiError(500, 'Server error'));
    });

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
          created_at: createDateString(),
          updated_at: createDateString(),
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
          created_at: createDateString(-1),
          updated_at: createDateString(-1),
        },
      ],
      total: 2,
      page: 1,
      per_page: 20,
    };

    vi.mocked(api.get).mockImplementation(
      createApiMock({
        products: mockProducts,
        orders: mockOrders,
        credit: null,
      }),
    );

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

    vi.mocked(api.get).mockImplementation(
      createApiMock({
        products: mockProducts,
        orders: mockOrders,
        credit: null,
      }),
    );

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

    vi.mocked(api.get).mockImplementation(
      createApiMock({
        products: mockProducts,
        orders: mockOrders,
        credit: null, // Credit limit fails (returns null)
      }),
    );

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
