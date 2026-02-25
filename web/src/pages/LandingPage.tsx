import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const NAVY = '#1B2A4A'
const NAVY_DARK = '#0F1A30'
const ORANGE = '#FF6B35'
const INK = '#111827'
const MUTED = '#6B7280'
const CARD_BG = '#FAFAFA'
const SURFACE = '#F3F4F6'

const features = [
  {
    title: 'Never run out of stock',
    desc: 'Smart restocking and one-tap reorders keep your shelves full and your customers happy.',
    icon: '📦',
    accent: ORANGE,
  },
  {
    title: 'Get instant credit',
    desc: 'Buy now, pay later. Access ETB credit from trusted partners and grow without cash flow stress.',
    icon: '💳',
    accent: NAVY,
  },
  {
    title: 'Order in one tap',
    desc: 'Restock your bestsellers instantly. Connect with distributors and track orders from your phone.',
    icon: '⚡',
    accent: ORANGE,
  },
]

const steps = [
  { step: '1', title: 'Sign up', text: 'Enter your phone number. Verify with OTP — no passwords.' },
  { step: '2', title: 'Get approved', text: 'We assess your shop and extend Buy Now Pay Later credit.' },
  { step: '3', title: 'Order & grow', text: 'Browse products, place orders, and restock with one tap.' },
]

