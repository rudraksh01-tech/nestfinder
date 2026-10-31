import { Link, useParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, BadgeIndianRupee, Briefcase, Check, MapPin, TrainFront } from 'lucide-react'
import EnquiryForm from '../components/EnquiryForm.jsx'
import { useFetch } from '../lib/useFetch.js'
import { floorLabel, formatDate, rupees } from '../lib/format.js'

// Free OpenStreetMap embed: no API key needed.
function mapUrl([lon, lat]) {
  const bbox = [lon - 0.012, lat - 0.007, lon + 0.012, lat + 0.007].join(',')
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`
}

function Fact({ label, value }) {
  return (
    <div className="rounded-xl bg-white/[.04] p-3">
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="mt-0.5 font-semibold text-white">{value}</dd>
    </div>
  )
}

export default function ListingDetail() {
  const { code } = useParams()
  const { data: l, error, loading } = useFetch(`/api/listings/${encodeURIComponent(code)}`)
  const back = (
    <Link to="/flats" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white">
      <ArrowLeft size={16} /> All flats
    </Link>
  )

  if (loading) return <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{back}<div className="glass mt-6 h-96 animate-pulse rounded-2xl" /></main>
  if (error) return <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{back}<p className="glass mt-6 rounded-2xl p-6 text-amber">{error}</p></main>

  const highDeposit = l.depositMonths >= 8
  const parks = [...l.techParks].sort((a, b) => a.km - b.km)

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {back}

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-1.5 text-slate-400"><MapPin size={16} /> {l.locality}, Bengaluru · {l.code}</p>
          <h1 className="mt-1 text-3xl font-extrabold text-white sm:text-4xl">
            {l.bhk}BHK {l.furnishing.toLowerCase()} flat
          </h1>
        </div>
        <div className="sm:text-right">
          <p className="text-3xl font-extrabold text-white">{rupees(l.rent)}<span className="text-base font-medium text-slate-400"> /month</span></p>
          {l.maintenance > 0 && <p className="text-sm text-slate-400">+ {rupees(l.maintenance)} maintenance</p>}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="glass rounded-2xl p-5">
            <p className="leading-relaxed text-slate-300">{l.description}</p>
            <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Fact label="Area" value={`${l.sqft} sqft`} />
              <Fact label="Floor" value={floorLabel(l.floor, l.totalFloors)} />
              <Fact label="Building" value={l.buildingType} />
              <Fact label="Tenant" value={l.tenantPreference === 'Any' ? 'Anyone' : l.tenantPreference} />
              <Fact label="Pets" value={l.petsAllowed ? 'Allowed' : 'Not allowed'} />
              <Fact label="Parking" value={l.parking} />
              <Fact label="Water" value={l.waterSource} />
              <Fact label="Noise" value={l.noise[0].toUpperCase() + l.noise.slice(1)} />
              <Fact label="Available from" value={formatDate(l.availableFrom)} />
            </dl>
          </section>

          {l.amenities.length > 0 && (
            <section className="glass rounded-2xl p-5">
              <h2 className="font-bold text-white">Amenities</h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {l.amenities.map((a) => (
                  <li key={a} className="flex items-center gap-1.5 rounded-full bg-white/[.06] px-3 py-1 text-sm text-slate-200">
                    <Check size={14} className="text-mint" /> {a}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="glass overflow-hidden rounded-2xl">
            <iframe
              title={`Map of ${l.locality}`}
              src={mapUrl(l.location.coordinates)}
              className="h-72 w-full border-0"
              loading="lazy"
            />
            <p className="px-5 py-2 text-xs text-slate-500">Approximate location · Map © OpenStreetMap contributors</p>
          </section>
        </div>

        <aside className="space-y-6">
          <EnquiryForm listingCode={l.code} />

          <section className={`glass rounded-2xl p-5 ${highDeposit ? 'border-amber/40' : ''}`}>
            <h2 className="font-bold text-white">Deposit</h2>
            <p className="mt-2 text-2xl font-extrabold text-white">{rupees(l.deposit)}</p>
            <p className="text-sm text-slate-400">{l.depositMonths} months of rent</p>
            {highDeposit && (
              <p className="mt-3 flex gap-2 rounded-lg bg-amber/10 p-3 text-sm text-amber">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                Higher than usual. Many Bengaluru owners accept 2–6 months; worth negotiating.
              </p>
            )}
            <Link
              to={`/rent-check?${new URLSearchParams({ code: l.code, locality: l.locality, bhk: l.bhk, rent: l.rent, depositMonths: l.depositMonths, furnishing: l.furnishing })}`}
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-violet-soft hover:underline"
            >
              <BadgeIndianRupee size={15} /> Is this rent fair?
            </Link>
          </section>

          <section className="glass rounded-2xl p-5">
            <h2 className="flex items-center gap-2 font-bold text-white"><TrainFront size={18} className="text-violet-soft" /> Nearest metro</h2>
            <p className="mt-2 text-white">{l.nearestMetro.name}</p>
            <p className="text-sm text-slate-400">{l.nearestMetro.lines.join(' / ')} line · {l.nearestMetro.km} km</p>
          </section>

          <section className="glass rounded-2xl p-5">
            <h2 className="flex items-center gap-2 font-bold text-white"><Briefcase size={18} className="text-violet-soft" /> Distance to tech parks</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {parks.map((t) => (
                <li key={t.name} className="flex justify-between gap-3">
                  <span className="text-slate-300">{t.name}</span>
                  <span className={`font-semibold ${t.km <= 5 ? 'text-mint' : 'text-white'}`}>{t.km} km</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-slate-500">Straight-line distance, approximate. Road distance is usually longer.</p>
          </section>
        </aside>
      </div>
    </main>
  )
}
