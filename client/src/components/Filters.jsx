import { RotateCcw } from 'lucide-react'
import { fieldClass as field, labelClass as label } from '../lib/ui.js'

const BUDGETS = [15000, 20000, 25000, 30000, 40000, 50000, 70000]
const METRO_KM = [0.5, 1, 1.5, 2, 3, 5]
const PARK_KM = [3, 5, 8, 10, 15]

function Select({ id, title, value, onChange, children }) {
  return (
    <div>
      <label htmlFor={id} className={label}>{title}</label>
      <select id={id} className={field} value={value} onChange={(e) => onChange(e.target.value)}>
        {children}
      </select>
    </div>
  )
}

// All filter values live in the URL, so `params` is a URLSearchParams and `set(key, value)` updates it.
export default function Filters({ meta, params, set, onReset }) {
  const get = (key) => params.get(key) ?? ''
  const bhks = get('bhk').split(',').filter(Boolean)
  const toggleBhk = (b) => set('bhk', bhks.includes(b) ? bhks.filter((x) => x !== b).join(',') : [...bhks, b].sort().join(','))

  return (
    <aside className="glass rounded-2xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-bold text-white">Filters</h2>
        <button type="button" onClick={onReset} className="flex items-center gap-1 text-xs text-slate-400 hover:text-white">
          <RotateCcw size={12} /> Reset
        </button>
      </div>

      <div className="space-y-4">
        <Select id="locality" title="Area" value={get('locality')} onChange={(v) => set('locality', v)}>
          <option value="">All areas</option>
          {meta?.localities.map((l) => <option key={l}>{l}</option>)}
        </Select>

        <div>
          <span className={label}>BHK</span>
          <div className="flex gap-2">
            {['1', '2', '3'].map((b) => (
              <button
                key={b}
                type="button"
                aria-pressed={bhks.includes(b)}
                onClick={() => toggleBhk(b)}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                  bhks.includes(b) ? 'border-violet bg-violet text-white' : 'border-white/10 text-slate-300 hover:border-white/30'
                }`}
              >
                {b} BHK
              </button>
            ))}
          </div>
        </div>

        <Select id="maxRent" title="Max rent" value={get('maxRent')} onChange={(v) => set('maxRent', v)}>
          <option value="">Any budget</option>
          {BUDGETS.map((b) => <option key={b} value={b}>Up to ₹{b / 1000}k</option>)}
        </Select>

        <Select id="tenant" title="I am" value={get('tenant')} onChange={(v) => set('tenant', v)}>
          <option value="">Anyone</option>
          <option value="Bachelors">Bachelor / working professional</option>
          <option value="Family">Family</option>
        </Select>

        <Select id="furnishing" title="Furnishing" value={get('furnishing')} onChange={(v) => set('furnishing', v)}>
          <option value="">Any</option>
          <option>Unfurnished</option>
          <option>Semi-furnished</option>
          <option>Fully furnished</option>
        </Select>

        <Select id="maxMetroKm" title="Metro within" value={get('maxMetroKm')} onChange={(v) => set('maxMetroKm', v)}>
          <option value="">Any distance</option>
          {METRO_KM.map((k) => <option key={k} value={k}>{k} km</option>)}
        </Select>

        <div className="grid grid-cols-[1fr_auto] gap-2">
          <Select id="techPark" title="Office near" value={get('techPark')} onChange={(v) => set('techPark', v)}>
            <option value="">Any tech park</option>
            {meta?.techParks.map((t) => <option key={t}>{t}</option>)}
          </Select>
          <Select id="maxTechParkKm" title="Within" value={get('maxTechParkKm')} onChange={(v) => set('maxTechParkKm', v)}>
            <option value="">Any</option>
            {PARK_KM.map((k) => <option key={k} value={k}>{k} km</option>)}
          </Select>
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            className="size-4 accent-violet"
            checked={get('pets') === 'true'}
            onChange={(e) => set('pets', e.target.checked ? 'true' : '')}
          />
          Pet friendly only
        </label>
      </div>
    </aside>
  )
}
