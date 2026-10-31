import { Heart } from 'lucide-react'
import { SHORTLIST_MAX, useShortlist } from '../context/ShortlistContext.jsx'

export default function ShortlistButton({ code, withLabel = false, className = '' }) {
  const { has, toggle, full } = useShortlist()
  const active = has(code)
  const disabled = !active && full
  const label = active ? 'Remove from shortlist' : disabled ? `Shortlist is full (max ${SHORTLIST_MAX})` : 'Add to shortlist'

  return (
    <button
      type="button"
      onClick={() => toggle(code)}
      disabled={disabled}
      aria-pressed={active}
      aria-label={withLabel ? undefined : `${label}: ${code}`}
      title={label}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
        active ? 'border-rose-400/50 bg-rose-500/10 text-rose-600' : 'border-ink/10 bg-porcelain/60 text-ink-2 hover:border-rose-400/50 hover:text-rose-600'
      } ${className}`}
    >
      <Heart size={15} fill={active ? 'currentColor' : 'none'} />
      {withLabel && (active ? 'Shortlisted' : 'Shortlist')}
    </button>
  )
}
