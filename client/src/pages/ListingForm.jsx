import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { sendJson } from '../lib/api.js'
import { useFetch } from '../lib/useFetch.js'
import { fieldClass, labelClass, primaryButton, ghostButton } from '../lib/ui.js'

// Options mirror the enums in server/src/models/Listing.js.
const FURNISHING = ['Unfurnished', 'Semi-furnished', 'Fully furnished']
const BUILDING = ['Gated society', 'Standalone building', 'Independent house']
const TENANT = ['Any', 'Family', 'Bachelors']
const PARKING = ['Car', 'Bike only', 'None']
const NOISE = ['low', 'medium', 'high']
const WATER = ['Cauvery (BWSSB)', 'Borewell', 'Cauvery + borewell', 'Tanker supply']
const AMENITIES = ['Gym', 'Swimming pool', 'Power backup', 'Lift', '24x7 security', 'Clubhouse', "Children's play area", 'CCTV']

const EMPTY = {
  locality: '', bhk: 2, sqft: '', rent: '', depositMonths: 3, maintenance: 0,
  furnishing: 'Semi-furnished', buildingType: 'Gated society', floor: 0, totalFloors: '',
  tenantPreference: 'Any', petsAllowed: false, parking: 'Car', amenities: [],
  waterSource: WATER[0], noise: 'medium', availableFrom: '', description: '',
}
const NUMBER_FIELDS = ['bhk', 'sqft', 'rent', 'depositMonths', 'maintenance', 'floor', 'totalFloors']

function toForm(listing) {
  const form = { ...EMPTY }
  for (const key of Object.keys(EMPTY)) if (listing[key] !== undefined) form[key] = listing[key]
  form.availableFrom = listing.availableFrom?.slice(0, 10) ?? ''
  return form
}

function Field({ id, label, children }) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>{label}</label>
      {children}
    </div>
  )
}

