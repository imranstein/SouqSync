import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

/* Refined, modern palette — no Stitch navy/orange. Light, confident, 2025 SaaS feel. */
const SLATE_900 = '#0f172a'
const SLATE_600 = '#475569'
const SLATE_400 = '#94a3b8'
const TEAL_600 = '#0d9488'
const TEAL_700 = '#0f766e'
const BG = '#fafafa'
const CARD = '#ffffff'
const BORDER = 'rgba(15, 23, 42, 0.06)'

const features = [
  {
    title: 'Never run out of stock',
    desc: 'Smart restocking and one-tap reorders keep your shelves full and your customers happy.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
      </svg>
    ),
  },
  {
    title: 'Get instant credit',
    desc: 'Buy now, pay later. Access ETB credit from trusted partners and grow without cash flow stress.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
      </svg>
    ),
  },
  {
    title: 'Order in one tap',
    desc: 'Restock your bestsellers instantly. Connect with distributors and track orders from your phone.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25V13.5zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25V18zm2.498-6.75h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007V13.5zm0 2.25h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007V18zm2.504-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V13.5zm0 2.25h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V18zm2.498-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V13.5zM8.25 6h7.5v2.25h-7.5V6zM12 2.25c-1.892 0-3.758.11-5.593.322C5.307 2.7 4.5 3.65 4.5 4.757V19.5a2.25 2.25 0 002.25 2.25h10.5a2.25 2.25 0 002.25-2.25V4.757c0-1.108-.806-2.057-1.907-2.185A48.507 48.507 0 0012 2.25z" />
      </svg>
    ),
  },
]

const steps = [
  { step: 1, title: 'Sign up', text: 'Enter your phone number. Verify with OTP — no passwords.' },
  { step: 2, title: 'Get approved', text: 'We assess your shop and extend Buy Now Pay Later credit.' },
  { step: 3, title: 'Order & grow', text: 'Browse products, place orders, and restock with one tap.' },
]

