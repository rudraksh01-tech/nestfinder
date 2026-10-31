import { useState } from 'react'
import { BellRing, CheckCircle2, ExternalLink, Send } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { sendJson } from '../lib/api.js'
import { useFetch } from '../lib/useFetch.js'
import { ghostButton, primaryButton } from '../lib/ui.js'

// Connect flow: get a one-time t.me link -> broker presses Start in Telegram -> Verify saves the chat.
export default function TelegramCard() {
  const { broker, setBroker } = useAuth()
  const { data: info } = useFetch('/api/broker/telegram')
  const [link, setLink] = useState(null)
  const [status, setStatus] = useState({ busy: false, error: null, note: null })

  async function run(action, note) {
    setStatus({ busy: true, error: null, note: null })
    try {
      await action()
      setStatus({ busy: false, error: null, note })
    } catch (err) {
      setStatus({ busy: false, error: err.message, note: null })
    }
  }

  const connect = () => run(async () => setLink((await sendJson('/api/broker/telegram/connect')).link))
  const verify = () =>
    run(async () => {
      setBroker((await sendJson('/api/broker/telegram/verify')).broker)
      setLink(null)
    }, 'Connected. Check Telegram for a welcome message.')
  const test = () => run(() => sendJson('/api/broker/telegram/test'), 'Test alert sent.')
  const disconnect = () => run(async () => setBroker((await sendJson('/api/broker/telegram', { method: 'DELETE' })).broker))

  // Hidden entirely until the server has a bot token.
  if (!info?.enabled) return null

  let body
  if (broker.isDemo) {
    body = (
      <p className="text-sm text-slate-400">
        Alerts are off for the shared demo account, so visitors' numbers are never sent to someone else's phone.
        Create your own broker account to try them.
      </p>
    )
  } else if (broker.telegramChatId) {
    body = (
      <div className="flex flex-wrap items-center gap-3">
        <p className="mr-auto flex items-center gap-2 text-sm text-mint"><CheckCircle2 size={16} /> Connected. New leads are sent to your Telegram.</p>
        <button type="button" disabled={status.busy} onClick={test} className={ghostButton}><Send size={16} /> Send test</button>
        <button type="button" disabled={status.busy} onClick={disconnect} className="text-sm text-slate-400 hover:text-amber">Disconnect</button>
      </div>
    )
  } else if (link) {
    body = (
      <div className="space-y-3 text-sm text-slate-300">
        <p>1. Open the bot in Telegram and press <b className="text-white">Start</b>.</p>
        <a href={link} target="_blank" rel="noreferrer" className={primaryButton}><ExternalLink size={16} /> Open @{info?.botUsername}</a>
        <p>2. Come back here and verify.</p>
        <button type="button" disabled={status.busy} onClick={verify} className={ghostButton}>{status.busy ? 'Checking…' : "I've pressed Start, verify"}</button>
      </div>
    )
  } else {
    body = (
      <div className="flex flex-wrap items-center gap-3">
        <p className="mr-auto text-sm text-slate-400">Get a Telegram message the moment someone enquires or books a visit.</p>
        <button type="button" disabled={status.busy || !info} onClick={connect} className={primaryButton}>Connect Telegram</button>
      </div>
    )
  }

  return (
    <section className="glass mt-6 rounded-2xl p-5">
      <h2 className="mb-3 flex items-center gap-2 font-bold text-white"><BellRing size={18} className="text-violet-soft" /> Telegram alerts</h2>
      {body}
      {status.error && <p className="mt-3 text-sm text-amber" role="alert">{status.error}</p>}
      {status.note && <p className="mt-3 text-sm text-mint">{status.note}</p>}
    </section>
  )
}
