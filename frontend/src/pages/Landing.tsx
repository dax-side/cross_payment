import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useDarkMode } from '../hooks/useDarkMode';

export default function Landing() {
  const { dark, toggle } = useDarkMode();
  const [sendAmount, setSendAmount] = useState(100);
  const fee = +(sendAmount * 0.005).toFixed(2);
  const net = +(sendAmount - fee).toFixed(2);
  const rate = 1.2631;
  const recipientGets = +(net * rate).toFixed(2);

  return (
    <div className="min-h-screen bg-[#f5f0e8] dark:bg-[#0c1117] text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 -right-32 h-[32rem] w-[32rem] rounded-full bg-[#e8c97a]/25 dark:bg-[#c8962a]/10 blur-3xl" />
          <div className="absolute top-40 -left-24 h-80 w-80 rounded-full bg-[#d4e8f0]/40 dark:bg-[#1f3b5c]/20 blur-3xl" />
          <div className="absolute bottom-0 right-10 h-64 w-64 rounded-full bg-[#c8e6d4]/40 dark:bg-[#1a4a2e]/20 blur-3xl" />
        </div>

        {/* Header */}
        <header className="border-b border-slate-200/80 dark:border-slate-800/80">
          <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-[#1f3b5c] flex items-center justify-center">
                <span className="text-[#e8c97a] font-serif font-bold text-lg">C</span>
              </div>
              <div>
                <h1 className="text-lg font-semibold tracking-tight dark:text-white">CrossPay</h1>
                <p className="text-[10px] uppercase tracking-[0.25em] text-slate-400">Private client</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={toggle}
                className="h-9 w-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                title={dark ? 'Light mode' : 'Dark mode'}
              >
                {dark ? (
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <circle cx="12" cy="12" r="5" />
                    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
              <Link to="/login" className="text-sm text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition">
                Login
              </Link>
              <Link
                to="/register"
                className="text-sm bg-[#1f3b5c] text-white px-4 py-2 rounded-lg shadow-sm hover:bg-[#17304d] transition"
              >
                Register
              </Link>
            </div>
          </div>
        </header>

        {/* Hero */}
        <main className="relative">
          <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 grid lg:grid-cols-2 gap-14 items-center">
            {/* Copy */}
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[#b07a2a] dark:text-[#e8c97a] font-semibold mb-5">
                Cross-border payments
              </p>
              <h2 className="text-5xl md:text-6xl font-serif font-bold tracking-tight leading-[1.05] mb-6 dark:text-white">
                Send GBP.<br />
                <span className="text-[#b07a2a] dark:text-[#e8c97a]">Settle in USDC.</span>
              </h2>
              <div className="h-[3px] w-20 bg-[#b07a2a] dark:bg-[#e8c97a] rounded-full mb-7" />
              <p className="text-xl text-slate-600 dark:text-slate-400 mb-10 leading-relaxed">
                Send by email. Convert at live rates. Settle on Polygon in seconds —{' '}
                <span className="text-slate-800 dark:text-slate-200 font-medium">one flat 0.5% fee</span>, nothing hidden.
              </p>
              <div className="flex flex-wrap gap-3 mb-10">
                <Link
                  to="/register"
                  className="bg-[#1f3b5c] text-white px-7 py-3.5 rounded-xl text-sm font-semibold shadow-md hover:bg-[#17304d] transition"
                >
                  Get started free
                </Link>
                <a
                  href="#security"
                  className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-7 py-3.5 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-700 hover:border-[#b07a2a] dark:hover:border-[#e8c97a] transition"
                >
                  View security
                </a>
              </div>
              <div className="flex items-center gap-5 text-sm text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" />On-chain settlement</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#b07a2a] dark:bg-[#e8c97a]" />24/7 available</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-slate-400" />No minimums</span>
              </div>
            </div>

            {/* Interactive Fee Calculator */}
            <div className="bg-white dark:bg-[#141b26] border border-slate-200/80 dark:border-slate-700/60 rounded-2xl shadow-[0_32px_80px_-32px_rgba(15,23,42,0.4)] dark:shadow-[0_32px_80px_-32px_rgba(0,0,0,0.7)] p-7">
              <div className="flex items-center justify-between mb-7">
                <p className="text-base font-semibold dark:text-white tracking-tight">Fee calculator</p>
                <span className="text-xs text-[#b07a2a] dark:text-[#e8c97a] font-medium bg-[#b07a2a]/10 dark:bg-[#e8c97a]/10 px-2.5 py-1 rounded-full">Live estimate</span>
              </div>

              {/* Amount slider */}
              <div className="mb-6">
                <label className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-3 block">You send (GBP)</label>
                <div className="relative flex items-center gap-4">
                  <span className="text-3xl font-serif font-bold dark:text-white w-28 shrink-0">
                    £{sendAmount.toLocaleString()}
                  </span>
                  <input
                    type="range"
                    min={10}
                    max={5000}
                    step={10}
                    value={sendAmount}
                    onChange={(e) => setSendAmount(Number(e.target.value))}
                    className="flex-1 accent-[#b07a2a]"
                  />
                </div>
              </div>

              {/* Breakdown */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-800/60 px-4 py-3">
                  <span className="text-sm text-slate-500 dark:text-slate-400">Platform fee (0.5%)</span>
                  <span className="text-sm font-semibold text-red-500">−£{fee.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-800/60 px-4 py-3">
                  <span className="text-sm text-slate-500 dark:text-slate-400">Net converted</span>
                  <span className="text-sm font-semibold dark:text-white">£{net.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border-2 border-[#b07a2a]/30 dark:border-[#e8c97a]/20 bg-[#b07a2a]/5 dark:bg-[#e8c97a]/5 px-4 py-3.5">
                  <div>
                    <p className="text-xs text-[#b07a2a] dark:text-[#e8c97a] font-medium uppercase tracking-wider mb-0.5">Recipient gets</p>
                    <p className="text-2xl font-serif font-bold dark:text-white">{recipientGets.toLocaleString()} USDC</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400 mb-0.5">Rate</p>
                    <p className="text-sm font-semibold dark:text-slate-200">1 GBP = {rate} USD</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2.5 text-center">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-0.5">Network</p>
                  <p className="text-xs font-semibold dark:text-white">Polygon Amoy</p>
                </div>
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2.5 text-center">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-0.5">Token</p>
                  <p className="text-xs font-semibold dark:text-white">USDC (ERC-20)</p>
                </div>
              </div>

              <Link
                to="/register"
                className="mt-5 block w-full text-center bg-[#1f3b5c] hover:bg-[#17304d] text-white py-3 rounded-xl text-sm font-semibold transition shadow-sm"
              >
                Send £{sendAmount.toLocaleString()} now →
              </Link>
            </div>
          </section>

          {/* Features */}
          <section id="features" className="max-w-6xl mx-auto px-6 py-12">
            <div className="flex items-center gap-4 mb-6">
              <span className="text-[11px] uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Features</span>
              <div className="h-px flex-1 bg-gradient-to-r from-slate-300 dark:from-slate-700 to-transparent" />
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-2xl p-6 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.45)] transition hover:-translate-y-1">
                <div className="h-10 w-10 rounded-xl bg-[#e7eef6] dark:bg-[#1f3b5c]/30 text-[#1f3b5c] dark:text-[#93b5e0] flex items-center justify-center mb-4">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M4 7h16M4 12h10M4 17h7" strokeLinecap="round" />
                  </svg>
                </div>
                <h3 className="text-lg font-serif font-semibold mb-2 dark:text-white">Clear pricing</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Know the exact fee before you send. No hidden FX spreads or surprise charges.
                </p>
              </div>
              <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-2xl p-6 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.45)] transition hover:-translate-y-1">
                <div className="h-10 w-10 rounded-xl bg-[#f4e6d2] dark:bg-[#b07a2a]/20 text-[#b07a2a] dark:text-[#d9b47a] flex items-center justify-center mb-4">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M13 4l-2 7h6l-8 9 2-7H5l8-9z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h3 className="text-lg font-serif font-semibold mb-2 dark:text-white">Fast settlement</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Transactions settle on-chain, with confirmations you can track in real time.
                </p>
              </div>
              <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-2xl p-6 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.45)] transition hover:-translate-y-1">
                <div className="h-10 w-10 rounded-xl bg-[#e6eceb] dark:bg-[#5b6b6f]/20 text-[#5b6b6f] dark:text-[#8fa5a9] flex items-center justify-center mb-4">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M7 14a3 3 0 1 1 3-3M14 17a3 3 0 1 0-3-3" strokeLinecap="round" />
                    <path d="M3 21a6 6 0 0 1 10.5-3.5M10.5 17.5A6 6 0 0 1 21 21" strokeLinecap="round" />
                  </svg>
                </div>
                <h3 className="text-lg font-serif font-semibold mb-2 dark:text-white">Email-based delivery</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Send by recipient email. We route funds to their saved wallet address.
                </p>
              </div>
            </div>
          </section>

          {/* Security */}
          <section id="security" className="max-w-6xl mx-auto px-6 py-12">
            <div className="flex items-center gap-4 mb-6">
              <span className="text-[11px] uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Security</span>
              <div className="h-px flex-1 bg-gradient-to-r from-slate-300 dark:from-slate-700 to-transparent" />
            </div>
            <div className="max-w-2xl">
              <h3 className="text-2xl font-serif font-semibold mb-4 dark:text-white">Security details</h3>
              <p className="text-slate-600 dark:text-slate-400">
                This demo uses standard authentication and safe key handling. Check the{' '}
                <a
                  href="https://github.com/dax-side/cross_payment/blob/main/README.md"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#1f3b5c] dark:text-[#93b5e0] hover:underline font-medium"
                >
                  README
                </a>
                {' '}for the full list of protections and limitations.
              </p>
            </div>
          </section>

          {/* Pricing */}
          <section id="pricing" className="max-w-6xl mx-auto px-6 py-12">
            <div className="flex items-center gap-4 mb-6">
              <span className="text-[11px] uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Pricing</span>
              <div className="h-px flex-1 bg-gradient-to-r from-slate-300 dark:from-slate-700 to-transparent" />
            </div>
            <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-2xl p-8 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.5)] relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-[#f8efe2] via-white to-white dark:from-slate-700 dark:via-slate-800 dark:to-slate-800 opacity-70" />
              <div className="relative">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  <div>
                    <h3 className="text-2xl font-serif font-semibold mb-2 dark:text-white">Simple pricing</h3>
                    <p className="text-slate-600 dark:text-slate-400">
                      One transparent fee per transfer. 0.5% with a £0.01 minimum.
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
        <footer className="border-t border-slate-200/80 dark:border-slate-800 px-6 py-6 text-sm text-slate-500 dark:text-slate-400">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2">
            <span>© 2026 CrossPay</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
