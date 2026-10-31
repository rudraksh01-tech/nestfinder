import { useEffect, useState } from 'react'
import { Bell, BellOff, CheckCircle2, Send } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { sendJson } from '../lib/api.js'
import { useFetch } from '../lib/useFetch.js'
import { ghostButton, primaryButton } from '../lib/ui.js'

const supported = typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window

// The VAPID public key comes as base64url; the Push API wants raw bytes.
function keyToBytes(base64url) {
  const base64 = (base64url + '='.repeat((4 - (base64url.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/')
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
}

export default function PushCard() {
  const { broker } = useAuth()
  const { data: info } = useFetch('/api/broker/push')
  // null = not checked yet; otherwise this browser's current PushSubscription (or false)
  const [subscription, setSubscription] = useState(supported ? null : false)
  const [status, setStatus] = useState({ busy: false, error: null, note: null })

  useEffect(() => {
    if (!supported) return
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setSubscription(sub ?? false))
      .catch(() => setSubscription(false))
  }, [])

  async function run(action, note) {
    setStatus({ busy: true, error: null, note: null })
    try {
      await action()
      setStatus({ busy: false, error: null, note })
    } catch (err) {
      setStatus({ busy: false, error: err.message, note: null })
    }
  }

  const enable = () =>
    run(async () => {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') throw new Error('Notifications are blocked. Allow them for this site in your browser settings, then try again.')
      const reg = await navigator.serviceWorker.ready
      let sub
      try {
        sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyToBytes(info.publicKey) })
      } catch (err) {
        // The browser could not reach its push service (Brave with push messaging off, a VPN, or a blocked network).
        if (/push service/i.test(err.message)) {
          throw new Error(
            "Your browser couldn't reach its push service. In Brave, turn on \"Use Google services for push messaging\" in brave://settings/privacy and restart. Otherwise try another network, turn off VPN, or use Chrome or Edge.",
          )
        }
        throw err
      }
      await sendJson('/api/broker/push/subscribe', { body: { subscription: sub.toJSON() } })
      setSubscription(sub)
    }, 'Notifications are on for this device.')

  const disable = () =>
    run(async () => {
      await sendJson('/api/broker/push/unsubscribe', { body: { endpoint: subscription.endpoint } })
      await subscription.unsubscribe()
      setSubscription(false)
    })

  const test = () => run(() => sendJson('/api/broker/push/test', { body: { endpoint: subscription.endpoint } }), 'Test sent. It should pop up in a moment.')

  let body
  if (!supported) {
    body = <p className="text-sm text-slate-400">This browser does not support push notifications. On iPhone, add NestFinder to your home screen first.</p>
  } else if (info && !info.enabled) {
    body = <p className="text-sm text-slate-400">Push notifications are not set up on this server yet.</p>
  } else if (subscription) {
    body = (
      <div className="flex flex-wrap items-center gap-3">
        <p className="mr-auto flex items-center gap-2 text-sm text-mint"><CheckCircle2 size={16} /> On for this device. New leads pop up even when NestFinder is closed.</p>
        <button type="button" disabled={status.busy} onClick={test} className={ghostButton}><Send size={16} /> Send test</button>
        <button type="button" disabled={status.busy} onClick={disable} className="flex items-center gap-1 text-sm text-slate-400 hover:text-amber"><BellOff size={14} /> Turn off</button>
      </div>
    )
  } else {
    body = (
      <div className="flex flex-wrap items-center gap-3">
        <p className="mr-auto text-sm text-slate-400">
          Get a notification on this phone or laptop the moment someone enquires or books a visit.
          {broker.isDemo && ' On the shared demo account, visitor numbers are masked.'}
        </p>
        <button type="button" disabled={status.busy || !info || subscription === null} onClick={enable} className={primaryButton}>
          <Bell size={16} /> {status.busy ? 'Turning on…' : 'Enable notifications'}
        </button>
      </div>
    )
  }

  return (
    <section className="glass mt-6 rounded-2xl p-5">
      <h2 className="mb-3 flex items-center gap-2 font-bold text-white"><Bell size={18} className="text-violet-soft" /> Lead alerts</h2>
      {body}
      {status.error && <p className="mt-3 text-sm text-amber" role="alert">{status.error}</p>}
      {status.note && <p className="mt-3 text-sm text-mint">{status.note}</p>}
    </section>
  )
}
