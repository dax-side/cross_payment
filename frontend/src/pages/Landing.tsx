import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#f6f2eb] text-slate-900">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-[#cbd5e1]/40 blur-3xl" />
          <div className="absolute top-40 -left-24 h-80 w-80 rounded-full bg-[#fde7c7]/55 blur-3xl" />
          <div className="absolute bottom-0 right-10 h-64 w-64 rounded-full bg-[#dbe7dd]/50 blur-3xl" />
        </div>

        {/* Header */}
        <header className="border-b border-slate-200/80">
          <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-white border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-100 via-white to-blue-100" />
              </div>
              <div>
                <h1 className="text-lg font-semibold tracking-tight">CrossPay</h1>
                <p className="text-[10px] uppercase tracking-[0.25em] text-slate-400">Private client</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/login" className="text-sm text-slate-700 hover:text-slate-900">
                Login
              </Link>
              <Link
                to="/register"
                className="text-sm bg-[#1f3b5c] text-white px-4 py-2 rounded-lg shadow-sm hover:bg-[#1a324d]"
              >
                Register
              </Link>
            </div>
          </div>
        </header>

        {/* Hero */}
        <main className="relative">
          <section className="max-w-6xl mx-auto px-6 pt-16 pb-12 grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500 mb-4">
                Cross-border payments, simplified
              </p>
              <h2 className="text-4xl md:text-5xl font-serif font-semibold tracking-tight leading-tight mb-5">
                Send money globally with clear rates and instant settlement.
              </h2>
              <div className="h-px w-24 bg-gradient-to-r from-[#b07a2a] via-[#d9b47a] to-transparent mb-6" />
              <p className="text-lg text-slate-600 mb-8">
                Move funds with USDC on Polygon. Transparent fees, compliant onboarding, and
                wallet-based access for teams and individuals.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/register"
                  className="bg-[#1f3b5c] text-white px-6 py-3 rounded-lg text-sm font-medium shadow-sm hover:bg-[#1a324d]"
                >
                  Get started
                </Link>
                <a
                  href="#security"
                  className="bg-white text-slate-700 px-6 py-3 rounded-lg text-sm font-medium border border-slate-200 hover:border-slate-300"
                >
                  View security
                </a>
              </div>
              <div className="mt-8 flex items-center gap-6 text-sm text-slate-500">
                <span>15m average settlement</span>
                <span>•</span>
                <span>24/7 availability</span>
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-2">
                <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Explore</span>
                <a
                  href="#features"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs text-slate-600 hover:text-slate-900 hover:border-slate-300 transition"
                >
                  <span className="h-2 w-2 rounded-full bg-[#1f3b5c]" />
                  Features
                </a>
                <a
                  href="#security"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs text-slate-600 hover:text-slate-900 hover:border-slate-300 transition"
                >
                  <span className="h-2 w-2 rounded-full bg-[#b07a2a]" />
                  Security
                </a>
                <a
                  href="#pricing"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs text-slate-600 hover:text-slate-900 hover:border-slate-300 transition"
                >
                  <span className="h-2 w-2 rounded-full bg-[#5b6b6f]" />
                  Pricing
                </a>
              </div>
            </div>
            <div className="bg-white border border-slate-200/80 rounded-2xl shadow-[0_24px_60px_-40px_rgba(15,23,42,0.55)] p-6">
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm font-medium">Live corridor preview</p>
                <span className="text-xs text-slate-500 inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Updated just now
                </span>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
                  <div>
                    <p className="text-xs text-slate-500">You send</p>
                    <p className="text-base font-semibold">$2,500</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Fee</p>
                    <p className="text-base font-semibold">$4.20</p>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
                  <div>
                    <p className="text-xs text-slate-500">Recipient gets</p>
                    <p className="text-base font-semibold">₦3,980,000</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Rate</p>
                    <p className="text-base font-semibold">1,595.2</p>
                  </div>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-4 text-xs text-slate-500">
                <div className="rounded-lg border border-slate-200 px-3 py-2">USDC settlement</div>
                <div className="rounded-lg border border-slate-200 px-3 py-2">Compliance-ready</div>
              </div>
            </div>
          </section>

          {/* Features */}
          <section id="features" className="max-w-6xl mx-auto px-6 py-12">
            <div className="flex items-center gap-4 mb-6">
              <span className="text-[11px] uppercase tracking-[0.3em] text-slate-500">Features</span>
              <div className="h-px flex-1 bg-gradient-to-r from-slate-300 to-transparent" />
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.45)] transition hover:-translate-y-1">
                <div className="h-10 w-10 rounded-xl bg-[#e7eef6] text-[#1f3b5c] flex items-center justify-center mb-4">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M4 7h16M4 12h10M4 17h7" strokeLinecap="round" />
                  </svg>
                </div>
                <h3 className="text-lg font-serif font-semibold mb-2">Clear pricing</h3>
                <p className="text-sm text-slate-600">
                  Know the exact fee before you send. No hidden FX spreads or surprise charges.
                </p>
              </div>
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.45)] transition hover:-translate-y-1">
                <div className="h-10 w-10 rounded-xl bg-[#f4e6d2] text-[#b07a2a] flex items-center justify-center mb-4">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M13 4l-2 7h6l-8 9 2-7H5l8-9z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h3 className="text-lg font-serif font-semibold mb-2">Fast settlement</h3>
                <p className="text-sm text-slate-600">
                  Transactions settle on-chain, with confirmations you can track in real time.
                </p>
              </div>
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.45)] transition hover:-translate-y-1">
                <div className="h-10 w-10 rounded-xl bg-[#e6eceb] text-[#5b6b6f] flex items-center justify-center mb-4">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M7 14a3 3 0 1 1 3-3M14 17a3 3 0 1 0-3-3" strokeLinecap="round" />
                    <path d="M3 21a6 6 0 0 1 10.5-3.5M10.5 17.5A6 6 0 0 1 21 21" strokeLinecap="round" />
                  </svg>
                </div>
                <h3 className="text-lg font-serif font-semibold mb-2">Built for teams</h3>
                <p className="text-sm text-slate-600">
                  Role-based access, audit trails, and wallet controls for operations teams.
                </p>
              </div>
            </div>
          </section>

          {/* Security */}
          <section id="security" className="max-w-6xl mx-auto px-6 py-12">
            <div className="flex items-center gap-4 mb-6">
              <span className="text-[11px] uppercase tracking-[0.3em] text-slate-500">Security</span>
              <div className="h-px flex-1 bg-gradient-to-r from-slate-300 to-transparent" />
            </div>
            <div className="grid lg:grid-cols-[1.2fr_1fr] gap-8 items-center">
              <div>
                <h3 className="text-2xl font-serif font-semibold mb-4">Security and compliance at the core</h3>
                <p className="text-slate-600 mb-6">
                  We keep your funds protected with strict key management, automated risk checks,
                  and detailed audit logs.
                </p>
                <ul className="space-y-3 text-sm text-slate-600">
                  <li className="flex items-start gap-3">
                    <span className="mt-1 h-5 w-5 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center">
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    Token lifecycle controls for access and refresh flows
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 h-5 w-5 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center">
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    Signed transaction approvals with anomaly detection
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 h-5 w-5 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center">
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    Continuous monitoring with instant incident alerts
                  </li>
                </ul>
              </div>
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.45)]">
                <p className="text-sm text-slate-500 mb-4">Operational safeguards</p>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Wallet approvals</span>
                    <span className="text-sm font-semibold text-[#1f3b5c]">4 eyes</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Transaction limits</span>
                    <span className="text-sm font-semibold text-[#1f3b5c]">Configurable</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Pricing */}
          <section id="pricing" className="max-w-6xl mx-auto px-6 py-12">
            <div className="flex items-center gap-4 mb-6">
              <span className="text-[11px] uppercase tracking-[0.3em] text-slate-500">Pricing</span>
              <div className="h-px flex-1 bg-gradient-to-r from-slate-300 to-transparent" />
            </div>
            <div className="bg-white border border-slate-200/80 rounded-2xl p-8 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.5)] relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-[#f8efe2] via-white to-white opacity-70" />
              <div className="relative">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  <div>
                    <h3 className="text-2xl font-serif font-semibold mb-2">Simple pricing</h3>
                    <p className="text-slate-600">
                      One transparent fee per transfer. Volume pricing for enterprise accounts.
                    </p>
                  </div>
                  <Link
                    to="/register"
                    className="bg-[#1f3b5c] text-white px-5 py-3 rounded-lg text-sm font-medium hover:bg-[#1a324d]"
                  >
                    Create account
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200/80 px-6 py-6 text-sm text-slate-500">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2">
            <span>© 2026 CrossPay</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
