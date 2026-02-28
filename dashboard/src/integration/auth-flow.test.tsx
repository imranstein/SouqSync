import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

import { AuthProvider } from '../contexts/auth-context';
import { I18nProvider } from '../contexts/i18n-context';
import { router } from '../router';
import { RouterProvider } from 'react-router-dom';
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

describe('Auth Flow Integration', () => {
  beforeEach(() => {
    vi.mocked(api.getAccessToken).mockReturnValue(null);
    vi.mocked(api.get).mockReset();
    vi.mocked(api.post).mockReset();
    vi.mocked(api.setTokens).mockReset();
    vi.mocked(api.clearTokens).mockReset();
  });

  it('redirects unauthenticated users to login', async () => {
    vi.mocked(api.getAccessToken).mockReturnValue(null);
    vi.mocked(api.get).mockResolvedValue({ items: [], total: 0 });

    render(
      <AuthProvider>
        <I18nProvider>
          <RouterProvider router={router} />
        </I18nProvider>
      </AuthProvider>,
    );

    await waitFor(() => {
      // Should redirect to login
      expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('allows authenticated users to access dashboard', async () => {
    const mockUser = {
      id: 'user1',
      phone: '+251912345678',
      name: 'Test User',
      role: 'admin',
    };

    vi.mocked(api.getAccessToken).mockReturnValue('token123');
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

    // Should load dashboard (may show loading initially)
    await waitFor(() => {
      // Dashboard should eventually render
      const loginForm = screen.queryByLabelText(/phone number/i);
      expect(loginForm).not.toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('completes full login flow', async () => {
    const mockTokens = { access_token: 'token123', refresh_token: 'refresh123' };
    const mockUser = {
      id: 'user1',
      phone: '+251912345678',
      name: 'Test User',
      role: 'admin',
    };

    vi.mocked(api.post)
      .mockResolvedValueOnce({}) // OTP request
      .mockResolvedValueOnce(mockTokens); // OTP verification
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

    // Navigate to login
    window.history.pushState({}, '', '/login');

    // Step 1: Request OTP
    await waitFor(() => {
      expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
    });

    const phoneInput = screen.getByLabelText(/phone number/i);
    fireEvent.change(phoneInput, { target: { value: '+251912345678' } });
    fireEvent.click(screen.getByRole('button', { name: /send otp/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/request-otp', {
        phone: '+251912345678',
      });
    });

    // Step 2: Enter OTP
    await waitFor(() => {
      expect(screen.getByLabelText(/verification code/i)).toBeInTheDocument();
    });

    const otpInput = screen.getByLabelText(/verification code/i);
    fireEvent.change(otpInput, { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: /verify/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/verify-otp', {
        phone: '+251912345678',
        code: '123456',
      });
      expect(api.setTokens).toHaveBeenCalledWith('token123', 'refresh123');
    });
  });
});
