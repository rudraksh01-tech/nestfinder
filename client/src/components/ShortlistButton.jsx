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
        active ? 'border-pink-400/50 bg-pink-500/15 text-pink-300' : 'border-white/10 bg-ink/60 text-slate-300 hover:border-pink-400/50 hover:text-pink-300'
      } ${className}`}
    >
      <Heart size={15} fill={active ? 'currentColor' : 'none'} />
      {withLabel && (active ? 'Shortlisted' : 'Shortlist')}
    </button>
  )
}
