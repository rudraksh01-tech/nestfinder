import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bot, SendHorizontal, Sparkles } from 'lucide-react'
import { sendJson } from '../lib/api.js'
import { fieldClass } from '../lib/ui.js'

const EXAMPLES = [
  'Manyata me job hai, 25k budget, ek kutta hai, metro paas chahiye',
  'Family of 4, office in Whitefield, need a quiet 3BHK with car parking under 50k',
  'मुझे इलेक्ट्रॉनिक सिटी के पास 1BHK चाहिए, बजट 15 हज़ार',
]

// Chat that turns plain words into match preferences. `prefs` is the current form (from the URL);
// `onPrefs` receives the AI's updated preferences so the form and results update too.
export default function ChatPanel({ prefs, onPrefs }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [status, setStatus] = useState({ busy: false, error: null })
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [messages, status.busy])

  async function send(text) {
    const content = text.trim()
    if (!content || status.busy) return
    const next = [...messages, { role: 'user', content }]
    setMessages(next)
    setInput('')
    setStatus({ busy: true, error: null })
    try {
      const res = await sendJson('/api/chat', {
        body: { messages: next.map(({ role, content }) => ({ role, content })), prefs },
      })
      setMessages([...next, { role: 'assistant', content: res.reply, matches: res.matches }])
      onPrefs(res.prefs)
      setStatus({ busy: false, error: null })
    } catch (err) {
      setStatus({ busy: false, error: err.message })
    }
  }

  return (
    <section className="glass mb-6 rounded-2xl p-4 sm:p-5">
      <h2 className="flex items-center gap-2 font-bold text-white">
        <Bot size={18} className="text-violet-soft" /> Describe how you live
        <span className="text-xs font-normal text-slate-400">English, Hindi or Hinglish</span>
      </h2>

      {messages.length === 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {EXAMPLES.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => send(e)}
              className="rounded-full border border-white/10 px-3 py-1.5 text-left text-xs text-slate-300 transition hover:border-violet-soft/60 hover:text-white"
            >
              {e}
            </button>
          ))}
        </div>
      ) : (
        <ol className="mt-4 max-h-96 space-y-3 overflow-y-auto pr-1">
          {messages.map((m, i) => (
            <li key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex'}>
              <div
                className={`max-w-[90%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm ${
                  m.role === 'user' ? 'bg-violet text-white' : 'bg-white/[.06] text-slate-200'
                }`}
              >
                {m.content}
                {m.matches?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {m.matches.map((x) => (
                      <Link
                        key={x.code}
                        to={`/flats/${x.code}`}
                        className="rounded-lg border border-white/10 bg-ink-2 px-2.5 py-1 text-xs text-slate-200 hover:border-violet-soft/60"
                      >
                        <span className="font-bold text-mint">{x.score}%</span> {x.code} · {x.bhk}BHK {x.locality}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </li>
          ))}
          {status.busy && (
            <li className="flex">
              <div className="flex items-center gap-2 rounded-2xl bg-white/[.06] px-4 py-2.5 text-sm text-slate-400">
                <Sparkles size={14} className="animate-pulse text-violet-soft" /> Finding your matches…
              </div>
            </li>
          )}
          <li ref={endRef} aria-hidden />
        </ol>
      )}

      {status.error && <p className="mt-3 text-sm text-amber" role="alert">{status.error}</p>}

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
          placeholder="e.g. I work in Electronic City, budget 20k, need a gym"
          maxLength={600}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={status.busy || !input.trim()}
          aria-label="Send"
          className="grid size-10 shrink-0 place-items-center rounded-lg bg-violet text-white transition hover:bg-violet/85 disabled:opacity-40"
        >
          <SendHorizontal size={18} />
        </button>
      </form>
      <p className="mt-2 text-xs text-slate-500">AI can make mistakes. Scores come from fixed rules, so check the reasons on each flat.</p>
    </section>
  )
}
