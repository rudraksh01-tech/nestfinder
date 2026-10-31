import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Bot, CalendarCheck, CheckCircle2, SendHorizontal, Sparkles } from 'lucide-react'
import { sendJson } from '../lib/api.js'
import { rupees } from '../lib/format.js'
import { fieldClass, primaryButton } from '../lib/ui.js'

// English first; the last ones show it can also check rents, compare and understand Hinglish.
const EXAMPLES = [
  'I work at Manyata Tech Park, budget 25k, I have a dog and want the metro nearby',
  'Is 48k fair for a 2BHK in HSR Layout with a 10 month deposit?',
  'Compare NF-102 and NF-097',
  'Bagmane me job hai, 20k budget, akela rehta hoon',
]

const VERDICT_STYLE = {
  low: 'bg-good/10 text-good',
  fair: 'bg-good/10 text-good',
  slightly_high: 'bg-warn/10 text-warn',
  high: 'bg-bad/10 text-bad',
}

// Reads the assistant's newline-delimited JSON events as they arrive.
async function streamAssistant(body, onEvent) {
  const res = await fetch('/api/assistant', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw Object.assign(new Error(err.error || `Request failed (${res.status})`), { status: res.status })
  }
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    let newline
    while ((newline = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, newline).trim()
      buffer = buffer.slice(newline + 1)
      if (line) onEvent(JSON.parse(line))
    }
  }
}

function FlatChips({ matches }) {
  return (
    <div className="flex flex-wrap gap-2">
      {matches.map((x) => (
        <Link key={x.code} to={`/flats/${x.code}`} className="rounded-lg border border-ink/10 bg-paper/80 px-2.5 py-1 text-xs text-ink hover:border-signal/60">
          {x.score != null && <span className="font-bold text-good">{x.score}% </span>}
          {x.code} · {x.bhk}BHK {x.locality}
        </Link>
      ))}
    </div>
  )
}

function RentCard({ data }) {
  if (!data.enough) return <p className="text-xs text-muted">Not enough similar flats to compare.</p>
  const { ask } = data
  const query = new URLSearchParams({ locality: ask.locality, bhk: ask.bhk, rent: ask.rent, ...(ask.depositMonths && { depositMonths: ask.depositMonths }), ...(data.code && { code: data.code }) })
  return (
    <div className="rounded-xl border border-ink/10 bg-paper/80 p-3 text-xs">
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-ink">{ask.bhk}BHK · {ask.locality} · {rupees(ask.rent)}</span>
        <span className={`rounded-full px-2 py-0.5 font-mono ${VERDICT_STYLE[data.verdict.level]}`}>{data.verdict.label}</span>
      </div>
      <p className="mt-1 text-muted">Median {rupees(data.median)} across {data.count} similar flats · counter at {rupees(data.target.rent)}</p>
      <Link to={`/rent-check?${query}`} className="mt-2 inline-flex items-center gap-1 font-medium text-signal hover:underline">
        Open in Rent check <ArrowUpRight size={12} />
      </Link>
    </div>
  )
}

function CompareCard({ data }) {
  return (
    <div className="overflow-hidden rounded-xl border border-ink/10 bg-paper/80 text-xs">
      {data.flats.map((f) => (
        <Link key={f.code} to={`/flats/${f.code}`} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 border-b border-ink/5 px-3 py-2 last:border-0 hover:bg-paper">
          <span className="text-ink">{f.code} · {f.bhk}BHK {f.locality}</span>
          <span className="font-mono">{rupees(f.rent)}</span>
          <span className="font-mono text-muted">{f.depositMonths} mo</span>
          <span className="font-mono text-muted">{f.metroKm} km</span>
        </Link>
      ))}
    </div>
  )
}