export default function LandingPage() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ backgroundColor: SURFACE, fontFamily: 'Outfit, system-ui, sans-serif' }}>
      {/* Nav */}
      <header
        className="sticky top-0 z-50 border-b border-black/5 transition-all duration-300"
        style={{
          backgroundColor: mounted ? CARD_BG : 'transparent',
          boxShadow: mounted ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
        }}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2 transition hover:opacity-90">
            <span className="text-xl font-bold tracking-tight" style={{ fontFamily: 'Syne, sans-serif', color: NAVY }}>
              Souk<span style={{ color: ORANGE }}>Sync</span>
            </span>
          </Link>
          <nav className="flex items-center gap-6">
            <a href="#features" className="text-sm font-medium transition hover:opacity-80" style={{ color: MUTED }}>
              Features
            </a>
            <a href="#how" className="text-sm font-medium transition hover:opacity-80" style={{ color: MUTED }}>
              How it works
            </a>
            <Link
              to="/login"
              className="rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
              style={{ backgroundColor: NAVY, boxShadow: '0 2px 8px rgba(27,42,74,0.3)' }}
            >
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section
        className="relative overflow-hidden px-4 py-20 sm:px-6 sm:py-28 lg:px-8"
        style={{
          background: `linear-gradient(135deg, ${NAVY} 0%, ${NAVY_DARK} 50%, #0a1220 100%)`,
          backgroundSize: '200% 200%',
          animation: 'gradient-shift 12s ease infinite',
          boxShadow: '0 8px 24px rgba(15,26,48,0.4)',
        }}
      >
        {/* Decorative orbs */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full opacity-20 blur-3xl" style={{ backgroundColor: ORANGE }} />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-80 w-80 rounded-full opacity-15 blur-3xl" style={{ backgroundColor: ORANGE }} />
        <div className="pointer-events-none absolute right-1/4 top-1/3 h-40 w-40 rounded-full opacity-10" style={{ backgroundColor: '#fff' }} />

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <p
              className="animate-fade-in-up text-sm font-medium uppercase tracking-widest opacity-80"
              style={{ color: 'rgba(255,255,255,0.9)', animationDelay: '0ms', animationFillMode: 'both' }}
            >
              B2B FMCG Marketplace · Ethiopia & East Africa
            </p>
            <h1
              className="mt-4 text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl"
              style={{
                fontFamily: 'Syne, sans-serif',
                animation: 'fade-in-up 0.8s ease-out 0.1s both',
                textShadow: '0 2px 20px rgba(0,0,0,0.2)',
              }}
            >
              Your Market,{' '}
              <span className="animate-float inline-block" style={{ color: ORANGE }}>
                Your Power
              </span>
            </h1>
            <p
              className="mx-auto mt-6 max-w-xl text-lg leading-relaxed"
              style={{ color: 'rgba(255,255,255,0.88)', animation: 'fade-in-up 0.8s ease-out 0.2s both' }}
            >
              Connect with distributors, restock smarter, and grow with Buy Now Pay Later credit built for kiosk owners.
            </p>
            <div
              className="mt-10 flex flex-col items-start gap-4 sm:flex-row"
              style={{ animation: 'fade-in-up 0.8s ease-out 0.35s both' }}
            >
              <Link
                to="/login"
                className="inline-flex w-full items-center justify-center rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg transition hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] sm:w-auto"
                style={{ backgroundColor: ORANGE, boxShadow: '0 4px 14px rgba(255,107,53,0.4)' }}
              >
                Get Started
              </Link>
              <a
                href="#features"
                className="inline-flex w-full items-center justify-center rounded-full border-2 border-white/60 bg-transparent px-8 py-4 text-base font-semibold text-white transition hover:bg-white/10 sm:w-auto"
              >
                See how it works
              </a>
            </div>
          </div>
          <div
            className="relative hidden lg:block"
            style={{ animation: 'scale-in 1s ease-out 0.3s both' }}
          >
            <div
              className="overflow-hidden rounded-2xl shadow-2xl ring-2 ring-white/10"
              style={{ boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)' }}
            >
              <img
                src="/images/souksync-hero.webp"
                alt="B2B marketplace — kiosks and growth in Ethiopia"
                className="h-full w-full object-cover"
                width={600}
                height={400}
              />
            </div>
            <div className="absolute -bottom-4 -right-4 h-24 w-24 rounded-2xl bg-white/10 backdrop-blur-sm" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2
            className="text-center text-3xl font-bold tracking-tight sm:text-4xl"
            style={{ fontFamily: 'Syne, sans-serif', color: INK }}
          >
            Built for the souk
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-lg" style={{ color: MUTED }}>
            Everything kiosk owners need to stock up, get credit, and grow — in one place.
          </p>
          <div className="mt-20 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="group rounded-2xl p-8 transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                style={{
                  backgroundColor: CARD_BG,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                  animation: 'fade-in-up 0.6s ease-out both',
                  animationDelay: `${120 + i * 100}ms`,
                }}
              >
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl transition duration-300 group-hover:scale-110"
                  style={{ backgroundColor: `${f.accent}18` }}
                >
                  {f.icon}
                </div>
                <h3 className="mt-5 text-xl font-bold" style={{ fontFamily: 'Syne, sans-serif', color: INK }}>
                  {f.title}
                </h3>
                <p className="mt-3 leading-relaxed" style={{ color: MUTED }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="px-4 py-24 sm:px-6 lg:px-8" style={{ backgroundColor: CARD_BG }}>
        <div className="mx-auto max-w-6xl">
          <h2
            className="text-center text-3xl font-bold tracking-tight sm:text-4xl"
            style={{ fontFamily: 'Syne, sans-serif', color: INK }}
          >
            How it works
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-lg" style={{ color: MUTED }}>
            From sign-up to first delivery in three simple steps.
          </p>
          <div className="mt-20 flex flex-col gap-12 lg:flex-row lg:justify-between">
            {steps.map((s, i) => (
              <div
                key={s.step}
                className="flex flex-1 flex-col items-center text-center"
                style={{
                  animation: 'fade-in-up 0.6s ease-out both',
                  animationDelay: `${200 + i * 120}ms`,
                }}
              >
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold text-white transition hover:scale-105"
                  style={{ backgroundColor: ORANGE, boxShadow: '0 4px 14px rgba(255,107,53,0.35)' }}
                >
                  {s.step}
                </div>
                <div className="mt-2 h-1 w-12 rounded-full opacity-30" style={{ backgroundColor: ORANGE }} />
                <h3 className="mt-4 text-lg font-bold" style={{ color: INK }}>
                  {s.title}
                </h3>
                <p className="mt-2 max-w-xs text-sm leading-relaxed" style={{ color: MUTED }}>
                  {s.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        className="relative overflow-hidden px-4 py-24 sm:px-6 lg:px-8"
        style={{
          background: `linear-gradient(135deg, ${NAVY} 0%, ${NAVY_DARK} 100%)`,
          boxShadow: '0 -4px 24px rgba(0,0,0,0.08)',
        }}
      >
        <div className="pointer-events-none absolute inset-0 opacity-10" style={{ background: 'radial-gradient(circle at 30% 50%, rgba(255,107,53,0.3), transparent 50%)' }} />
        <div className="relative mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl" style={{ fontFamily: 'Syne, sans-serif' }}>
            Ready to power your kiosk?
          </h2>
          <p className="mt-4 text-lg" style={{ color: 'rgba(255,255,255,0.88)' }}>
            Join distributors and kiosk owners across Ethiopia and the region.
          </p>
          <Link
            to="/login"
            className="mt-8 inline-flex rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg transition hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
            style={{ backgroundColor: ORANGE, boxShadow: '0 4px 14px rgba(255,107,53,0.4)' }}
          >
            Sign in to dashboard
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-black/5 px-4 py-12 sm:px-6 lg:px-8" style={{ backgroundColor: CARD_BG }}>
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
          <span className="text-lg font-bold" style={{ fontFamily: 'Syne, sans-serif', color: NAVY }}>
            Souk<span style={{ color: ORANGE }}>Sync</span>
          </span>
          <p className="text-sm" style={{ color: MUTED }}>
            © {new Date().getFullYear()} SoukSync. B2B marketplace for Ethiopia & East Africa.
          </p>
          <div className="flex gap-6">
            <Link to="/login" className="text-sm font-medium transition hover:opacity-80" style={{ color: MUTED }}>
              Sign in
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
