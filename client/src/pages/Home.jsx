import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import Globe from '../components/Globe.jsx'
import PhoneStory from '../components/home/PhoneStory.jsx'

// Little floating notes around the globe: real distances from the demo data.
const NOTES = [
  { label: 'Manyata Tech Park', value: '2.4 km from a Hebbal 1BHK', className: 'left-[-4%] top-[16%]' },
  { label: 'Deposit check', value: '10 months? Ask for 3', className: 'right-[-2%] top-[46%]' },
  { label: 'Purple line', value: 'Indiranagar · 0.5 km', className: 'left-[4%] bottom-[12%]' },
]

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-6xl items-center gap-4 px-5 pb-10 pt-12 sm:px-8 lg:grid-cols-[1.2fr_1fr] lg:gap-0 lg:pb-16 lg:pt-14">
        <div className="relative z-10 text-center lg:text-left">
          <p className="eyebrow">Bengaluru · 12.97° N, 77.59° E</p>
          <h1 className="mx-auto mt-5 max-w-[38rem] font-display text-[3.1rem] leading-[0.98] tracking-[-0.015em] sm:text-[4.4rem] lg:mx-0 lg:text-[4.75rem]">
            New in Bengaluru? Find a flat that fits <em className="text-signal">how you live.</em>
          </h1>
          <p className="mx-auto mt-6 max-w-md text-[1.05rem] leading-relaxed text-ink-2 lg:mx-0">
            Tell it where you work, what you can pay and who's moving in. NestFinder scores every flat against your day,
            flags a padded deposit, and helps you pick one.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
            <Link to="/match" className="inline-flex items-center gap-2 rounded-full bg-signal px-6 py-3 font-medium text-white shadow-[0_10px_30px_-10px_rgb(30_79_255/0.8)] transition hover:bg-signal-deep">
              Find my match <ArrowRight size={18} />
            </Link>
            <Link to="/rent-check" className="inline-flex items-center gap-2 rounded-full border border-ink/15 bg-white/50 px-6 py-3 font-medium text-ink backdrop-blur transition hover:border-ink/30 hover:bg-white">
              Check a broker's quote
            </Link>
          </div>
          <p className="mt-6 font-mono text-[0.7rem] text-faint lg:mt-10">Drag the globe · Arcs: where Bengaluru's newcomers come from</p>
        </div>

        <div className="relative mx-auto w-[min(92vw,600px)] lg:mr-[-8%] lg:w-[min(50vw,660px)]">
          <div className="absolute inset-[10%] rounded-full bg-signal/20 blur-3xl" />
          <Globe />
          {NOTES.map((n) => (
            <div key={n.label} className={`glass absolute hidden rounded-2xl !bg-white/80 px-3.5 py-2.5 text-left md:block ${n.className}`}>
              <p className="eyebrow !text-[0.62rem]">{n.label}</p>
              <p className="mt-0.5 text-sm font-medium">{n.value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Figures() {
  const items = [
    ['82', 'Namma Metro stations, mapped from OpenStreetMap'],
    ['120', 'sample flats across 25 neighbourhoods'],
    ['6', 'tech parks, with the distance from every flat'],
    ['3', 'languages it understands: English, Hindi, Hinglish'],
  ]
  return (
    <section className="relative z-10 mx-auto max-w-6xl px-5 sm:px-8">
      <div className="glass grid grid-cols-2 gap-px overflow-hidden rounded-3xl lg:grid-cols-4">
        {items.map(([n, label]) => (
          <div key={n} className="p-6 sm:p-8">
            <p className="font-display text-5xl leading-none sm:text-6xl">{n}</p>
            <p className="mt-3 max-w-[14rem] text-sm leading-snug text-ink-2">{label}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-center font-mono text-[0.7rem] text-faint">Listings are sample data for this demo. The map, metro and distances are real.</p>
    </section>
  )
}

function RentPreview() {
  return (
    <div className="mt-6 rounded-2xl bg-white/70 p-4">
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-ink-2">2BHK · HSR Layout</span>
        <span className="rounded-full bg-warn/10 px-2 py-0.5 font-mono text-[0.7rem] text-warn">14% above median</span>
      </div>
      <div className="relative mt-5 h-2 rounded-full bg-ink/[.07]">
        <div className="absolute inset-y-0 left-[26%] right-[14%] rounded-full bg-signal/35" />
        <div className="absolute -inset-y-1.5 left-[52%] w-0.5 bg-ink" />
        <div className="absolute -top-1.5 left-[88%] size-5 -translate-x-1/2 rounded-full border-2 border-white bg-warn shadow" />
      </div>
      <div className="mt-3 flex justify-between font-mono text-[0.68rem] text-muted">
        <span>₹27.5k</span><span>median ₹42k</span><span>asked ₹48k</span>
      </div>
    </div>
  )
}

function ComparePreview() {
  const rows = [['Monthly', '₹18,000', '₹21,500'], ['Deposit', '3 mo', '2 mo'], ['Metro', '1.2 km', '0.8 km']]
  return (
    <div className="mt-6 overflow-hidden rounded-2xl bg-white/70 text-sm">
      {rows.map(([k, a, b]) => (
        <div key={k} className="grid grid-cols-3 border-b border-ink/5 px-4 py-2.5 last:border-0">
          <span className="text-muted">{k}</span>
          <span className="font-mono">{a}</span>
          <span className="font-mono text-good">{b}</span>
        </div>
      ))}
    </div>
  )
}

function Features() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-28 sm:px-8">
      <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <div className="lg:pr-10">
          <p className="eyebrow">03 · What it does</p>
          <h2 className="mt-3 font-display text-4xl leading-[1.02] sm:text-6xl">
            The three questions every flat hunt comes down to.
          </h2>
          <p className="mt-5 max-w-md leading-relaxed text-ink-2">
            Does it fit my life? Is the price fair? Which one do I pick? Each has its own tool, and each shows its working.
          </p>
        </div>

        <Link to="/match" className="glass group rounded-3xl p-7 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]">
          <div className="flex items-start justify-between">
            <p className="eyebrow">Match score</p>
            <ArrowUpRight size={18} className="text-faint transition group-hover:text-signal" />
          </div>
          <p className="mt-4 font-display text-3xl leading-tight">“Does it fit my life?”</p>
          <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-2">A percentage for every flat, with the reasons: commute, metro, pets, noise, who the owner will rent to.</p>
          <div className="mt-6 flex items-center gap-4 rounded-2xl bg-white/70 p-4">
            <span className="grid size-14 place-items-center rounded-2xl bg-good/10 font-display text-2xl text-good">86</span>
            <ul className="space-y-1 text-sm">
              <li><span className="text-good">✓</span> ₹7,000 under budget</li>
              <li><span className="text-good">✓</span> Pets allowed</li>
              <li><span className="text-warn">!</span> 8.9 km to Manyata</li>
            </ul>
          </div>
        </Link>

        <Link to="/rent-check" className="glass group rounded-3xl p-7 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]">
          <div className="flex items-start justify-between">
            <p className="eyebrow">Fair rent check</p>
            <ArrowUpRight size={18} className="text-faint transition group-hover:text-signal" />
          </div>
          <p className="mt-4 font-display text-3xl leading-tight">“Is the price fair?”</p>
          <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-2">Paste the broker's WhatsApp message. See where it sits against similar flats, and get a counter-offer to send back.</p>
          <RentPreview />
        </Link>

        <Link to="/compare" className="glass group rounded-3xl p-7 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]">
          <div className="flex items-start justify-between">
            <p className="eyebrow">Compare & decide</p>
            <ArrowUpRight size={18} className="text-faint transition group-hover:text-signal" />
          </div>
          <p className="mt-4 font-display text-3xl leading-tight">“Which one do I pick?”</p>
          <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-2">Line up your shortlist. It picks one, says why, and tells you when the runner-up would be the better call.</p>
          <ComparePreview />
        </Link>
      </div>
    </section>
  )
}

function Honest() {
  return (
    <section className="mx-auto max-w-6xl px-5 sm:px-8">
      <div className="relative overflow-hidden rounded-[2rem] bg-ink px-7 py-14 text-porcelain sm:px-14 sm:py-20">
        <div className="absolute -right-24 -top-24 size-96 rounded-full bg-signal/40 blur-[100px]" />
        <div className="relative grid gap-10 lg:grid-cols-2 lg:items-end">
          <div>
            <p className="font-mono text-[0.72rem] uppercase tracking-[0.08em] text-porcelain/60">04 · No black box</p>
            <h2 className="mt-3 font-display text-4xl leading-[1.02] sm:text-6xl">
              The AI listens. <em className="text-[#8ea6ff]">The maths decides.</em>
            </h2>
          </div>
          <p className="max-w-md leading-relaxed text-porcelain/75">
            The language model only turns what you say into preferences and explains the result. Scores and rent verdicts come from
            plain rules you can read and test, so the same question always gets the same answer, and every number on screen is real.
          </p>
        </div>
      </div>
    </section>
  )
}

function Closing() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-28 text-center sm:px-8">
      <h2 className="mx-auto max-w-3xl font-display text-5xl leading-[1] sm:text-7xl">Start with where you work.</h2>
      <p className="mx-auto mt-5 max-w-md text-ink-2">Everything else (budget, pets, the metro walk) can come up in conversation.</p>
      <Link to="/match" className="mt-8 inline-flex items-center gap-2 rounded-full bg-signal px-7 py-3.5 font-medium text-white shadow-[0_10px_30px_-10px_rgb(30_79_255/0.8)] transition hover:bg-signal-deep">
        Find my match <ArrowRight size={18} />
      </Link>
    </section>
  )
}

export default function Home() {
  return (
    <main>
      <Hero />
      <Figures />
      <PhoneStory />
      <Features />
      <Honest />
      <Closing />
    </main>
  )
}
