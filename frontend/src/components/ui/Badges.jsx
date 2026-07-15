import clsx from 'clsx'

export function ScoreBadge({ score, fallback, size = 'md' }) {
  const cls =
    score === null || score === undefined
      ? 'score-none'
      : score >= 80
      ? 'score-high'
      : score >= 50
      ? 'score-medium'
      : 'score-low'

  const textSize = size === 'sm' ? 'text-[10px]' : 'text-ai-stat'

  return (
    <span className={clsx('inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold', cls, textSize)}>
      <span className="material-symbols-outlined text-[12px] filled">auto_awesome</span>
      {score !== null && score !== undefined ? `${score}%` : '—'}
      {fallback && score !== null && (
        <span className="text-[9px] opacity-60 ml-0.5">rule</span>
      )}
    </span>
  )
}

export function StatusBadge({ status }) {
  const cfg = {
    PENDING: { cls: 'badge-pending', label: 'Pending' },
    ACCEPTED: { cls: 'badge-accepted', label: 'Accepted' },
    DECLINED: { cls: 'badge-declined', label: 'Declined' },
  }
  const { cls, label } = cfg[status] || { cls: 'score-none', label: status }

  return (
    <span className={clsx('inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide', cls)}>
      {label}
    </span>
  )
}

export function RoomTypeBadge({ type }) {
  const cfg = {
    SINGLE: 'bg-blue-100 text-blue-800',
    SHARED: 'bg-purple-100 text-purple-800',
    STUDIO: 'bg-teal-100 text-teal-800',
  }
  return (
    <span className={clsx('inline-flex px-2 py-0.5 rounded text-[11px] font-semibold', cfg[type] || 'bg-surface-container text-on-surface-variant')}>
      {type}
    </span>
  )
}

export function FurnishingBadge({ status }) {
  const cfg = {
    FURNISHED: 'bg-green-100 text-green-800',
    SEMI_FURNISHED: 'bg-amber-100 text-amber-800',
    UNFURNISHED: 'bg-slate-100 text-slate-700',
  }
  const label = {
    FURNISHED: 'Furnished',
    SEMI_FURNISHED: 'Semi-furnished',
    UNFURNISHED: 'Unfurnished',
  }
  return (
    <span className={clsx('inline-flex px-2 py-0.5 rounded text-[11px] font-semibold', cfg[status] || 'bg-surface-container text-on-surface-variant')}>
      {label[status] || status}
    </span>
  )
}
