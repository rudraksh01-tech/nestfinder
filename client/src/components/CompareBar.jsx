import { Link, useLocation } from 'react-router-dom'
import { Heart, Scale, X } from 'lucide-react'
import { SHORTLIST_MAX, useShortlist } from '../context/ShortlistContext.jsx'

// Floating bar that appears once something is shortlisted (hidden on the compare page itself).
export default function CompareBar() {
  const { codes, remove, clear } = useShortlist()
  const { pathname } = useLocation()
  if (codes.length === 0 || pathname === '/compare') return null

  return (
    <div className="fixed inset-x-0 bottom-4 z-30 px-4">
      <div className="glass mx-auto flex max-w-3xl items-center gap-2 rounded-2xl bg-porcelain/90 p-3 shadow-2xl">
        <Heart size={16} className="text-rose-600" fill="currentColor" />
        <span className="mr-1 text-sm font-semibold text-ink">{codes.length}/{SHORTLIST_MAX}</span>
        {/* One line on every screen; on a phone the chips scroll sideways. */}
        <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto [scrollbar-width:none] [mask-image:linear-gradient(to_right,black_85%,transparent)] sm:[mask-image:none]">
          {codes.map((c) => (
            <span key={c} className="inline-flex shrink-0 items-center gap-1 rounded-full bg-ink/[.06] py-0.5 pl-2.5 pr-1 text-xs text-ink">
              <Link to={`/flats/${c}`} className="hover:text-ink">{c}</Link>
              <button type="button" onClick={() => remove(c)} className="rounded-full p-0.5 hover:bg-ink/10" aria-label={`Remove ${c}`}><X size={12} /></button>
            </span>
          ))}
        </div>
        <button type="button" onClick={clear} className="shrink-0 text-xs text-muted hover:text-ink">Clear</button>
        <Link
          to="/compare"
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition ${codes.length >= 2 ? 'bg-signal text-white hover:bg-signal-deep' : 'pointer-events-none bg-ink/[.06] text-muted'}`}
          aria-disabled={codes.length < 2}
        >
          <Scale size={15} /> {codes.length >= 2 ? 'Compare' : 'Add 1 more'}
        </Link>
      </div>
    </div>
  )
}
