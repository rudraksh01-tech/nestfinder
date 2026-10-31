import { Link, useSearchParams } from 'react-router-dom'
import { CalendarCheck, Home, Inbox, Pencil, Phone, Plus, Trash2, Users } from 'lucide-react'
import PushCard from '../components/PushCard.jsx'
import TelegramCard from '../components/TelegramCard.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { sendJson } from '../lib/api.js'
import { formatDate, rupees } from '../lib/format.js'
import { useFetch } from '../lib/useFetch.js'
import { primaryButton } from '../lib/ui.js'

const STATUS_LABELS = { new: 'New', contacted: 'Contacted', visit_scheduled: 'Visit booked', closed: 'Closed' }
const STATUS_COLORS = {
  new: 'bg-violet/20 text-violet-soft',
  contacted: 'bg-sky-500/15 text-sky-300',
  visit_scheduled: 'bg-mint/15 text-mint',
  closed: 'bg-white/10 text-slate-400',
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="glass rounded-2xl p-4">
      <p className="flex items-center gap-2 text-sm text-slate-400"><Icon size={16} /> {label}</p>
      <p className="mt-1 text-3xl font-extrabold text-white">{value ?? '–'}</p>
    </div>
  )
}

function timeAgo(date) {
  const mins = Math.round((Date.now() - new Date(date)) / 60000)
  if (mins < 60) return `${Math.max(mins, 1)} min ago`
  if (mins < 24 * 60) return `${Math.round(mins / 60)} h ago`
  return formatDate(date)
}

function Leads({ status, onChanged }) {
  const { data, error, loading, mutate } = useFetch(`/api/broker/leads${status ? `?status=${status}` : ''}`)

  async function changeStatus(lead, next) {
    try {
      const { lead: updated } = await sendJson(`/api/broker/leads/${lead._id}`, { method: 'PATCH', body: { status: next } })
      // When filtered by status, a lead that moves to another status leaves the list.
      mutate((d) => ({
        leads: d.leads.map((l) => (l._id === updated._id ? updated : l)).filter((l) => !status || l.status === status),
      }))
      onChanged()
    } catch (err) {
      alert(err.message)
    }
  }

  if (error) return <p className="glass rounded-2xl p-6 text-amber">{error}</p>
  if (!data) return <div className="glass h-64 animate-pulse rounded-2xl" />
  if (data.leads.length === 0) return <p className="glass rounded-2xl p-10 text-center text-slate-400">No leads here yet.</p>

  return (
    <ul className={`space-y-3 transition-opacity ${loading ? 'opacity-50' : ''}`}>
      {data.leads.map((lead) => (
        <li key={lead._id} className="glass grid gap-3 rounded-2xl p-4 sm:grid-cols-[1fr_auto] sm:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <p className="font-bold text-white">{lead.name}</p>
              <a href={`tel:+91${lead.phone}`} className="flex items-center gap-1 text-sm text-violet-soft hover:underline">
                <Phone size={13} /> {lead.phone.replace(/(\d{5})(\d{5})/, '$1 $2')}
              </a>
              <span className="text-xs text-slate-500">{timeAgo(lead.createdAt)}</span>
            </div>
            <p className="mt-1 text-sm text-slate-400">
              {lead.listing ? (
                <Link to={`/flats/${lead.listing.code}`} className="hover:text-white">
                  {lead.listing.code} · {lead.listing.bhk}BHK {lead.listing.locality} · {rupees(lead.listing.rent)}
                </Link>
              ) : 'Listing removed'}
            </p>
            {lead.message && <p className="mt-2 text-sm text-slate-200">“{lead.message}”</p>}
            {lead.visitDate && (
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-mint/10 px-2.5 py-1 text-xs font-semibold text-mint">
                <CalendarCheck size={13} /> Visit on {formatDate(lead.visitDate)}
              </p>
            )}
          </div>
          <label className="flex items-center gap-2 text-xs text-slate-400 sm:flex-col sm:items-end">
            <span className={`rounded-full px-2.5 py-1 font-semibold ${STATUS_COLORS[lead.status]}`}>{STATUS_LABELS[lead.status]}</span>
            <select
              aria-label={`Status for ${lead.name}`}
              value={lead.status}
              onChange={(e) => changeStatus(lead, e.target.value)}
              className="rounded-lg border border-white/10 bg-ink-2 px-2 py-1.5 text-sm text-white outline-none focus:border-violet-soft"
            >
              {Object.entries(STATUS_LABELS).map(([v, text]) => <option key={v} value={v}>{text}</option>)}
            </select>
          </label>
        </li>
      ))}
    </ul>
  )
}

