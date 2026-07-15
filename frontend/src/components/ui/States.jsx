export function Spinner({ size = 'md' }) {
  const sz = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }[size]
  return (
    <div className={`${sz} border-2 border-outline-variant border-t-primary rounded-full animate-spin`} />
  )
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="lg" />
        <p className="text-body-sm text-on-surface-variant">Loading…</p>
      </div>
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="card p-4 animate-pulse">
      <div className="h-40 bg-surface-container rounded-xl mb-4" />
      <div className="h-4 bg-surface-container rounded w-3/4 mb-2" />
      <div className="h-3 bg-surface-container rounded w-1/2" />
    </div>
  )
}

export function EmptyState({ icon = 'inbox', title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] gap-4 text-center p-8">
      <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center">
        <span className="material-symbols-outlined text-[32px] text-on-surface-variant">{icon}</span>
      </div>
      <div>
        <h3 className="text-title-md font-semibold text-on-surface mb-1">{title}</h3>
        {description && <p className="text-body-sm text-on-surface-variant max-w-sm">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] gap-4 text-center p-8">
      <div className="w-16 h-16 rounded-full bg-error-container flex items-center justify-center">
        <span className="material-symbols-outlined text-[32px] text-error">error_outline</span>
      </div>
      <div>
        <h3 className="text-title-md font-semibold text-on-surface mb-1">Something went wrong</h3>
        <p className="text-body-sm text-on-surface-variant max-w-sm">{message || 'An unexpected error occurred.'}</p>
      </div>
      {onRetry && (
        <button className="btn-secondary text-body-sm" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  )
}
