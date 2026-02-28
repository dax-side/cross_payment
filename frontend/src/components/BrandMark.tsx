import { Link } from 'react-router-dom';

interface BrandMarkProps {
  centered?: boolean;
  showSubtitle?: boolean;
  className?: string;
}

export default function BrandMark({ centered = false, showSubtitle = false, className = '' }: BrandMarkProps) {
  return (
    <Link to="/" className={`inline-flex items-center gap-3 ${centered ? 'justify-center' : ''} ${className}`}>
      <div className="h-10 w-10 rounded-xl bg-[#1f3b5c] border border-[#27496f] flex items-center justify-center relative">
        <span className="text-[#d9b47a] font-serif font-bold text-xs tracking-tight">CP</span>
        <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-[#d9b47a]" />
      </div>
      <div>
        <h1 className="text-xl font-semibold tracking-tight">CrossPay</h1>
        {showSubtitle && <p className="text-[10px] uppercase tracking-[0.25em] text-slate-400">Private client</p>}
      </div>
    </Link>
  );
}