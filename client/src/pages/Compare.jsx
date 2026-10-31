import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Crown, Heart, Sparkles, X } from 'lucide-react'
import { loadPrefs, useShortlist } from '../context/ShortlistContext.jsx'
import { sendJson } from '../lib/api.js'
import { formatDate, rupees } from '../lib/format.js'
import { useFetch } from '../lib/useFetch.js'
import { primaryButton } from '../lib/ui.js'

const NOISE_RANK = { low: 0, medium: 1, high: 2 }
const cap = (s) => s[0].toUpperCase() + s.slice(1)

// Each row: how to show a flat's value, and (optionally) which value is best so it can be highlighted.
function buildRows(prefs) {
  const rows = [
    { label: 'Match for you', show: (l) => (l.match ? `${l.match.score}%` : '–'), num: (l) => l.match?.score, best: 'max', when: (items) => items.some((l) => l.match) },
    { label: 'Rent', show: (l) => rupees(l.rent), num: (l) => l.rent, best: 'min' },
    { label: 'Maintenance', show: (l) => (l.maintenance ? rupees(l.maintenance) : 'None'), num: (l) => l.maintenance ?? 0, best: 'min' },
    { label: 'Monthly total', show: (l) => rupees(l.rent + (l.maintenance ?? 0)), num: (l) => l.rent + (l.maintenance ?? 0), best: 'min', strong: true },
    { label: 'Deposit', show: (l) => `${rupees(l.deposit)} (${l.depositMonths} mo)`, num: (l) => l.deposit, best: 'min', warn: (l) => l.depositMonths >= 8 },
    { label: 'Size', show: (l) => `${l.bhk}BHK · ${l.sqft} sqft`, num: (l) => l.sqft, best: 'max' },
    { label: 'Rent per sqft', show: (l) => `₹${(l.rent / l.sqft).toFixed(1)}`, num: (l) => l.rent / l.sqft, best: 'min' },
    { label: 'Nearest metro', show: (l) => `${l.nearestMetro.km} km · ${l.nearestMetro.name}`, num: (l) => l.nearestMetro.km, best: 'min' },
  ]
  if (prefs.get('techPark')) {
    const park = prefs.get('techPark')
    rows.push({ label: `To ${park}`, show: (l) => `${l.techParks.find((t) => t.name === park)?.km} km`, num: (l) => l.techParks.find((t) => t.name === park)?.km, best: 'min' })
  }
  rows.push(
    { label: 'Furnishing', show: (l) => l.furnishing },
    { label: 'Building', show: (l) => `${l.buildingType} · floor ${l.floor === 0 ? 'G' : l.floor}/${l.totalFloors}` },
    { label: 'Tenant', show: (l) => (l.tenantPreference === 'Any' ? 'Anyone' : `${l.tenantPreference} only`) },
    { label: 'Pets', show: (l) => (l.petsAllowed ? 'Allowed' : 'Not allowed'), num: (l) => (l.petsAllowed ? 1 : 0), best: 'max' },
    { label: 'Parking', show: (l) => l.parking },
    { label: 'Noise', show: (l) => cap(l.noise), num: (l) => NOISE_RANK[l.noise], best: 'min' },
    { label: 'Water', show: (l) => l.waterSource },
    { label: 'Amenities', show: (l) => (l.amenities.length ? l.amenities.join(', ') : 'None'), num: (l) => l.amenities.length, best: 'max' },
    { label: 'Available from', show: (l) => formatDate(l.availableFrom), num: (l) => new Date(l.availableFrom).getTime(), best: 'min' },
  )
  return rows
}

// Highlight the best value only when flats actually differ on it.
function bestValue(row, items) {
  if (!row.best) return null
  const values = items.map(row.num).filter((v) => v !== undefined && v !== null)
  if (values.length < 2 || new Set(values).size === 1) return null
  return row.best === 'min' ? Math.min(...values) : Math.max(...values)
}

