import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AlertTriangle, Check, Copy, RefreshCw, ScanText } from 'lucide-react'
import { rupees } from '../lib/format.js'
import { useFetch } from '../lib/useFetch.js'
import { fieldClass, labelClass, primaryButton, ghostButton } from '../lib/ui.js'

const EXAMPLE = 'Hi sir, 2BHK available in HSR Layout sector 2, semi furnished, rent 48k, maintenance 3k, deposit 10 months. Ready to move, visit anytime.'
const EMPTY = { locality: '', bhk: '', rent: '', depositMonths: '', furnishing: '' }
const VERDICT_STYLE = {
  low: 'border-good/40 bg-good/10 text-good',
  fair: 'border-good/40 bg-good/10 text-good',
  slightly_high: 'border-warn/40 bg-warn/10 text-warn',
  high: 'border-bad/40 bg-bad/10 text-bad',
}
const FIELD_LABELS = { locality: 'area', bhk: 'BHK', rent: 'rent', depositMonths: 'deposit', furnishing: 'furnishing' }

const toForm = (f) => Object.fromEntries(Object.keys(EMPTY).map((k) => [k, f?.[k] ?? '']))

// Raw request: resolves with the status too, because a 422 carries the fields it could read.
async function requestCheck(body) {
  const res = await fetch('/api/rent-check', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  return { status: res.status, out: await res.json().catch(() => ({})) }
}

// Where the asked rent sits among similar flats: full range, middle half (p25-p75), median and asked marker.
function RangeBar({ rent }) {
  const lo = Math.min(rent.min, rent.asked)
  const hi = Math.max(rent.max, rent.asked)
  const pos = (v) => `${((v - lo) / (hi - lo || 1)) * 100}%`
  return (
    <div className="mt-6">
      <div className="relative h-3 rounded-full bg-ink/[.06]">
        <div className="absolute inset-y-0 rounded-full bg-signal/50" style={{ left: pos(rent.low), width: `calc(${pos(rent.high)} - ${pos(rent.low)})` }} />
        <div className="absolute -inset-y-1 w-0.5 bg-ink" style={{ left: pos(rent.median) }} title="Median" />
        <div className="absolute -top-2 size-7 -translate-x-1/2 rounded-full border-2 border-paper bg-warn shadow" style={{ left: pos(rent.asked) }} title="Asked rent" />
      </div>
      <div className="mt-3 flex justify-between text-xs text-muted">
        <span>{rupees(lo)}</span>
        <span>Middle half: {rupees(rent.low)} – {rupees(rent.high)} · median {rupees(rent.median)}</span>
        <span>{rupees(hi)}</span>
      </div>
    </div>
  )
}

export default function RentCheck() {
  const [params] = useSearchParams()
  const prefill = params.get('rent') ? toForm(Object.fromEntries(params)) : null
  const { data: meta } = useFetch('/api/listings/meta')
  const [text, setText] = useState('')
  const [form, setForm] = useState(prefill ?? EMPTY)
  const [showForm, setShowForm] = useState(Boolean(prefill))
  const [missing, setMissing] = useState([])
  const [language, setLanguage] = useState('English')
  const [data, setData] = useState(null)
  const [status, setStatus] = useState({ busy: Boolean(prefill), error: null })
  const [copied, setCopied] = useState(false)

  // Puts a server response on screen. 422 = some details could not be read: highlight those fields.
  function show({ status: code, out }) {
    setShowForm(true)
    if (code === 422) {
      setForm(toForm(out.fields))
      setMissing(out.missing)
      setData(null)
      setStatus({ busy: false, error: `Couldn't find the ${out.missing.map((m) => FIELD_LABELS[m]).join(', ')}. Fill it in below.` })
    } else if (code >= 400) {
      setStatus({ busy: false, error: out.error || 'Something went wrong' })
    } else {
      setData(out)
      setForm(toForm(out.fields))
      setMissing([])
      setStatus({ busy: false, error: null })
    }
  }
  const fail = (err) => setStatus({ busy: false, error: err.message })

  function run(body) {
    setStatus({ busy: true, error: null })
    setCopied(false)
    requestCheck(body).then(show, fail)
  }

  // From a flat page, ?code= names that flat so it is not compared with itself; a pasted message clears it.
  const [exclude, setExclude] = useState(params.get('code') ?? undefined)
  const checkMessage = () => {
    setExclude(undefined)
    run({ text, language })
  }
  const check = ({ lang = language } = {}) => run({ fields: form, language: lang, exclude })

  // Coming from a flat page with ?locality=&bhk=&rent=..., check straight away (once, on arrival).
  // State already starts busy, so the effect only updates state when the response arrives.
  const [initial] = useState(() => prefill && { fields: prefill, language: 'English', exclude: params.get('code') ?? undefined })
  useEffect(() => {
    if (initial) requestCheck(initial).then(show, fail)
  }, [initial]) // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const fieldCls = (k) => `${fieldClass} ${missing.includes(k) ? 'border-warn' : ''}`
  const r = data?.result

  async function copy() {
    await navigator.clipboard.writeText(data.message)
    setCopied(true)
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <p className="eyebrow">Fair rent check</p>
      <h1 className="mt-4 page-title text-4xl sm:text-5xl">Is this rent fair?</h1>
      <p className="mt-1 text-sm text-muted">Paste the broker's message. We compare it with similar flats in the area and draft a polite counter-offer.</p>

      <section className="glass mt-6 rounded-2xl p-5">
        <label htmlFor="broker-msg" className={labelClass}>Broker's message</label>
        <textarea
          id="broker-msg"
          rows={4}
          maxLength={1500}
          className={fieldClass}
          placeholder="e.g. 2BHK in HSR Layout, semi furnished, rent 48k, deposit 10 months"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="mt-3 flex flex-wrap gap-3">
          <button type="button" disabled={status.busy || !text.trim()} onClick={checkMessage} className={primaryButton}>
            <ScanText size={16} /> {status.busy ? 'Checking…' : 'Check this offer'}
          </button>
          <button type="button" onClick={() => setText(EXAMPLE)} className={ghostButton}>Use an example</button>
          {!showForm && (
            <button type="button" onClick={() => setShowForm(true)} className="text-sm text-muted hover:text-ink">Or enter details yourself</button>
          )}
        </div>
      </section>

      {showForm && (
        <form
          className="glass mt-4 grid gap-4 rounded-2xl p-5 sm:grid-cols-2 lg:grid-cols-7"
          onSubmit={(e) => {
            e.preventDefault()
            check()
          }}
        >
          <div className="lg:col-span-2">
            <label htmlFor="rc-locality" className={labelClass}>Area</label>
            <select id="rc-locality" required className={fieldCls('locality')} value={form.locality} onChange={set('locality')}>
              <option value="" disabled>Pick an area</option>
              {meta?.localities.map((l) => <option key={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="rc-bhk" className={labelClass}>BHK</label>
            <select id="rc-bhk" required className={fieldCls('bhk')} value={form.bhk} onChange={set('bhk')}>
              <option value="" disabled>–</option>
              {[1, 2, 3].map((b) => <option key={b} value={b}>{b} BHK</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="rc-rent" className={labelClass}>Rent (₹)</label>
            <input id="rc-rent" type="number" required min={3000} max={500000} className={fieldCls('rent')} value={form.rent} onChange={set('rent')} />
          </div>
          <div>
            <label htmlFor="rc-dep" className={labelClass}>Deposit, mo</label>
            <input id="rc-dep" type="number" min={0} max={24} step={0.5} className={fieldCls('depositMonths')} value={form.depositMonths} onChange={set('depositMonths')} />
          </div>
          <div className="lg:col-span-2">
            <label htmlFor="rc-furn" className={labelClass}>Furnishing</label>
            <select id="rc-furn" className={fieldCls('furnishing')} value={form.furnishing} onChange={set('furnishing')}>
              <option value="">Any</option>
              <option>Unfurnished</option>
              <option>Semi-furnished</option>
              <option>Fully furnished</option>
            </select>
          </div>
          <div className="lg:col-span-7">
            <button type="submit" disabled={status.busy} className={ghostButton}><RefreshCw size={16} /> {data ? 'Recheck with these details' : 'Check'}</button>
          </div>
        </form>
      )}

      {status.error && <p className="mt-4 text-sm text-warn" role="alert">{status.error}</p>}

      {r && !r.enough && (
        <p className="glass mt-6 rounded-2xl p-6 text-ink-2">
          Not enough similar flats to compare ({r.count} found for {r.scope}). Try a nearby area or a different BHK.
        </p>
      )}

      {r?.enough && (
        <div className={`mt-6 space-y-4 transition-opacity ${status.busy ? 'opacity-50' : ''}`} aria-live="polite">
          <section className="glass rounded-2xl p-5">
            <div className="flex flex-wrap items-center gap-3">
              <span className={`rounded-xl border px-3 py-1 text-lg font-extrabold ${VERDICT_STYLE[r.rent.verdict.level]}`}>{r.rent.verdict.label}</span>
              <p className="text-ink">
                {rupees(r.rent.asked)} is{' '}
                <strong className="text-ink">{Math.abs(r.rent.diffPercent)}% {r.rent.diffPercent >= 0 ? 'above' : 'below'}</strong>{' '}
                the median of {r.count} {r.scope}.
              </p>
            </div>
            <RangeBar rent={r.rent} />
          </section>

          <div className="grid gap-4 md:grid-cols-2">
            <section className={`glass rounded-2xl p-5 ${r.deposit?.aboveTypical ? 'border-warn/40' : ''}`}>
              <h2 className="font-bold text-ink">Deposit</h2>
              {r.deposit ? (
                <>
                  <p className="mt-2 text-2xl font-extrabold text-ink">{rupees(r.deposit.amount)}</p>
                  <p className="text-sm text-muted">{r.deposit.months} months · similar flats ask about {r.deposit.typicalMonths}</p>
                  {r.deposit.aboveTypical && (
                    <p className="mt-3 flex gap-2 rounded-lg bg-warn/10 p-3 text-sm text-warn">
                      <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                      {r.deposit.high ? 'Much higher than usual. Most Bengaluru owners accept 2–6 months.' : 'A bit higher than similar flats.'}
                    </p>
                  )}
                </>
              ) : (
                <p className="mt-2 text-sm text-muted">The message doesn't mention a deposit. Similar flats here usually ask a few months; confirm it before paying anything.</p>
              )}
            </section>

            <section className="glass rounded-2xl p-5">
              <h2 className="font-bold text-ink">Fair counter-offer</h2>
              <p className="mt-2 text-sm text-ink-2">Rent: <strong className="text-ink">{rupees(r.target.rent)}</strong>{r.target.rent === r.rent.asked && ' (keep as asked)'}</p>
              {r.target.depositMonths != null && (
                <p className="text-sm text-ink-2">Deposit: <strong className="text-ink">{r.target.depositMonths} months</strong> ({rupees(r.target.depositMonths * r.target.rent)})</p>
              )}
              <p className="mt-3 text-xs text-faint">Based on {r.count} sample listings (demo data).</p>
            </section>
          </div>

          <section className="glass rounded-2xl p-5">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="mr-auto font-bold text-ink">Message to the broker</h2>
              {data.message && (
                <div className="flex rounded-lg bg-ink/[.03] p-1 text-sm" role="tablist" aria-label="Message language">
                  {['English', 'Hinglish'].map((l) => (
                    <button
                      key={l}
                      type="button"
                      role="tab"
                      aria-selected={language === l}
                      disabled={status.busy}
                      onClick={() => {
                        setLanguage(l)
                        check({ lang: l })
                      }}
                      className={`rounded-md px-3 py-1 font-semibold ${language === l ? 'bg-signal text-white' : 'text-muted hover:text-ink'}`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {data.message ? (
              <>
                <p className="mt-3 whitespace-pre-line rounded-xl bg-ink/[.03] p-4 text-sm leading-relaxed text-ink">{data.message}</p>
                <button type="button" onClick={copy} className={`${ghostButton} mt-3`}>
                  {copied ? <><Check size={16} className="text-good" /> Copied</> : <><Copy size={16} /> Copy message</>}
                </button>
              </>
            ) : (
              <p className="mt-3 flex items-center gap-2 text-sm text-good"><Check size={16} /> Rent and deposit look fair. No need to negotiate.</p>
            )}
          </section>

          <section className="glass rounded-2xl p-5">
            <h2 className="font-bold text-ink">Similar flats we compared</h2>
            <ul className="mt-3 divide-y divide-ink/10 text-sm">
              {r.comparables.map((c) => (
                <li key={c.code}>
                  <Link to={`/flats/${c.code}`} className="flex flex-wrap justify-between gap-2 py-2 hover:text-signal">
                    <span className="text-ink-2">{c.code} · {c.bhk}BHK {c.locality} · {c.furnishing} · {c.sqft} sqft</span>
                    <span className="font-semibold text-ink">{rupees(c.rent)} <span className="font-normal text-muted">· {c.depositMonths} mo deposit</span></span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </main>
  )
}
