import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#f6f2eb] dark:bg-slate-950 flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <div className="h-20 w-20 mx-auto mb-6 rounded-2xl bg-[#1f3b5c] flex items-center justify-center">
          <span className="text-[#d9b47a] font-serif font-bold text-4xl">?</span>
        </div>
        <h1 className="text-5xl font-serif font-bold text-[#1f3b5c] dark:text-white mb-3">404</h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
          This page doesn't exist. Maybe you mistyped the URL, or the page was moved.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-[#1f3b5c] text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-[#1a324d] transition"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to home
        </Link>
      </motion.div>
    </div>
  );
}
