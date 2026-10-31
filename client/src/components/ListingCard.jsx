import { Link } from 'react-router-dom'
import { BedDouble, Dog, MapPin, Ruler, TrainFront } from 'lucide-react'
import { rupees, shortRupees } from '../lib/format.js'

export default function ListingCard({ listing: l }) {
  const highDeposit = l.depositMonths >= 8

  return (
    <Link
      to={`/flats/${l.code}`}
      className="glass group flex flex-col rounded-2xl p-5 transition hover:border-violet-soft/50 hover:bg-white/[.07]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-sm text-slate-400">
            <MapPin size={14} /> {l.locality}
          </p>
          <h3 className="mt-1 font-bold text-white group-hover:text-violet-soft">
            {l.bhk}BHK · {l.furnishing}
          </h3>
        </div>
        <span className="shrink-0 text-xs text-slate-500">{l.code}</span>
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
    </Link>
  )
}
