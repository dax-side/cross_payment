import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TourStep {
  target: string;
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

const STEPS: TourStep[] = [
  {
    target: 'balance-card',
    title: '1. Welcome to CrossPay',
    description:
      'This is your wallet. It shows your GBP balance and USDC holdings on Polygon Amoy testnet. As a new user your balance starts at £0.',
    position: 'bottom',
  },
  {
    target: 'deposit-tab',
    title: '2. Fund your account',
    description:
      'Click the Deposit tab, enter any GBP amount (e.g. £500), and hit Deposit. This is a simulated fiat deposit — no real money needed. You need a balance before you can send.',
    position: 'bottom',
  },
  {
    target: 'send-tab',
    title: '3. Send your first transfer',
    description:
      'Switch to Send Transfer. Enter another registered user\'s email and a GBP amount. CrossPay converts your GBP to USDC at live rates and settles on-chain via Polygon Amoy testnet.',
    position: 'bottom',
  },
  {
    target: 'exchange-rate',
    title: '4. Live exchange rate',
    description:
      'This card shows the real-time GBP → USDC rate from CoinGecko. The rate you see here is the rate applied to your transfer.',
    position: 'top',
  },
  {
    target: 'recent-activity',
    title: '5. Track your transfers',
    description:
      'Every transaction appears here with its status (processing → completed or failed). Click any row to see full details including the on-chain tx hash on Polygonscan.',
    position: 'top',
  },
];

export default function TutorialOverlay() {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const shown = sessionStorage.getItem('crosspay_tutorial_shown');
    if (!shown) {
      const t = setTimeout(() => setActive(true), 1500);
      return () => clearTimeout(t);
    }
  }, []);

  const measureTarget = useCallback(() => {
    if (!active) return;
    const current = STEPS[step];
    if (!current) return;
    const el = document.querySelector(`[data-tour="${current.target}"]`);
    if (el) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        setRect(r);
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [active, step]);

  // Retry measuring until we find the element
  useEffect(() => {
    measureTarget();
    const interval = setInterval(() => {
      if (!rect && active) measureTarget();
    }, 300);
    const onResize = () => measureTarget();
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, true);
    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize, true);
    };
  }, [measureTarget, rect, active]);

  const finish = useCallback(() => {
    setActive(false);
    sessionStorage.setItem('crosspay_tutorial_shown', 'true');
  }, []);

  const next = () => {
    if (step < STEPS.length - 1) {
      setRect(null);
      setStep(step + 1);
    } else {
      finish();
    }
  };

  const prev = () => {
    if (step > 0) {
      setRect(null);
      setStep(step - 1);
    }
  };

  if (!active || !rect) return null;

  const current = STEPS[step];
  const pad = 8;

  let tooltipStyle: React.CSSProperties = {};
  const gap = 12;
  switch (current.position) {
    case 'bottom':
      tooltipStyle = {
        position: 'fixed',
        top: rect.bottom + gap,
        left: Math.max(16, Math.min(rect.left + rect.width / 2 - 144, window.innerWidth - 304)),
      };
      break;
    case 'top':
      tooltipStyle = {
        position: 'fixed',
        top: rect.top - gap,
        left: Math.max(16, Math.min(rect.left + rect.width / 2 - 144, window.innerWidth - 304)),
        transform: 'translateY(-100%)',
      };
      break;
    case 'right':
      tooltipStyle = {
        position: 'fixed',
        top: rect.top + rect.height / 2,
        left: rect.right + gap,
        transform: 'translateY(-50%)',
      };
      break;
    case 'left':
      tooltipStyle = {
        position: 'fixed',
        top: rect.top + rect.height / 2,
        left: rect.left - gap,
        transform: 'translate(-100%, -50%)',
      };
      break;
  }

  return (
    <div className="fixed inset-0 z-[100]" style={{ pointerEvents: 'none' }}>
      {/* Backdrop with cut-out */}
      <div
        className="absolute inset-0"
        style={{
          pointerEvents: 'auto',
          background: 'rgba(0,0,0,0.55)',
          clipPath: `polygon(
            0% 0%, 0% 100%, 100% 100%, 100% 0%, 0% 0%,
            ${rect.left - pad}px ${rect.top - pad}px,
            ${rect.left - pad}px ${rect.bottom + pad}px,
            ${rect.right + pad}px ${rect.bottom + pad}px,
            ${rect.right + pad}px ${rect.top - pad}px,
            ${rect.left - pad}px ${rect.top - pad}px
          )`,
        }}
        onClick={finish}
      />

      {/* Gold ring around target */}
      <div
        className="absolute rounded-xl border-2 border-[#d9b47a] pointer-events-none"
        style={{
          top: rect.top - pad,
          left: rect.left - pad,
          width: rect.width + pad * 2,
          height: rect.height + pad * 2,
          boxShadow: '0 0 0 4px rgba(217, 180, 122, 0.25)',
        }}
      />

      {/* Tooltip */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="w-72 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 p-4"
          style={{ ...tooltipStyle, pointerEvents: 'auto', zIndex: 101 }}
        >
          {/* Progress dots */}
          <div className="flex items-center gap-1.5 mb-2">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? 'w-6 bg-[#1f3b5c] dark:bg-blue-400' : 'w-1.5 bg-slate-200 dark:bg-slate-600'
                }`}
              />
            ))}
          </div>

          <h4 className="text-sm font-semibold dark:text-white mb-1">{current.title}</h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
            {current.description}
          </p>

          <div className="flex items-center justify-between">
            <button
              onClick={finish}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition"
            >
              Skip tour
            </button>
            <div className="flex gap-2">
              {step > 0 && (
                <button
                  onClick={prev}
                  className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                >
                  Back
                </button>
              )}
              <button
                onClick={next}
                className="text-xs px-3 py-1.5 rounded-lg bg-[#1f3b5c] text-white hover:bg-[#1a324d] transition"
              >
                {step === STEPS.length - 1 ? 'Got it!' : 'Next'}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