// The assistant never books on its own: the visit is only requested when the person confirms here.
function VisitCard({ data }) {
  const [form, setForm] = useState({ name: '', phone: '', date: data.date ?? '' })
  const [status, setStatus] = useState({ busy: false, error: null, done: false })
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  async function confirm(e) {
    e.preventDefault()
    setStatus({ busy: true, error: null, done: false })
    try {
      await sendJson('/api/leads', { body: { listing: data.code, name: form.name, phone: form.phone, visitDate: form.date || undefined } })
      setStatus({ busy: false, error: null, done: true })
    } catch (err) {
      setStatus({ busy: false, error: err.message, done: false })
    }
  }

  if (status.done) {
    return (
      <p className="flex items-center gap-2 rounded-xl border border-good/30 bg-good/10 p-3 text-xs text-good">
        <CheckCircle2 size={14} /> Visit requested for {data.code}{form.date && ` on ${new Date(form.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}. The broker will call you.
      </p>
    )
  }
  return (
    <form onSubmit={confirm} className="space-y-2 rounded-xl border border-ink/10 bg-paper/80 p-3 text-xs">
      <p className="flex items-center gap-1.5 font-semibold text-ink"><CalendarCheck size={14} className="text-signal" /> Confirm a visit to {data.code} · {data.bhk}BHK {data.locality}</p>
      <div className="grid gap-2 sm:grid-cols-3">
        <input required aria-label="Your name" placeholder="Your name" className={fieldClass} value={form.name} onChange={set('name')} autoComplete="name" />
        <input required type="tel" aria-label="Mobile number" placeholder="Mobile" className={fieldClass} value={form.phone} onChange={set('phone')} autoComplete="tel" />
        <input type="date" aria-label="Visit date" className={fieldClass} value={form.date} onChange={set('date')} />
      </div>
      {status.error && <p className="text-warn" role="alert">{status.error}</p>}
      <div className="flex items-center gap-3">
        <button type="submit" disabled={status.busy} className={`${primaryButton} !px-4 !py-1.5 !text-xs`}>{status.busy ? 'Sending…' : 'Confirm visit'}</button>
        <span className="text-faint">Demo brokers, so a dummy number is fine.</span>
      </div>
    </form>
  )
}

function ToolCard({ card }) {
  if (card.name === 'search_flats') return <FlatChips matches={card.data.matches} />
  if (card.name === 'get_flat') return <FlatChips matches={[card.data]} />
  if (card.name === 'check_rent') return <RentCard data={card.data} />
  if (card.name === 'compare_flats') return <CompareCard data={card.data} />
  if (card.name === 'book_visit') return <VisitCard data={card.data} />
  return null
}

// The model is asked for plain text, but bold markers occasionally slip through.
const plain = (text) => text.replace(/\*\*(.+?)\*\*/g, '$1')

// Chat with the NestFinder assistant. It can search flats, check a rent, compare flats and
// prepare a visit request, using tools on the server. `prefs` is the current form (from the URL);
// `onPrefs` receives new preferences after a search so the form and results follow the chat.
export default function ChatPanel({ prefs, onPrefs }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [status, setStatus] = useState({ busy: false, error: null, step: null })
  const listRef = useRef(null)

  // Keep the newest message in view inside the chat box (not by scrolling the whole page).
  useEffect(() => {
    const list = listRef.current
    if (list) list.scrollTop = list.scrollHeight
  }, [messages, status.step])

  const updateLast = (fn) => setMessages((all) => [...all.slice(0, -1), fn(all.at(-1))])

  async function send(text) {
    const content = text.trim()
    if (!content || status.busy) return
    const history = [...messages, { role: 'user', content }]
    setMessages([...history, { role: 'assistant', content: '', cards: [] }])
    setInput('')
    setStatus({ busy: true, error: null, step: 'Thinking' })
    const body = { messages: history.map(({ role, content }) => ({ role, content })), prefs }

    try {
      await streamAssistant(body, (event) => {
        if (event.type === 'delta') {
          updateLast((m) => ({ ...m, content: m.content + event.text }))
          setStatus((s) => ({ ...s, step: null }))
        } else if (event.type === 'status') {
          setStatus((s) => ({ ...s, step: event.text }))
        } else if (event.type === 'tool') {
          updateLast((m) => ({ ...m, cards: [...m.cards, { name: event.name, data: event.data }] }))
          if (event.name === 'search_flats') onPrefs(event.data.prefs)
        } else if (event.type === 'error') {
          throw new Error(event.message)
        }
      })
      setStatus({ busy: false, error: null, step: null })
    } catch (err) {
      // If the assistant endpoint itself is unavailable, fall back to the simpler search chat.
      if (err.status && err.status !== 400 && err.status !== 429) {
        try {
          const res = await sendJson('/api/chat', { body })
          updateLast(() => ({ role: 'assistant', content: res.reply, cards: [{ name: 'search_flats', data: { matches: res.matches } }] }))
          onPrefs(res.prefs)
          setStatus({ busy: false, error: null, step: null })
          return
        } catch {
          // fall through to show the original error
        }
      }
      setMessages((all) => (all.at(-1)?.content || all.at(-1)?.cards?.length ? all : all.slice(0, -1)))
      setStatus({ busy: false, error: err.message, step: null })
    }
  }

  return (
    <section className="glass mb-6 rounded-2xl p-4 sm:p-5">
      <h2 className="flex flex-wrap items-center gap-x-2 gap-y-1 font-bold text-ink">
        <Bot size={18} className="text-signal" /> Ask the assistant
        <span className="text-xs font-normal text-muted">Find flats, check a rent, compare, book a visit · English, Hindi or Hinglish</span>
      </h2>

      {messages.length === 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {EXAMPLES.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => send(e)}
              className="rounded-full border border-ink/10 px-3 py-1.5 text-left text-xs text-ink-2 transition hover:border-signal/60 hover:text-ink"
            >
              {e}
            </button>
          ))}
        </div>
      ) : (
        <ol ref={listRef} className="mt-4 max-h-[28rem] space-y-3 overflow-y-auto pr-1" aria-live="polite">
          {messages.map((m, i) => (
            <li key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex'}>
              <div className={`max-w-[92%] rounded-2xl px-4 py-2.5 text-sm ${m.role === 'user' ? 'bg-signal text-white' : 'bg-ink/[.045] text-ink'}`}>
                {m.cards?.length > 0 && <div className="mb-2 space-y-2">{m.cards.map((c, j) => <ToolCard key={j} card={c} />)}</div>}
                {m.content && <p className="whitespace-pre-line">{plain(m.content)}</p>}
                {i === messages.length - 1 && status.busy && status.step && (
                  <p className="flex items-center gap-2 text-muted"><Sparkles size={14} className="animate-pulse text-signal" /> {status.step}…</p>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}

      {status.error && <p className="mt-3 text-sm text-warn" role="alert">{status.error}</p>}

      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          send(input)
        }}
      >
        <label htmlFor="chat-input" className="sr-only">Message</label>
        <input
          id="chat-input"
          className={fieldClass}
          placeholder="e.g. Is 30k fair for a 1BHK in Indiranagar?"
          maxLength={600}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={status.busy || !input.trim()}
          aria-label="Send"
          className="grid size-10 shrink-0 place-items-center rounded-lg bg-signal text-white transition hover:bg-signal-deep disabled:opacity-40"
        >
          <SendHorizontal size={18} />
        </button>
      </form>
      <p className="mt-2 text-xs text-faint">AI can make mistakes. Scores and rent verdicts come from fixed rules; visits are only requested when you confirm.</p>
    </section>
  )
}
