import { useEffect, useState } from 'react'
import { Sparkles, Target, Scale, BadgeIndianRupee } from 'lucide-react'

const FEATURES = [
  { icon: Target, title: 'AI Match Score', text: 'Tell us how you live. Every flat gets a % match and the reasons behind it.' },
  { icon: BadgeIndianRupee, title: 'Fair Rent Check', text: 'Paste a broker message. See if the rent and deposit are fair for the area.' },
  { icon: Scale, title: 'Compare & Decide', text: 'Shortlist flats and get a clear, reasoned recommendation.' },
]

export default function App() {
  const [api, setApi] = useState('checking…')

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((d) => setApi(d.ok ? 'connected' : 'error'))
      .catch(() => setApi('offline'))
  }, [])

  return (
    <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <p className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-sm text-violet-soft">
        <Sparkles size={16} /> AI flat finder for Bengaluru
      </p>
      <h1 className="mt-6 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-6xl">
        Find the flat that fits <span className="text-violet-soft">your life</span>, not just your budget.
      </h1>
      <p className="mt-5 max-w-2xl text-lg text-slate-300">
        Describe your commute, habits and budget in plain words. NestFinder matches you to flats,
        checks if the rent is fair and helps you decide.
      </p>

      <div className="mt-12 grid gap-4 sm:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, text }) => (
          <article key={title} className="glass rounded-2xl p-6">
            <Icon className="text-mint" />
            <h2 className="mt-4 text-lg font-bold text-white">{title}</h2>
            <p className="mt-2 text-slate-300">{text}</p>
          </article>
        ))}
      </div>

      <p className="mt-10 text-sm text-slate-400">API: {api}</p>
    </main>
  )
}
