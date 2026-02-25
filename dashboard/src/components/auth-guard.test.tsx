import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import AuthGuard from './auth-guard';
import { AuthProvider } from '../contexts/auth-context';
import * as api from '../lib/api';

vi.mock('../lib/api', () => ({
  post: vi.fn(),
  get: vi.fn(),
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

    // Wait for auth check to complete
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Should redirect (Navigate component changes location)
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
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

    // Wait for auth check to complete
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('handles authentication failure gracefully', async () => {
    vi.mocked(api.getAccessToken).mockReturnValue('token123');
    vi.mocked(api.get).mockRejectedValue(new api.ApiError(401, 'Unauthorized'));

    renderWithProviders(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>,
    );

    // Wait for auth check to complete
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Should redirect after auth failure
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });
});