function MyListings({ onChanged }) {
  const { data, error, mutate } = useFetch('/api/broker/listings')

  async function remove(listing) {
    if (!confirm(`Delete ${listing.code} (${listing.bhk}BHK in ${listing.locality})? Its leads will be deleted too.`)) return
    try {
      await sendJson(`/api/broker/listings/${listing.code}`, { method: 'DELETE' })
      mutate((d) => ({ listings: d.listings.filter((l) => l.code !== listing.code) }))
      onChanged()
    } catch (err) {
      alert(err.message)
    }
  }

  if (error) return <p className="glass rounded-2xl p-6 text-amber">{error}</p>
  if (!data) return <div className="glass h-64 animate-pulse rounded-2xl" />

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <Link to="/broker/listings/new" className={primaryButton}><Plus size={16} /> Add listing</Link>
      </div>
      {data.listings.length === 0 ? (
        <p className="glass rounded-2xl p-10 text-center text-slate-400">You have no listings yet.</p>
      ) : (
        <ul className="glass divide-y divide-white/10 rounded-2xl">
          {data.listings.map((l) => (
            <li key={l.code} className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4">
              <Link to={`/flats/${l.code}`} className="min-w-0 flex-1 hover:text-violet-soft">
                <p className="font-semibold text-white">{l.bhk}BHK · {l.locality}</p>
                <p className="text-sm text-slate-400">{l.code} · {l.furnishing} · available {formatDate(l.availableFrom)}</p>
              </Link>
              <p className="font-bold text-white">{rupees(l.rent)}</p>
              <div className="flex gap-1">
                <Link to={`/broker/listings/${l.code}/edit`} className="rounded-lg p-2 text-slate-300 hover:bg-white/10 hover:text-white" aria-label={`Edit ${l.code}`}>
                  <Pencil size={16} />
                </Link>
                <button type="button" onClick={() => remove(l)} className="rounded-lg p-2 text-slate-300 hover:bg-amber/15 hover:text-amber" aria-label={`Delete ${l.code}`}>
                  <Trash2 size={16} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function Dashboard() {
  const { broker } = useAuth()
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') === 'listings' ? 'listings' : 'leads'
  const status = params.get('status') ?? ''
  const { data: stats, reload: reloadStats } = useFetch('/api/broker/stats')
  const totalLeads = stats ? Object.values(stats.leads).reduce((a, b) => a + b, 0) : undefined

  const tabClass = (active) =>
    `rounded-lg px-4 py-2 text-sm font-semibold transition ${active ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-extrabold text-white">Hi, {broker.name.split(' ')[0]}</h1>
      <p className="mt-1 text-sm text-slate-400">{broker.agency || 'Broker dashboard'}</p>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={Home} label="Listings" value={stats?.listings} />
        <Stat icon={Users} label="Total leads" value={totalLeads} />
        <Stat icon={Inbox} label="New leads" value={stats?.leads.new} />
        <Stat icon={CalendarCheck} label="Upcoming visits" value={stats?.upcomingVisits} />
      </div>

      <PushCard />
      <TelegramCard />

      <div className="mt-8 flex flex-wrap items-center gap-2 border-b border-white/10 pb-3">
        <button type="button" className={tabClass(tab === 'leads')} onClick={() => setParams({})}>Leads</button>
        <button type="button" className={tabClass(tab === 'listings')} onClick={() => setParams({ tab: 'listings' })}>My listings</button>
        {tab === 'leads' && (
          <select
            aria-label="Filter leads by status"
            value={status}
            onChange={(e) => setParams(e.target.value ? { status: e.target.value } : {})}
            className="ml-auto rounded-lg border border-white/10 bg-ink-2 px-3 py-1.5 text-sm text-white outline-none focus:border-violet-soft"
          >
            <option value="">All statuses</option>
            {Object.entries(STATUS_LABELS).map(([v, text]) => (
              <option key={v} value={v}>{text}{stats ? ` (${stats.leads[v]})` : ''}</option>
            ))}
          </select>
        )}
      </div>

      <div className="mt-4">
        {tab === 'leads' ? <Leads status={status} onChanged={reloadStats} /> : <MyListings onChanged={reloadStats} />}
      </div>
    </main>
  )
}
