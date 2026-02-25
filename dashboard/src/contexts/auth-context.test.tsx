import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAuth, AuthProvider } from './auth-context';
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

function renderAuthHook() {
  return renderHook(() => useAuth(), {
    wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
  });
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.mocked(api.getAccessToken).mockReturnValue(null);
    vi.mocked(api.post).mockReset();
    vi.mocked(api.get).mockReset();
    vi.mocked(api.setTokens).mockReset();
    vi.mocked(api.clearTokens).mockReset();
  });

  it('initializes with no user when no token exists', async () => {
    vi.mocked(api.getAccessToken).mockReturnValue(null);
    const { result } = renderAuthHook();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('fetches user when token exists', async () => {
    const mockUser = {
      id: 'user1',
      phone: '+251912345678',
      name: 'Test User',
      role: 'admin',
    };

    vi.mocked(api.getAccessToken).mockReturnValue('token123');
    vi.mocked(api.get).mockResolvedValue(mockUser);

    const { result } = renderAuthHook();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
    expect(api.get).toHaveBeenCalledWith('/users/me');
  });

  it('clears user when token is invalid', async () => {
    vi.mocked(api.getAccessToken).mockReturnValue('token123');
    vi.mocked(api.get).mockRejectedValue(new api.ApiError(401, 'Unauthorized'));

    const { result } = renderAuthHook();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(api.clearTokens).toHaveBeenCalled();
  });

  it('requests OTP successfully', async () => {
    vi.mocked(api.post).mockResolvedValue({});
    const { result } = renderAuthHook();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await result.current.requestOtp('+251912345678');

    expect(api.post).toHaveBeenCalledWith('/auth/request-otp', { phone: '+251912345678' });
    expect(result.current.error).toBeNull();
  });

  it('handles OTP request error', async () => {
    vi.mocked(api.post).mockRejectedValue(new api.ApiError(400, 'Invalid phone number'));
    const { result } = renderAuthHook();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await expect(result.current.requestOtp('+251912345678')).rejects.toThrow();

    await waitFor(() => {
      expect(result.current.error).toBe('Invalid phone number');
    });
  });

  it('verifies OTP and sets tokens', async () => {
    const mockTokens = { access_token: 'token123', refresh_token: 'refresh123' };
    const mockUser = {
      id: 'user1',
      phone: '+251912345678',
      name: 'Test User',
      role: 'admin',
    };

    vi.mocked(api.post).mockResolvedValue(mockTokens);
    vi.mocked(api.get).mockResolvedValue(mockUser);

    const { result } = renderAuthHook();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await result.current.verifyOtp('+251912345678', '123456');

    expect(api.post).toHaveBeenCalledWith('/auth/verify-otp', {
      phone: '+251912345678',
      code: '123456',
    });
    expect(api.setTokens).toHaveBeenCalledWith('token123', 'refresh123');
    expect(api.get).toHaveBeenCalledWith('/users/me');
  });

  it('handles OTP verification error', async () => {
    vi.mocked(api.post).mockRejectedValue(new api.ApiError(400, 'Invalid OTP'));
    const { result } = renderAuthHook();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await expect(result.current.verifyOtp('+251912345678', '123456')).rejects.toThrow();

    await waitFor(() => {
      expect(result.current.error).toBe('Invalid OTP');
    });
  });

  it('logs out user and clears tokens', async () => {
    const mockUser = {
      id: 'user1',
      phone: '+251912345678',
      name: 'Test User',
      role: 'admin',
    };

    vi.mocked(api.getAccessToken).mockReturnValue('token123');
    vi.mocked(api.get).mockResolvedValue(mockUser);

    const { result } = renderAuthHook();

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });

    result.current.logout();

    expect(api.clearTokens).toHaveBeenCalled();
    
    await waitFor(() => {
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  it('refreshes user data', async () => {
    const mockUser = {
      id: 'user1',
      phone: '+251912345678',
      name: 'Test User',
      role: 'admin',
    };

    vi.mocked(api.getAccessToken).mockReturnValue('token123');
    vi.mocked(api.get).mockResolvedValue(mockUser);

    const { result } = renderAuthHook();

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });

    const updatedUser = { ...mockUser, name: 'Updated Name' };
    vi.mocked(api.get).mockResolvedValue(updatedUser);

    await result.current.refreshUser();

    await waitFor(() => {
      expect(result.current.user).toEqual(updatedUser);
    });
  });

  it('clears error message', async () => {
    vi.mocked(api.post).mockRejectedValue(new api.ApiError(400, 'Error message'));
    const { result } = renderAuthHook();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await expect(result.current.requestOtp('+251912345678')).rejects.toThrow();

    await waitFor(() => {
      expect(result.current.error).toBe('Error message');
    });

    result.current.clearError();

    await waitFor(() => {
      expect(result.current.error).toBeNull();
    });
  });
});