export default function Compare() {
  const { codes, remove } = useShortlist()
  const [prefsQuery] = useState(loadPrefs)
  const prefs = new URLSearchParams(prefsQuery)
  const { data, error, loading } = useFetch(codes.length ? `/api/compare?codes=${codes.join(',')}${prefsQuery ? `&${prefsQuery}` : ''}` : null)
  const [decision, setDecision] = useState({ busy: false, error: null, result: null, forCodes: '' })

  // Only show the items still in the shortlist (removing one should not wait for a refetch).
  const items = (data?.items ?? []).filter((l) => codes.includes(l.code))
  const rows = buildRows(prefs)
  const codesKey = codes.join(',')
  const result = decision.forCodes === codesKey ? decision.result : null

  async function decide() {
    setDecision({ busy: true, error: null, result: null, forCodes: codesKey })
    try {
      const res = await sendJson('/api/compare/decide', { body: { codes, prefs: Object.fromEntries(prefs) } })
      setDecision({ busy: false, error: null, result: res.decision, forCodes: codesKey })
    } catch (err) {
      setDecision({ busy: false, error: err.message, result: null, forCodes: codesKey })
    }
  }

  if (codes.length < 2) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <Heart className="mx-auto text-rose-600" size={36} />
        <h1 className="mt-4 page-title text-4xl sm:text-5xl">Shortlist at least two flats</h1>
        <p className="mt-2 text-muted">Tap the heart on any flat to add it. You have {codes.length} so far (up to 4).</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/match" className={primaryButton}>Find my match</Link>
          <Link to="/flats" className="inline-flex items-center rounded-xl border border-ink/15 px-4 py-2.5 text-sm font-semibold text-ink hover:border-ink/30">Browse flats</Link>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <p className="eyebrow">Compare & decide</p>
      <h1 className="mt-4 page-title text-4xl sm:text-5xl">Your shortlist, side by side</h1>
      <p className="mt-1 text-sm text-muted">
        Best value in each row is highlighted.{' '}
        {prefsQuery ? <>Match scores use your <Link to={`/match?${prefsQuery}`} className="text-signal hover:underline">preferences from Match</Link>.</> : <>Set your <Link to="/match" className="text-signal hover:underline">preferences</Link> to see match scores.</>}
      </p>

      <section className="glass mt-6 rounded-2xl p-5">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="mr-auto flex items-center gap-2 font-bold text-ink"><Sparkles size={18} className="text-signal" /> Help me decide</h2>
          <button type="button" onClick={decide} disabled={decision.busy || items.length < 2} className={primaryButton}>
            {decision.busy ? 'Thinking…' : result ? 'Ask again' : 'Pick the best one for me'}
          </button>
        </div>
        {decision.error && <p className="mt-3 text-sm text-warn" role="alert">{decision.error}</p>}
        {result && (
          <div className="mt-4 grid gap-4 md:grid-cols-[1fr_280px]">
            <div>
              <p className="flex items-center gap-2 text-lg font-bold text-ink">
                <Crown size={20} className="text-warn" /> Go with <Link to={`/flats/${result.pick}`} className="text-good hover:underline">{result.pick}</Link>
              </p>
              <p className="mt-1 text-ink-2">{result.headline}</p>
              <ul className="mt-3 space-y-1.5 text-sm text-ink">
                {result.reasons.map((r) => <li key={r} className="flex gap-2"><span className="font-bold text-good">✓</span>{r}</li>)}
              </ul>
            </div>
            <div className="space-y-3 text-sm">
              <p className="rounded-xl bg-ink/[.03] p-3 text-ink-2"><span className="font-semibold text-ink">Runner-up {result.runnerUp}:</span> {result.runnerUpWhen}</p>
              <p className="flex gap-2 rounded-xl bg-warn/10 p-3 text-warn"><AlertTriangle size={16} className="mt-0.5 shrink-0" /> {result.watchOut}</p>
            </div>
          </div>
        )}
        {!result && !decision.error && <p className="mt-2 text-sm text-muted">The assistant weighs your preferences and the facts below, and explains its pick.</p>}
      </section>

      {error && <p className="glass mt-6 rounded-2xl p-6 text-warn">{error}</p>}
      {!data && !error && <div className="glass mt-6 h-96 animate-pulse rounded-2xl" />}

      {items.length > 0 && (
        <div className={`glass mt-6 overflow-x-auto rounded-2xl transition-opacity ${loading ? 'opacity-60' : ''}`}>
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-ink/10">
                <th scope="col" className="w-40 p-4 text-left font-semibold text-muted">Flat</th>
                {items.map((l) => (
                  <th key={l.code} scope="col" className={`p-4 text-left align-top ${result?.pick === l.code ? 'bg-good/10' : ''}`}>
                    <div className="flex items-start justify-between gap-2">
                      <Link to={`/flats/${l.code}`} className="hover:text-signal">
                        <span className="flex items-center gap-1.5 font-bold text-ink">
                          {result?.pick === l.code && <Crown size={14} className="text-warn" />}{l.code}
                        </span>
                        <span className="block font-normal text-muted">{l.bhk}BHK · {l.locality}</span>
                      </Link>
                      <button type="button" onClick={() => remove(l.code)} className="rounded p-1 text-faint hover:bg-ink/[.06] hover:text-ink" aria-label={`Remove ${l.code} from shortlist`}>
                        <X size={14} />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows
                .filter((row) => !row.when || row.when(items))
                .map((row) => {
                  const best = bestValue(row, items)
                  return (
                    <tr key={row.label} className="border-b border-ink/5 last:border-0">
                      <th scope="row" className="p-4 text-left font-medium text-muted">{row.label}</th>
                      {items.map((l) => {
                        const isBest = best !== null && row.num(l) === best
                        return (
                          <td
                            key={l.code}
                            className={`p-4 align-top ${isBest ? 'font-semibold text-good' : row.warn?.(l) ? 'text-warn' : row.strong ? 'font-semibold text-ink' : 'text-ink'} ${result?.pick === l.code ? 'bg-good/5' : ''}`}
                          >
                            {row.show(l)}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      )}
      {data?.missing?.length > 0 && (
        <p className="mt-3 text-sm text-muted">No longer listed: {data.missing.join(', ')}.</p>
      )}
    </main>
  )
}
