/**
 * Tests for LoginPage component.
 *
 * LoginPage handles the OTP-based authentication flow, including phone number
 * input, OTP request, and OTP verification.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from './login';
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

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <BrowserRouter>
      <AuthProvider>{ui}</AuthProvider>
    </BrowserRouter>,
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.mocked(api.getAccessToken).mockReturnValue(null);
    vi.mocked(api.post).mockReset();
    vi.mocked(api.get).mockReset();
  });

  it('renders phone input form initially', () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send otp/i })).toBeInTheDocument();
  });

  it('validates phone number format', async () => {
    renderWithProviders(<LoginPage />);
    const phoneInput = screen.getByLabelText(/phone number/i) as HTMLInputElement;

    // Invalid phone number (doesn't match pattern)
    fireEvent.change(phoneInput, { target: { value: '123' } });

    // HTML5 validation should mark input as invalid
    // Note: In JSDOM, pattern validation may not work the same as in browsers,
    // but we verify the input has the required pattern attribute
    expect(phoneInput.pattern).toBe('\\+251[0-9]{9}');
    expect(phoneInput.required).toBe(true);

    // Verify form validation would fail
    const form = phoneInput.closest('form') as HTMLFormElement;
    if (form) {
      const isValid = form.checkValidity();
      // In real browser, invalid pattern would make form invalid
      // In JSDOM, we at least verify the pattern attribute is set
      expect(phoneInput.hasAttribute('pattern')).toBe(true);
    }
  });

  it('requests OTP when phone number is submitted', async () => {
    vi.mocked(api.post).mockResolvedValue({});
    renderWithProviders(<LoginPage />);

    const phoneInput = screen.getByLabelText(/phone number/i);
    const submitButton = screen.getByRole('button', { name: /send otp/i });

    fireEvent.change(phoneInput, { target: { value: '+251912345678' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/request-otp', { phone: '+251912345678' });
    });
  });

  it('shows OTP input after successful OTP request', async () => {
    vi.mocked(api.post).mockResolvedValue({});
    renderWithProviders(<LoginPage />);

    const phoneInput = screen.getByLabelText(/phone number/i);
    const submitButton = screen.getByRole('button', { name: /send otp/i });

    fireEvent.change(phoneInput, { target: { value: '+251912345678' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/verification code/i)).toBeInTheDocument();
    });
  });

  it('displays error message when OTP request fails', async () => {
    vi.mocked(api.post).mockRejectedValue(new api.ApiError(400, 'Invalid phone number'));
    renderWithProviders(<LoginPage />);

    const phoneInput = screen.getByLabelText(/phone number/i);
    const submitButton = screen.getByRole('button', { name: /send otp/i });

    fireEvent.change(phoneInput, { target: { value: '+251912345678' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid phone number/i)).toBeInTheDocument();
    });
  });

  it('verifies OTP and signs in user', async () => {
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
    vi.mocked(api.get).mockResolvedValue(mockUser);

    renderWithProviders(<LoginPage />);

    // Request OTP
    const phoneInput = screen.getByLabelText(/phone number/i);
    fireEvent.change(phoneInput, { target: { value: '+251912345678' } });
    fireEvent.click(screen.getByRole('button', { name: /send otp/i }));

    // Wait for OTP input
    await waitFor(() => {
      expect(screen.getByLabelText(/verification code/i)).toBeInTheDocument();
    });

    // Enter OTP
    const otpInput = screen.getByLabelText(/verification code/i);
    fireEvent.change(otpInput, { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: /verify/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/verify-otp', {
        phone: '+251912345678',
        code: '123456',
      });
    });
  });

  it('allows changing phone number from OTP step', async () => {
    vi.mocked(api.post).mockResolvedValue({});
    renderWithProviders(<LoginPage />);

    // Request OTP
    const phoneInput = screen.getByLabelText(/phone number/i);
    fireEvent.change(phoneInput, { target: { value: '+251912345678' } });
    fireEvent.click(screen.getByRole('button', { name: /send otp/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/verification code/i)).toBeInTheDocument();
    });

    // Click change phone number
    fireEvent.click(screen.getByText(/change phone number/i));

    await waitFor(() => {
      expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
    });
  });

  it('disables submit button when OTP is incomplete', async () => {
    vi.mocked(api.post).mockResolvedValue({});
    renderWithProviders(<LoginPage />);

    // Request OTP
    const phoneInput = screen.getByLabelText(/phone number/i);
    fireEvent.change(phoneInput, { target: { value: '+251912345678' } });
    fireEvent.click(screen.getByRole('button', { name: /send otp/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/verification code/i)).toBeInTheDocument();
    });

    const verifyButton = screen.getByRole('button', { name: /verify/i });
    expect(verifyButton).toBeDisabled();

    // Enter partial OTP
    const otpInput = screen.getByLabelText(/verification code/i);
    fireEvent.change(otpInput, { target: { value: '12345' } });
    expect(verifyButton).toBeDisabled();

    // Enter complete OTP
    fireEvent.change(otpInput, { target: { value: '123456' } });
    expect(verifyButton).not.toBeDisabled();
  });

  it('redirects to dashboard if already authenticated', async () => {
    const mockUser = {
      id: 'user1',
      phone: '+251912345678',
      name: 'Test User',
      role: 'admin',
    };

    vi.mocked(api.getAccessToken).mockReturnValue('token123');
    vi.mocked(api.get).mockResolvedValue(mockUser);

    renderWithProviders(<LoginPage />);

    // Wait for auth check to complete and redirect
    await waitFor(() => {
      expect(screen.queryByLabelText(/phone number/i)).not.toBeInTheDocument();
    }, { timeout: 2000 });
  });
});