function Form({ initial, code }) {
  const navigate = useNavigate()
  const { data: meta } = useFetch('/api/listings/meta')
  const [form, setForm] = useState(initial)
  const [status, setStatus] = useState({ saving: false, error: null })

  const set = (key) => (e) => {
    const { type, value, checked } = e.target
    setForm((f) => ({ ...f, [key]: type === 'checkbox' ? checked : value }))
  }
  const toggleAmenity = (a) =>
    setForm((f) => ({ ...f, amenities: f.amenities.includes(a) ? f.amenities.filter((x) => x !== a) : [...f.amenities, a] }))

  async function submit(e) {
    e.preventDefault()
    if (Number(form.floor) > Number(form.totalFloors)) {
      setStatus({ saving: false, error: 'Floor cannot be higher than total floors' })
      return
    }
    setStatus({ saving: true, error: null })
    const body = { ...form }
    for (const key of NUMBER_FIELDS) body[key] = Number(body[key])
    try {
      await sendJson(code ? `/api/broker/listings/${code}` : '/api/broker/listings', { method: code ? 'PATCH' : 'POST', body })
      navigate('/broker?tab=listings')
    } catch (err) {
      setStatus({ saving: false, error: err.message })
    }
  }

  const select = (key, options, labels) => (
    <select id={key} className={fieldClass} value={form[key]} onChange={set(key)}>
      {options.map((o) => <option key={o} value={o}>{labels?.[o] ?? o}</option>)}
    </select>
  )
  const number = (key, props) => (
    <input id={key} type="number" required className={fieldClass} value={form[key]} onChange={set(key)} {...props} />
  )

  return (
    <form onSubmit={submit} className="mt-6 space-y-6">
      <section className="glass grid gap-4 rounded-2xl p-5 sm:grid-cols-2 lg:grid-cols-3">
        <h2 className="font-bold text-ink sm:col-span-2 lg:col-span-3">Basics</h2>
        <Field id="locality" label="Area">
          <select id="locality" required className={fieldClass} value={form.locality} onChange={set('locality')}>
            <option value="" disabled>Pick an area</option>
            {meta?.localities.map((l) => <option key={l}>{l}</option>)}
          </select>
        </Field>
        <Field id="bhk" label="BHK">{select('bhk', [1, 2, 3, 4, 5])}</Field>
        <Field id="sqft" label="Size (sqft)">{number('sqft', { min: 150, max: 10000 })}</Field>
        <Field id="furnishing" label="Furnishing">{select('furnishing', FURNISHING)}</Field>
        <Field id="buildingType" label="Building">{select('buildingType', BUILDING)}</Field>
        <div className="grid grid-cols-2 gap-3">
          <Field id="floor" label="Floor (0 = ground)">{number('floor', { min: 0, max: 100 })}</Field>
          <Field id="totalFloors" label="Total floors">{number('totalFloors', { min: 1, max: 100 })}</Field>
        </div>
      </section>

      <section className="glass grid gap-4 rounded-2xl p-5 sm:grid-cols-2 lg:grid-cols-4">
        <h2 className="font-bold text-ink sm:col-span-2 lg:col-span-4">Money</h2>
        <Field id="rent" label="Rent / month (₹)">{number('rent', { min: 1000, max: 1000000, step: 500 })}</Field>
        <Field id="depositMonths" label="Deposit (months)">{number('depositMonths', { min: 0, max: 12 })}</Field>
        <Field id="maintenance" label="Maintenance (₹)">{number('maintenance', { min: 0, max: 100000 })}</Field>
        <div className="self-end pb-2 text-sm text-muted">
          Deposit: <span className="font-semibold text-ink">₹{(Number(form.rent) * Number(form.depositMonths) || 0).toLocaleString('en-IN')}</span>
        </div>
      </section>

      <section className="glass grid gap-4 rounded-2xl p-5 sm:grid-cols-2 lg:grid-cols-3">
        <h2 className="font-bold text-ink sm:col-span-2 lg:col-span-3">Tenant and building</h2>
        <Field id="tenantPreference" label="Tenant">{select('tenantPreference', TENANT, { Any: 'Anyone' })}</Field>
        <Field id="parking" label="Parking">{select('parking', PARKING)}</Field>
        <Field id="waterSource" label="Water">{select('waterSource', WATER)}</Field>
        <Field id="noise" label="Noise">{select('noise', NOISE, { low: 'Low', medium: 'Medium', high: 'High' })}</Field>
        <Field id="availableFrom" label="Available from">
          <input id="availableFrom" type="date" required className={fieldClass} value={form.availableFrom} onChange={set('availableFrom')} />
        </Field>
        <label className="flex cursor-pointer items-center gap-2 self-end pb-2 text-sm text-ink-2">
          <input type="checkbox" className="size-4 accent-signal" checked={form.petsAllowed} onChange={set('petsAllowed')} />
          Pets allowed
        </label>
        <fieldset className="sm:col-span-2 lg:col-span-3">
          <legend className={labelClass}>Amenities</legend>
          <div className="flex flex-wrap gap-2">
            {AMENITIES.map((a) => (
              <button
                key={a}
                type="button"
                aria-pressed={form.amenities.includes(a)}
                onClick={() => toggleAmenity(a)}
                className={`rounded-full border px-3 py-1.5 text-sm transition ${
                  form.amenities.includes(a) ? 'border-signal bg-signal/20 text-ink' : 'border-ink/10 text-ink-2 hover:border-ink/25'
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </fieldset>
        <div className="sm:col-span-2 lg:col-span-3">
          <Field id="description" label="Description">
            <textarea id="description" rows={4} maxLength={1500} className={fieldClass} value={form.description} onChange={set('description')} placeholder="What makes this flat good? Nearby offices, shops, light, ventilation…" />
          </Field>
        </div>
      </section>

      <p className="text-xs text-faint">The flat is pinned to the centre of the chosen area; nearest metro and tech-park distances are calculated automatically.</p>
      {status.error && <p className="text-sm text-warn" role="alert">{status.error}</p>}
      <div className="flex gap-3">
        <button type="submit" disabled={status.saving} className={primaryButton}>
          <Save size={16} /> {status.saving ? 'Saving…' : code ? 'Save changes' : 'Publish listing'}
        </button>
        <Link to="/broker?tab=listings" className={ghostButton}>Cancel</Link>
      </div>
    </form>
  )
}

export default function ListingForm() {
  const { code } = useParams()
  const { data: listing, error } = useFetch(code ? `/api/listings/${encodeURIComponent(code)}` : null)

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Link to="/broker?tab=listings" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft size={16} /> My listings
      </Link>
      <h1 className="mt-4 page-title text-4xl sm:text-5xl">{code ? `Edit ${code}` : 'Add a listing'}</h1>
      {error && <p className="glass mt-6 rounded-2xl p-6 text-warn">{error}</p>}
      {code && !listing && !error && <div className="glass mt-6 h-96 animate-pulse rounded-2xl" />}
      {/* key remounts the form once the listing arrives, so its fields start from the saved values. */}
      {(!code || listing) && <Form key={listing?.code ?? 'new'} initial={listing ? toForm(listing) : EMPTY} code={code} />}
    </main>
  )
}
