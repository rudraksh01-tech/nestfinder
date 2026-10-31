import { Link } from 'react-router-dom'
import { ArrowRight, Sparkles, Target, Scale, BadgeIndianRupee } from 'lucide-react'

const FEATURES = [
  { icon: Target, title: 'AI Match Score', text: 'Tell us how you live. Every flat gets a % match and the reasons behind it.', to: '/match' },
  { icon: BadgeIndianRupee, title: 'Fair Rent Check', text: 'Paste a broker message. See if the rent and deposit are fair for the area.', to: '/rent-check' },
  { icon: Scale, title: 'Compare & Decide', text: 'Shortlist flats and get a clear, reasoned recommendation.' },
]

export default function Home() {
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
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          to="/match"
          className="inline-flex items-center gap-2 rounded-xl bg-violet px-5 py-3 font-semibold text-white transition hover:bg-violet/85"
        >
          Find my match <ArrowRight size={18} />
        </Link>
        <Link to="/flats" className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-5 py-3 font-semibold text-slate-200 transition hover:border-white/40">
          Browse all flats
        </Link>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, text, to }) => {
          const body = (
            <>
              <Icon className="text-mint" />
              <h2 className="mt-4 text-lg font-bold text-white">{title}</h2>
              <p className="mt-2 text-slate-300">{text}</p>
              {!to && <p className="mt-3 text-xs text-slate-500">Coming soon</p>}
            </>
          )
          return to ? (
            <Link key={title} to={to} className="glass rounded-2xl p-6 transition hover:border-violet-soft/50">{body}</Link>
          ) : (
            <article key={title} className="glass rounded-2xl p-6">{body}</article>
          )
        })}
      </div>

      <p className="mt-10 text-sm text-slate-400">
        All listings are sample data for a portfolio demo. Distances are straight-line and approximate.
      </p>
    </main>
  )
}
