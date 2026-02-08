export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700 ${className}`}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-2xl p-6 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.45)]">
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <div className="flex-1">
          <Skeleton className="h-3 w-20 mb-2" />
          <Skeleton className="h-7 w-32" />
        </div>
      </div>
      <Skeleton className="h-3 w-40" />
    </div>
  );
}

export function TransactionSkeleton() {
  return (
    <div className="flex items-center justify-between border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3">
      <div>
        <Skeleton className="h-4 w-40 mb-2" />
        <Skeleton className="h-3 w-28" />
      </div>
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-16" />
    </div>
  );
}
