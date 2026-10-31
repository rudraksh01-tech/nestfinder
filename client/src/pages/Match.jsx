import { useSearchParams } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import ChatPanel from '../components/ChatPanel.jsx'
import ListingCard from '../components/ListingCard.jsx'
import { useFetch } from '../lib/useFetch.js'
import { fieldClass, labelClass } from '../lib/ui.js'

const BUDGETS = [12000, 15000, 18000, 20000, 25000, 30000, 35000, 40000, 50000, 60000, 80000]
const TOGGLES = [
  ['pets', 'I have a pet'],
  ['metro', 'Metro nearby matters'],
  ['quiet', 'I want a quiet place'],
  ['gym', 'I want a gym'],
  ['car', 'I need car parking'],
]
const PREF_KEYS = ['budget', 'bhk', 'techPark', 'tenant', 'furnishing', ...TOGGLES.map(([k]) => k)]

function Select({ id, title, value, onChange, children }) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>{title}</label>
      <select id={id} className={fieldClass} value={value} onChange={(e) => onChange(e.target.value)}>{children}</select>
    </div>
  )
}

// Preferences live in the URL (e.g. /match?budget=25000&pets=true), so the AI chat can link straight here.
export default function Match() {
  const [params, setParams] = useSearchParams()
  const { data: meta } = useFetch('/api/listings/meta')
  const prefs = new URLSearchParams([...params].filter(([k]) => PREF_KEYS.includes(k)))
  const hasPrefs = [...prefs.keys()].length > 0
  const { data, error, loading } = useFetch(hasPrefs ? `/api/match?${prefs}` : null)

  // The AI chat returns a full set of preferences; replace the form with them.
  const applyPrefs = (next) => {
    const out = new URLSearchParams()
    for (const [k, v] of Object.entries(next)) if (PREF_KEYS.includes(k) && v !== undefined && v !== null) out.set(k, String(v))
    setParams(out, { replace: true })
  }

  const get = (k) => params.get(k) ?? ''
  const set = (k, v) => {
    const next = new URLSearchParams(params)
    if (v) next.set(k, v)
    else next.delete(k)
    setParams(next, { replace: true })
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <p className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-sm text-violet-soft">
        <Sparkles size={16} /> AI Match Score
      </p>
      <h1 className="mt-4 text-3xl font-extrabold text-white">Find flats that fit how you live</h1>
      <p className="mt-1 text-sm text-slate-400">Chat with the assistant or use the filters. Every flat gets a % match with the reasons behind it.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[300px_1fr]">
        <aside className="glass h-fit space-y-4 rounded-2xl p-5">
          <Select id="techPark" title="Where do you work?" value={get('techPark')} onChange={(v) => set('techPark', v)}>
            <option value="">Work from home / other</option>
            {meta?.techParks.map((t) => <option key={t}>{t}</option>)}
          </Select>
          <Select id="budget" title="Monthly budget (incl. maintenance)" value={get('budget')} onChange={(v) => set('budget', v)}>
            <option value="">Not sure</option>
            {BUDGETS.map((b) => <option key={b} value={b}>₹{b.toLocaleString('en-IN')}</option>)}
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Select id="bhk" title="BHK" value={get('bhk')} onChange={(v) => set('bhk', v)}>
              <option value="">Any</option>
              {[1, 2, 3].map((b) => <option key={b} value={b}>{b} BHK</option>)}
            </Select>
            <Select id="tenant" title="I am" value={get('tenant')} onChange={(v) => set('tenant', v)}>
              <option value="">Skip</option>
              <option value="Bachelors">Bachelor</option>
              <option value="Family">Family</option>
            </Select>
          </div>
          <Select id="furnishing" title="Furnishing" value={get('furnishing')} onChange={(v) => set('furnishing', v)}>
            <option value="">No preference</option>
            <option>Unfurnished</option>
            <option>Semi-furnished</option>
            <option>Fully furnished</option>
          </Select>
          <fieldset className="space-y-2">
            <legend className={labelClass}>What else matters?</legend>
            {TOGGLES.map(([k, text]) => (
              <label key={k} className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
                <input type="checkbox" className="size-4 accent-violet" checked={get(k) === 'true'} onChange={(e) => set(k, e.target.checked ? 'true' : '')} />
                {text}
              </label>
            ))}
          </fieldset>
          {hasPrefs && (
            <button type="button" onClick={() => setParams({}, { replace: true })} className="text-xs text-slate-400 hover:text-white">Clear all</button>
          )}
        </aside>

        <section aria-live="polite">
          <ChatPanel prefs={Object.fromEntries(prefs)} onPrefs={applyPrefs} />
          {!hasPrefs && (
            <div className="glass rounded-2xl p-10 text-center">
              <Sparkles className="mx-auto text-violet-soft" size={32} />
              <p className="mt-3 font-semibold text-white">Tell the assistant about yourself, or pick a few filters</p>
              <p className="mt-1 text-sm text-slate-400">Where you work and your budget are the best place to start.</p>
            </div>
          )}
          {error && <p className="glass rounded-2xl p-6 text-amber">{error}</p>}
          {hasPrefs && data && (
            <>
              <p className="mb-4 text-sm text-slate-300">Top {data.items.length} of {data.total} flats, best match first</p>
              <div className={`grid gap-4 sm:grid-cols-2 xl:grid-cols-3 transition-opacity ${loading ? 'opacity-50' : ''}`}>
                {data.items.map((l) => <ListingCard key={l.code} listing={l} match={l.match} />)}
              </div>
            </>
          )}
          {hasPrefs && !data && !error && (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }, (_, i) => <div key={i} className="glass h-72 animate-pulse rounded-2xl" />)}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
