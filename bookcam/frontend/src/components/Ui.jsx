export function Spinner({ label = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-stone-500" role="status">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-stone-300 border-t-amber-600" />
      {label}
    </div>
  );
}

export function Alert({ type = 'error', children }) {
  if (!children) return null;
  const styles =
    type === 'success'
      ? 'border-green-200 bg-green-50 text-green-800'
      : 'border-red-200 bg-red-50 text-red-800';
  return (
    <div className={`rounded-md border px-4 py-3 text-sm ${styles}`} role="alert">
      {children}
    </div>
  );
}

export function EmptyState({ children }) {
  return <div className="card px-6 py-12 text-center text-stone-500">{children}</div>;
}

const statusStyles = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-stone-200 text-stone-600',
};

export function StatusBadge({ status }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusStyles[status] || ''}`}>
      {status}
    </span>
  );
}

export function BookCover({ book, className = '' }) {
  return book.coverUrl ? (
    <img src={book.coverUrl} alt={`Cover of ${book.title}`} className={`object-cover ${className}`} />
  ) : (
    <div className={`flex items-center justify-center bg-stone-200 px-2 text-center text-xs text-stone-500 ${className}`}>
      No cover
    </div>
  );
}
