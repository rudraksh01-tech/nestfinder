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
      <div className="glass mx-auto flex max-w-3xl flex-wrap items-center gap-2 rounded-2xl bg-ink/90 p-3 shadow-2xl">
        <Heart size={16} className="text-pink-300" fill="currentColor" />
        <span className="mr-1 text-sm font-semibold text-white">{codes.length}/{SHORTLIST_MAX}</span>
        <div className="flex flex-1 flex-wrap gap-1.5">
          {codes.map((c) => (
            <span key={c} className="inline-flex items-center gap-1 rounded-full bg-white/10 py-0.5 pl-2.5 pr-1 text-xs text-slate-200">
              <Link to={`/flats/${c}`} className="hover:text-white">{c}</Link>
              <button type="button" onClick={() => remove(c)} className="rounded-full p-0.5 hover:bg-white/15" aria-label={`Remove ${c}`}><X size={12} /></button>
            </span>
          ))}
        </div>
        <button type="button" onClick={clear} className="text-xs text-slate-400 hover:text-white">Clear</button>
        <Link
          to="/compare"
          className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-white transition ${codes.length >= 2 ? 'bg-violet hover:bg-violet/85' : 'pointer-events-none bg-white/10 text-slate-400'}`}
          aria-disabled={codes.length < 2}
        >
          <Scale size={15} /> {codes.length >= 2 ? 'Compare' : 'Add 1 more'}
        </Link>
      </div>
    </div>
  )
}
