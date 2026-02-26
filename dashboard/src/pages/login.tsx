import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/auth-context';

type Step = 'phone' | 'otp';

export default function LoginPage() {
  const { isAuthenticated, isLoading, error, requestOtp, verifyOtp, clearError } = useAuth();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('+251');
  const [otp, setOtp] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  async function handleRequestOtp(e: FormEvent) {
    e.preventDefault();
    clearError();
    setSubmitting(true);
    try {
      await requestOtp(phone);
      setStep('otp');
    } catch {
      // error is set in context
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerifyOtp(e: FormEvent) {
    e.preventDefault();
    clearError();
    setSubmitting(true);
    try {
      await verifyOtp(phone, otp);
    } catch {
      // error is set in context
    } finally {
      setSubmitting(false);
    }
  }

  const busy = submitting || isLoading;

  return (
    <div className="flex min-h-screen items-center justify-center bg-light px-4">
      <div className="w-full max-w-sm">
        {/* Branding */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-dark">
            Souk<span className="text-primary">Sync</span>
          </h1>
          <p className="mt-2 text-sm text-dark-light">
            B2B FMCG Marketplace Dashboard
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-white p-8 shadow-lg ring-1 ring-black/5">
          <h2 className="mb-1 text-lg font-semibold text-dark">
            {step === 'phone' ? 'Sign in' : 'Enter verification code'}
          </h2>
          <p className="mb-6 text-sm text-gray-500">
            {step === 'phone'
              ? 'Enter your phone number to receive an OTP'
              : `We sent a code to ${phone}`}
          </p>

          {error && (
            <div role="alert" aria-live="polite" className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
              {error}
            </div>
          )}

          {step === 'phone' ? (
            <form onSubmit={handleRequestOtp}>
              <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-gray-700">
                Phone number
              </label>
              <input
                id="phone"
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+251 9XX XXX XXX"
                required
                pattern="\+251[0-9]{9}"
                className="mb-5 block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-dark placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
              />
              <button
                type="submit"
                disabled={busy}
                className="flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-light focus:ring-2 focus:ring-primary/40 focus:outline-none disabled:opacity-60"
              >
                {busy ? (
                  <>
                    <Spinner />
                    <span className="sr-only">Sending...</span>
                  </>
                ) : (
                  'Send OTP'
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp}>
              <label htmlFor="otp" className="mb-1.5 block text-sm font-medium text-gray-700">
                Verification code
              </label>
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                required
                pattern="[0-9]{6}"
                className="mb-5 block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-center text-lg font-mono tracking-[0.3em] text-dark placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
              />
              <button
                type="submit"
                disabled={busy || otp.length !== 6}
                className="flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-light focus:ring-2 focus:ring-primary/40 focus:outline-none disabled:opacity-60"
              >
                {busy ? (
                  <>
                    <Spinner />
                    <span className="sr-only">Verifying...</span>
                  </>
                ) : (
                  'Verify & Sign in'
                )}
              </button>
              <button
                type="button"
                onClick={() => { setStep('phone'); setOtp(''); clearError(); }}
                className="mt-3 w-full text-center text-sm text-primary hover:underline"
              >
                Change phone number
              </button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          &copy; {new Date().getFullYear()} SoukSync. All rights reserved.
        </p>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg aria-hidden="true" className="h-5 w-5 animate-spin text-white" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}
