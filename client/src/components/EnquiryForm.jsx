import { useState } from 'react'
import { CalendarCheck, CheckCircle2, Send } from 'lucide-react'
import { sendJson } from '../lib/api.js'
import { fieldClass, labelClass, primaryButton } from '../lib/ui.js'

const isoDate = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)

export default function EnquiryForm({ listingCode }) {
  const [form, setForm] = useState({ name: '', phone: '', message: '', bookVisit: false, visitDate: '' })
  const [status, setStatus] = useState({ sending: false, error: null, sent: false })
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  // Visit window (today .. +60 days, matching the server rule), computed once when the form mounts.
  const [{ minDate, maxDate }] = useState(() => {
    const today = new Date()
    return { minDate: isoDate(today), maxDate: isoDate(new Date(today.getTime() + 60 * 86400000)) }
  })

  async function submit(e) {
    e.preventDefault()
    setStatus({ sending: true, error: null, sent: false })
    try {
      await sendJson('/api/leads', {
        body: {
          listing: listingCode,
          name: form.name,
          phone: form.phone,
          message: form.message,
          visitDate: form.bookVisit ? form.visitDate : undefined,
        },
      })
      setStatus({ sending: false, error: null, sent: true })
    } catch (err) {
      setStatus({ sending: false, error: err.message, sent: false })
    }
  }

  if (status.sent) {
    return (
      <section className="glass rounded-2xl border-mint/40 p-5">
        <p className="flex items-center gap-2 font-bold text-white"><CheckCircle2 className="text-mint" size={20} /> Request sent</p>
        <p className="mt-2 text-sm text-slate-300">
          {form.bookVisit ? `Visit requested for ${new Date(form.visitDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}. ` : ''}
          The broker will call you on {form.phone}.
        </p>
        <p className="mt-3 text-xs text-slate-500">Demo: this goes to a sample broker's dashboard.</p>
      </section>
    )
  }

  return (
    <form onSubmit={submit} className="glass space-y-3 rounded-2xl p-5">
      <h2 className="font-bold text-white">Contact the broker</h2>
      <div>
        <label htmlFor="enq-name" className={labelClass}>Name</label>
        <input id="enq-name" required maxLength={80} className={fieldClass} value={form.name} onChange={set('name')} autoComplete="name" />
      </div>
      <div>
        <label htmlFor="enq-phone" className={labelClass}>Mobile</label>
        <input
          id="enq-phone"
          required
          type="tel"
          inputMode="tel"
          placeholder="98765 43210"
          className={fieldClass}
          value={form.phone}
          onChange={set('phone')}
          autoComplete="tel"
        />
      </div>
      <div>
        <label htmlFor="enq-msg" className={labelClass}>Message (optional)</label>
        <textarea
          id="enq-msg"
          rows={3}
          maxLength={1000}
          placeholder="Is the rent negotiable? When can I move in?"
          className={fieldClass}
          value={form.message}
          onChange={set('message')}
        />
      </div>
      <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
        <input type="checkbox" className="size-4 accent-violet" checked={form.bookVisit} onChange={set('bookVisit')} />
        I want to visit the flat
      </label>
      {form.bookVisit && (
        <div>
          <label htmlFor="enq-date" className={labelClass}>Visit date</label>
          <input id="enq-date" type="date" required min={minDate} max={maxDate} className={fieldClass} value={form.visitDate} onChange={set('visitDate')} />
        </div>
      )}
      {status.error && <p className="text-sm text-amber" role="alert">{status.error}</p>}
      <button type="submit" disabled={status.sending} className={`${primaryButton} w-full`}>
        {form.bookVisit ? <CalendarCheck size={16} /> : <Send size={16} />}
        {status.sending ? 'Sending…' : form.bookVisit ? 'Book visit' : 'Send enquiry'}
      </button>
    </form>
  )
}
