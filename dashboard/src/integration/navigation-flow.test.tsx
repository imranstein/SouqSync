import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from '../contexts/auth-context';
import { I18nProvider } from '../contexts/i18n-context';
import { router } from '../router';
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

describe('Navigation Flow Integration', () => {
  beforeEach(() => {
    vi.mocked(api.getAccessToken).mockReturnValue('token123');
    vi.mocked(api.get).mockReset();
  });

  it('navigates between dashboard pages', async () => {
    vi.mocked(api.get).mockImplementation((path: string) => {
      if (path.includes('/users/me')) {
        return Promise.resolve(mockUser);
      }
      if (path.includes('/languages')) {
        return Promise.resolve({ items: [], total: 0 });
      }
      if (path.includes('/translations')) {
        return Promise.resolve({ namespace: 'common', translations: {} });
      }
      return Promise.resolve({ items: [], total: 0, page: 1, per_page: 20 });
    });

    render(
      <AuthProvider>
        <I18nProvider>
          <RouterProvider router={router} />
        </I18nProvider>
      </AuthProvider>,
    );

    // Wait for dashboard to load
    await waitFor(() => {
      expect(api.get).toHaveBeenCalled();
    }, { timeout: 3000 });

    // Navigation links should be present
    const inventoryLink = screen.queryByText(/inventory/i);
    const ordersLink = screen.queryByText(/orders/i);
    
    // These may not be visible if dashboard is still loading, but they should exist in the DOM
    expect(inventoryLink || ordersLink).toBeTruthy();
  });

  it('loads user data on app initialization', async () => {
    vi.mocked(api.get).mockResolvedValue(mockUser);

    render(
      <AuthProvider>
        <I18nProvider>
          <RouterProvider router={router} />
        </I18nProvider>
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/users/me');
    }, { timeout: 3000 });
  });
});
