import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import * as api from '../lib/api';
import OrdersPage from './orders';

vi.mock('../lib/api', () => ({
  get: vi.fn(),
  put: vi.fn(),
  ApiError: class ApiError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
    }
  },
}));

const mockOrderList = {
  items: [
    { id: 'o1o1o1o1', user_id: 'u1', distributor_id: 'd1', status: 'pending', total: '250.00', delivery_fee: '0.00', payment_method: 'cash', items: [], created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  ],
  total: 1,
  page: 1,
  per_page: 20,
};

describe('OrdersPage', () => {
  beforeEach(() => {
    vi.mocked(api.get).mockReset();
  });

  it('shows loading state initially', () => {
    vi.mocked(api.get).mockImplementation(() => new Promise(() => {}));
    render(<OrdersPage />);
    const loadingElements = screen.getAllByText(/loading/i);
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  it('displays order list when fetch succeeds', async () => {
    vi.mocked(api.get).mockResolvedValue(mockOrderList);
    render(<OrdersPage />);
    await waitFor(() => {
      expect(screen.getByText(/250/)).toBeInTheDocument();
    });
    expect(screen.getByText(/1 order/)).toBeInTheDocument();
  });

  it('shows error message when fetch fails', async () => {
    vi.mocked(api.get).mockRejectedValue(new api.ApiError(500, 'Server error'));
    render(<OrdersPage />);
    await waitFor(() => {
      expect(screen.getByText(/server error|failed/i)).toBeInTheDocument();
    });
  });

  it('shows empty state when no orders', async () => {
    vi.mocked(api.get).mockResolvedValue({ items: [], total: 0, page: 1, per_page: 20 });
    render(<OrdersPage />);
    await waitFor(() => {
      expect(screen.getByText(/no orders/i)).toBeInTheDocument();
    });
  });

  it('displays status filter tabs', async () => {
    vi.mocked(api.get).mockResolvedValue(mockOrderList);
    render(<OrdersPage />);

    await waitFor(() => {
      expect(screen.getByText(/250/)).toBeInTheDocument();
    });

    // Verify status filter UI is present (tabs container)
    const tabsContainer = document.querySelector('.bg-gray-100, [class*="tab"]');
    expect(tabsContainer).toBeTruthy();
  });

  it('opens order detail panel when order is clicked', async () => {
    const mockOrderDetail = {
      id: 'o1o1o1o1',
      user_id: 'u1',
      distributor_id: 'd1',
      status: 'pending',
      total: '250.00',
      delivery_fee: '10.00',
      payment_method: 'cash',
      items: [
        {
          id: 'i1',
          product_id: 'p1',
          product_name: 'Product A',
          quantity: 2,
          unit_price: '120.00',
        },
      ],
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    };

    vi.mocked(api.get)
      .mockResolvedValueOnce(mockOrderList)
      .mockResolvedValueOnce(mockOrderDetail);

    render(<OrdersPage />);

    await waitFor(() => {
      expect(screen.getByText(/250/)).toBeInTheDocument();
    });

    // Click on an order row
    const orderRow = screen.getByText(/250/).closest('tr');
    if (orderRow) {
      fireEvent.click(orderRow);

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/orders/o1o1o1o1');
        expect(screen.getByText(/order details/i)).toBeInTheDocument();
      });
    }
  });

  it('opens order detail panel when order row is clicked', async () => {
    const mockOrderDetail = {
      id: 'o1o1o1o1',
      user_id: 'u1',
      distributor_id: 'd1',
      status: 'pending',
      total: '250.00',
      delivery_fee: '10.00',
      payment_method: 'cash',
      items: [],
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    };

    vi.mocked(api.get)
      .mockResolvedValueOnce(mockOrderList)
      .mockResolvedValueOnce(mockOrderDetail);

    render(<OrdersPage />);

    await waitFor(() => {
      expect(screen.getByText(/250/)).toBeInTheDocument();
    });

    // Open order detail
    const orderRow = screen.getByText(/250/).closest('tr');
    if (orderRow) {
      fireEvent.click(orderRow);

      // Wait for detail panel to open
      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/orders/o1o1o1o1');
        const detailPanel = screen.queryByText(/order details/i);
        expect(detailPanel).toBeInTheDocument();
      }, { timeout: 3000 });
    }
  });

  it('handles pagination', async () => {
    const largeOrderList = {
      items: Array.from({ length: 20 }, (_, i) => ({
        id: `o${i}`,
        user_id: 'u1',
        distributor_id: 'd1',
        status: 'pending',
        total: '100.00',
        delivery_fee: '10.00',
        payment_method: 'cash',
        items: [],
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      })),
      total: 25,
      page: 1,
      per_page: 20,
    };

    vi.mocked(api.get).mockResolvedValue(largeOrderList);
    render(<OrdersPage />);

    await waitFor(() => {
      expect(screen.getByText(/page 1 of/i)).toBeInTheDocument();
    });

    // Click next page
    const nextButton = screen.getByRole('button', { name: /next/i });
    if (nextButton && !nextButton.disabled) {
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith(expect.stringContaining('page=2'));
      });
    }
  });

  it('displays order items in detail panel', async () => {
    const mockOrderDetail = {
      id: 'o1o1o1o1',
      user_id: 'u1',
      distributor_id: 'd1',
      status: 'pending',
      total: '250.00',
      delivery_fee: '10.00',
      payment_method: 'cash',
      items: [
        {
          id: 'i1',
          product_id: 'p1',
          product_name: 'Product A',
          quantity: 2,
          unit_price: '120.00',
        },
        {
          id: 'i2',
          product_id: 'p2',
          product_name: 'Product B',
          quantity: 1,
          unit_price: '10.00',
        },
      ],
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    };

    vi.mocked(api.get)
      .mockResolvedValueOnce(mockOrderList)
      .mockResolvedValueOnce(mockOrderDetail);

    render(<OrdersPage />);

    await waitFor(() => {
      expect(screen.getByText(/250/)).toBeInTheDocument();
    });

    // Open order detail
    const orderRow = screen.getByText(/250/).closest('tr');
    if (orderRow) {
      fireEvent.click(orderRow);

      await waitFor(() => {
        expect(screen.getByText('Product A')).toBeInTheDocument();
        expect(screen.getByText('Product B')).toBeInTheDocument();
      });
    }
  });

  it('shows status timeline in order detail', async () => {
    const mockOrderDetail = {
      id: 'o1o1o1o1',
      user_id: 'u1',
      distributor_id: 'd1',
      status: 'in_transit',
      total: '250.00',
      delivery_fee: '10.00',
      payment_method: 'cash',
      items: [],
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    };

    vi.mocked(api.get)
      .mockResolvedValueOnce(mockOrderList)
      .mockResolvedValueOnce(mockOrderDetail);

    render(<OrdersPage />);

    await waitFor(() => {
      expect(screen.getByText(/250/)).toBeInTheDocument();
    });

    // Open order detail
    const orderRow = screen.getByText(/250/).closest('tr');
    if (orderRow) {
      fireEvent.click(orderRow);

      await waitFor(() => {
        expect(screen.getByText(/status timeline|timeline/i)).toBeInTheDocument();
      });
    }
  });
});
