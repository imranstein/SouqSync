import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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
});