export default function LandingPage() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <div
      className="min-h-screen overflow-x-hidden antialiased"
      style={{ backgroundColor: BG, fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif' }}
    >
      {/* Nav — minimal, glass-like when scrolled */}
      <header
        className="sticky top-0 z-50 transition-all duration-300"
        style={{
          backgroundColor: mounted ? 'rgba(250, 250, 250, 0.8)' : 'transparent',
          backdropFilter: mounted ? 'saturate(180%) blur(12px)' : 'none',
          WebkitBackdropFilter: mounted ? 'saturate(180%) blur(12px)' : 'none',
          borderBottom: mounted ? `1px solid ${BORDER}` : 'none',
        }}
      >
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <span className="text-lg font-bold tracking-tight" style={{ color: SLATE_900 }}>
              Souk<span style={{ color: TEAL_600 }}>Sync</span>
            </span>
          </Link>
          <nav className="flex items-center gap-8">
            <a href="#features" className="text-sm font-medium transition-colors hover:text-slate-900" style={{ color: SLATE_600 }}>
              Features
            </a>
            <a href="#how" className="text-sm font-medium transition-colors hover:text-slate-900" style={{ color: SLATE_600 }}>
              How it works
            </a>
            <Link
              to="/login"
              className="rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-95 active:scale-[0.98]"
              style={{ backgroundColor: SLATE_900 }}
            >
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero — no image, CSS-only mesh + typography */}
      <section className="relative overflow-hidden px-4 pt-24 pb-32 sm:px-6 sm:pt-32 sm:pb-40 lg:px-8">
        {/* Subtle mesh gradient (no heavy gradients or orbs) */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.4]"
          style={{
            background: `
              radial-gradient(ellipse 80% 50% at 50% -20%, rgba(13, 148, 136, 0.15), transparent),
              radial-gradient(ellipse 60% 40% at 80% 50%, rgba(15, 23, 42, 0.03), transparent),
              radial-gradient(ellipse 50% 30% at 20% 80%, rgba(13, 148, 136, 0.08), transparent)
            `,
            animation: 'mesh 20s ease-in-out infinite',
          }}
        />
        <div className="relative mx-auto max-w-3xl text-center">
          <p
            className="text-sm font-medium uppercase tracking-widest"
            style={{ color: TEAL_600, animation: 'fade-in-up 0.6s ease-out both' }}
          >
            B2B FMCG · Ethiopia & East Africa
          </p>
          <h1
            className="mt-5 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl"
            style={{
              color: SLATE_900,
              lineHeight: 1.1,
              animation: 'fade-in-up 0.6s ease-out 0.05s both',
              letterSpacing: '-0.02em',
            }}
          >
            Your market.{' '}
            <span style={{ color: TEAL_600 }}>Your power.</span>
          </h1>
          <p
            className="mx-auto mt-6 max-w-xl text-lg leading-relaxed"
            style={{ color: SLATE_600, animation: 'fade-in-up 0.6s ease-out 0.1s both' }}
          >
            Connect with distributors, restock smarter, and grow with Buy Now Pay Later credit built for kiosk owners.
          </p>
          <div
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
            style={{ animation: 'fade-in-up 0.6s ease-out 0.15s both' }}
          >
            <Link
              to="/login"
              className="inline-flex w-full items-center justify-center rounded-lg px-6 py-3.5 text-base font-semibold text-white shadow-sm transition-all hover:opacity-95 active:scale-[0.98] sm:w-auto"
              style={{ backgroundColor: TEAL_600 }}
            >
              Get started
            </Link>
            <a
              href="#features"
              className="inline-flex w-full items-center justify-center rounded-lg border px-6 py-3.5 text-base font-semibold transition-colors hover:bg-slate-50 sm:w-auto"
              style={{ borderColor: BORDER, color: SLATE_900 }}
            >
              See how it works
            </a>
          </div>
        </div>
      </section>

      {/* Features — bento-style cards, clean */}
      <section id="features" className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <h2
            className="text-center text-2xl font-bold tracking-tight sm:text-3xl"
            style={{ color: SLATE_900, letterSpacing: '-0.02em' }}
          >
            Built for the souk
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-base" style={{ color: SLATE_600 }}>
            Everything kiosk owners need to stock up, get credit, and grow — in one place.
          </p>
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="group rounded-2xl border p-8 transition-all duration-200 hover:border-slate-200 hover:shadow-sm"
                style={{
                  backgroundColor: CARD,
                  borderColor: BORDER,
                  animation: 'fade-in-up 0.5s ease-out both',
                  animationDelay: `${80 + i * 80}ms`,
                }}
              >
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-xl transition-colors group-hover:bg-teal-50"
                  style={{ color: TEAL_600 }}
                >
                  {f.icon}
                </div>
                <h3 className="mt-5 text-lg font-semibold" style={{ color: SLATE_900 }}>
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: SLATE_600 }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works — minimal steps */}
      <section id="how" className="border-t px-4 py-24 sm:px-6 lg:px-8" style={{ borderColor: BORDER, backgroundColor: CARD }}>
        <div className="mx-auto max-w-5xl">
          <h2
            className="text-center text-2xl font-bold tracking-tight sm:text-3xl"
            style={{ color: SLATE_900, letterSpacing: '-0.02em' }}
          >
            How it works
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-base" style={{ color: SLATE_600 }}>
            From sign-up to first delivery in three steps.
          </p>
          <div className="mt-16 grid gap-10 sm:grid-cols-3">
            {steps.map((s, i) => (
              <div
                key={s.step}
                className="text-center"
                style={{
                  animation: 'fade-in-up 0.5s ease-out both',
                  animationDelay: `${120 + i * 100}ms`,
                }}
              >
                <div
                  className="mx-auto flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ backgroundColor: TEAL_600 }}
                >
                  {s.step}
                </div>
                <h3 className="mt-4 font-semibold" style={{ color: SLATE_900 }}>
                  {s.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed" style={{ color: SLATE_600 }}>
                  {s.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA — single block, no heavy gradient */}
      <section
        className="px-4 py-24 sm:px-6 lg:px-8"
        style={{ backgroundColor: SLATE_900 }}
      >
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl" style={{ letterSpacing: '-0.02em' }}>
            Ready to power your kiosk?
          </h2>
          <p className="mt-3 text-base" style={{ color: SLATE_400 }}>
            Join distributors and kiosk owners across Ethiopia and the region.
          </p>
          <Link
            to="/login"
            className="mt-8 inline-flex rounded-lg px-6 py-3.5 text-base font-semibold text-white transition-all hover:opacity-95 active:scale-[0.98]"
            style={{ backgroundColor: TEAL_600 }}
          >
            Sign in to dashboard
          </Link>
        </div>
      </section>

      {/* Footer — minimal */}
      <footer
        className="border-t px-4 py-10 sm:px-6 lg:px-8"
        style={{ borderColor: BORDER, backgroundColor: CARD }}
      >
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 sm:flex-row">
          <span className="text-sm font-semibold" style={{ color: SLATE_900 }}>
            Souk<span style={{ color: TEAL_600 }}>Sync</span>
          </span>
          <p className="text-sm" style={{ color: SLATE_600 }}>
            © {new Date().getFullYear()} SoukSync. B2B marketplace for Ethiopia & East Africa.
          </p>
          <Link to="/login" className="text-sm font-medium transition-colors hover:text-slate-900" style={{ color: SLATE_600 }}>
            Sign in
          </Link>
        </div>
      </footer>
    </div>
  )
}
