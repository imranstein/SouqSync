/**
 * Tests for AuthGuard component.
 *
 * AuthGuard protects routes by checking authentication state and redirecting
 * unauthenticated users to the login page.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AuthGuard from './auth-guard';
import { AuthProvider } from '../contexts/auth-context';
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
    post: vi.fn(),
    get: vi.fn(),
    setTokens: vi.fn(),
    getAccessToken: vi.fn(),
    clearTokens: vi.fn(),
    ApiError,
  };
});

function renderWithProviders(ui: React.ReactElement, initialEntries = ['/']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AuthProvider>{ui}</AuthProvider>
    </MemoryRouter>,
  );
}

describe('AuthGuard', () => {
  beforeEach(() => {
    vi.mocked(api.getAccessToken).mockReturnValue(null);
    vi.mocked(api.get).mockReset();
  });

  it('shows loading state while checking authentication', () => {
    vi.mocked(api.getAccessToken).mockReturnValue('token123');
    vi.mocked(api.get).mockImplementation(() => new Promise(() => {})); // Never resolves

    renderWithProviders(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>,
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('redirects to login when not authenticated', async () => {
    vi.mocked(api.getAccessToken).mockReturnValue(null);

    renderWithProviders(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>,
    );

    // Wait for auth check to complete and redirect
    await waitFor(() => {
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  it('renders children when authenticated', async () => {
    const mockUser = {
      id: 'user1',
      phone: '+251912345678',
      name: 'Test User',
      role: 'admin',
    };

    vi.mocked(api.getAccessToken).mockReturnValue('token123');
    vi.mocked(api.get).mockResolvedValue(mockUser);

    renderWithProviders(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>,
    );

    // Wait for auth check to complete and content to render
    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });

  it('handles authentication failure gracefully', async () => {
    vi.mocked(api.getAccessToken).mockReturnValue('token123');
    vi.mocked(api.get).mockRejectedValue(new api.ApiError(401, 'Unauthorized'));

    renderWithProviders(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>,
    );

    // Wait for auth check to complete and redirect after failure
    await waitFor(() => {
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });
});
