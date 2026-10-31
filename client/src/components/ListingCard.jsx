import { Link } from 'react-router-dom'
import { BedDouble, Dog, MapPin, Ruler, TrainFront } from 'lucide-react'
import ShortlistButton from './ShortlistButton.jsx'
import { rupees, shortRupees } from '../lib/format.js'

const scoreColor = (s) => (s >= 75 ? 'text-mint border-mint/40 bg-mint/10' : s >= 50 ? 'text-violet-soft border-violet-soft/40 bg-violet/10' : 'text-amber border-amber/40 bg-amber/10')
const toneIcon = { good: '✓', warn: '!', bad: '✕' }
const toneColor = { good: 'text-mint', warn: 'text-amber', bad: 'text-red-400' }

// `match` (optional): { score, reasons } from /api/match, shown as a % badge and the top reasons.
export default function ListingCard({ listing: l, match }) {
  const highDeposit = l.depositMonths >= 8

  // The shortlist button sits beside the link (not inside it): a button inside a link is invalid HTML.
  return (
    <div className="relative">
      <Link
        to={`/flats/${l.code}`}
        className="glass group flex h-full flex-col rounded-2xl p-5 transition hover:border-violet-soft/50 hover:bg-white/[.07]"
      >
        {match && (
          <div className="mb-4 flex items-center gap-3 pr-12">
            <span className={`rounded-xl border px-2.5 py-1 text-lg font-extrabold ${scoreColor(match.score)}`}>{match.score}%</span>
            <span className="text-sm text-slate-400">{match.dealbreaker ? 'Has a dealbreaker' : 'match for you'}</span>
          </div>
        )}
        <div className={match ? '' : 'pr-12'}>
          <p className="flex items-center gap-1.5 text-sm text-slate-400">
            <MapPin size={14} /> {l.locality} <span className="text-xs text-slate-500">· {l.code}</span>
          </p>
          <h3 className="mt-1 font-bold text-white group-hover:text-violet-soft">
            {l.bhk}BHK · {l.furnishing}
          </h3>
        </div>

        <p className="mt-4 text-2xl font-extrabold text-white">
          {rupees(l.rent)}<span className="text-sm font-medium text-slate-400"> /month</span>
        </p>
        <p className={`mt-1 text-sm ${highDeposit ? 'text-amber' : 'text-slate-400'}`}>
          Deposit {shortRupees(l.deposit)} ({l.depositMonths} months){highDeposit && ' · high'}
        </p>

        <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-300">
          <li className="flex items-center gap-1.5"><Ruler size={14} /> {l.sqft} sqft</li>
          <li className="flex items-center gap-1.5">
            <TrainFront size={14} className={l.nearestMetro.km <= 1.5 ? 'text-mint' : ''} />
            {l.nearestMetro.km} km to {l.nearestMetro.name}
          </li>
          <li className="flex items-center gap-1.5"><BedDouble size={14} /> {l.tenantPreference === 'Any' ? 'Anyone' : l.tenantPreference}</li>
          {l.petsAllowed && <li className="flex items-center gap-1.5 text-mint"><Dog size={14} /> Pets OK</li>}
        </ul>

        {match && (
          <ul className="mt-4 space-y-1 border-t border-white/10 pt-3 text-sm">
            {match.reasons.slice(0, 4).map((r) => (
              <li key={r.text} className="flex gap-2 text-slate-300">
                <span className={`w-3 shrink-0 font-bold ${toneColor[r.tone]}`} aria-hidden>{toneIcon[r.tone]}</span>
                {r.text}
              </li>
            ))}
          </ul>
        )}
      </Link>
      <ShortlistButton code={l.code} className="absolute right-4 top-4" />
    </div>
  )
}
