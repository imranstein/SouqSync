import { createBrowserRouter } from 'react-router-dom'
import LandingPage from '../pages/LandingPage'

const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/login',
    element: (
      <div className="flex min-h-screen items-center justify-center bg-[#F3F4F6]">
        <div className="rounded-2xl bg-white p-8 shadow-lg ring-1 ring-black/5">
          <h1 className="text-xl font-bold text-[#1B2A4A]">Sign in</h1>
          <p className="mt-2 text-sm text-[#6B7280]">
            Use the SoukSync dashboard app to sign in with your phone and OTP.
          </p>
          <a
            href="/dashboard"
            className="mt-4 inline-block rounded-full bg-[#1B2A4A] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-95"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    ),
  },
])

export default router
