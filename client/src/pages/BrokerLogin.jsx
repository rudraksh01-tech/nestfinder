import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { LogIn, UserPlus } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { fieldClass, labelClass, primaryButton, ghostButton } from '../lib/ui.js'

const DEMO = { email: 'demo@nestfinder.test', password: 'demo1234' }

function Field({ id, label, ...props }) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>{label}</label>
      <input id={id} className={fieldClass} {...props} />
    </div>
  )
}

export default function BrokerLogin() {
  const { broker, login, register } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', agency: '', phone: '', email: '', password: '' })
  const [status, setStatus] = useState({ busy: false, error: null })
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const goTo = location.state?.from ?? '/broker'
  if (broker) return <Navigate to={goTo} replace />

  async function run(action) {
    setStatus({ busy: true, error: null })
    try {
      await action()
      navigate(goTo, { replace: true })
    } catch (err) {
      setStatus({ busy: false, error: err.message })
    }
  }

  const submit = (e) => {
    e.preventDefault()
    run(() => (mode === 'login' ? login(form.email, form.password) : register(form)))
  }

  return (
    <main className="mx-auto grid max-w-5xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:items-center">
      <div>
        <p className="eyebrow">For brokers</p>
        <h1 className="mt-5 page-title text-5xl leading-tight">Manage your listings and leads in one place.</h1>
        <p className="mt-4 text-ink-2">
          See every enquiry and visit booking, update lead status, and add or edit flats. New leads can also ping you on Telegram.
        </p>
        <div className="glass mt-6 rounded-2xl p-5">
          <p className="font-semibold text-ink">Just looking around?</p>
          <p className="mt-1 text-sm text-muted">
            Use the demo broker account: <span className="text-ink">{DEMO.email}</span> / <span className="text-ink">{DEMO.password}</span>.
            Demo data is reset regularly.
          </p>
          <button type="button" disabled={status.busy} onClick={() => run(() => login(DEMO.email, DEMO.password))} className={`${ghostButton} mt-4`}>
            <LogIn size={16} /> Use demo login
          </button>
        </div>
      </div>

      <form onSubmit={submit} className="glass space-y-4 rounded-2xl p-6">
        <div className="flex rounded-xl bg-ink/[.03] p-1" role="tablist">
          {[['login', 'Log in'], ['register', 'Create account']].map(([m, text]) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => { setMode(m); setStatus({ busy: false, error: null }) }}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${mode === m ? 'bg-signal text-white' : 'text-muted hover:text-ink'}`}
            >
              {text}
            </button>
          ))}
        </div>

        {mode === 'register' && (
          <>
            <Field id="name" label="Your name" required maxLength={80} value={form.name} onChange={set('name')} autoComplete="name" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="agency" label="Agency (optional)" maxLength={80} value={form.agency} onChange={set('agency')} />
              <Field id="phone" label="Phone (optional)" type="tel" value={form.phone} onChange={set('phone')} autoComplete="tel" />
            </div>
          </>
        )}
        <Field id="email" label="Email" type="email" required value={form.email} onChange={set('email')} autoComplete="email" />
        <Field
          id="password"
          label="Password"
          type="password"
          required
          minLength={mode === 'register' ? 8 : undefined}
          value={form.password}
          onChange={set('password')}
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
        />
        {mode === 'register' && <p className="-mt-2 text-xs text-faint">At least 8 characters.</p>}

        {status.error && <p className="text-sm text-warn" role="alert">{status.error}</p>}
        <button type="submit" disabled={status.busy} className={`${primaryButton} w-full`}>
          {mode === 'login' ? <LogIn size={16} /> : <UserPlus size={16} />}
          {status.busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
        </button>
      </form>
    </main>
  )
}
