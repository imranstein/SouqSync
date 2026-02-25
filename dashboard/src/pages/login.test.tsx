import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from './login';
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
    const submitButton = screen.getByRole('button', { name: /send otp/i });

    // Invalid phone number
    fireEvent.change(phoneInput, { target: { value: '123' } });
    fireEvent.click(submitButton);

    // HTML5 validation should prevent submission
    expect(phoneInput.validity.valid).toBe(false);
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
