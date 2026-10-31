import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion, useReducedMotion } from 'motion/react'
import { ArrowRight, ArrowUp, ArrowUpRight, Building2, Home as HomeIcon, Lightbulb, PiggyBank, Wallet } from 'lucide-react'
import Globe from '../components/Globe.jsx'
import PhoneStory from '../components/home/PhoneStory.jsx'

// Little floating notes either side of the globe: real distances from the demo data.
const NOTES = [
  { label: 'Manyata Tech Park', value: '2.4 km from a Hebbal 1BHK', className: 'left-0 top-[52%]' },
  { label: 'Purple line', value: 'Indiranagar · 0.5 km', className: 'left-[3%] bottom-[16%]' },
  { label: 'Deposit check', value: '10 months? Ask for 3', className: 'right-0 top-[44%]' },
]

// Two looks for the hero, so they can be compared: the default puts a porcelain globe on a black
// section; ?globe=black puts a near-black globe on the light page.
const HERO_LOOKS = {
  white: {
    section: '-mt-[4.25rem] rounded-b-[2.5rem] bg-ink pt-[4.25rem]',
    halo: 'bg-[#8ea2ff]/20',
    shade: 'bg-[radial-gradient(circle_at_50%_30%,rgb(244_243_238/0.9)_28%,rgb(244_243_238/0.55)_48%,rgb(244_243_238/0)_70%)]',
    text: 'text-ink',
    eyebrow: 'text-ink/55',
    shadow: '[text-shadow:0_2px_24px_rgb(244_243_238/0.8)]',
    em: 'text-signal',
    line: 'text-ink-2',
    second: 'border-ink/15 bg-white/70 text-ink hover:bg-white',
    caption: 'text-porcelain/45',
  },
  black: {
    section: '',
    halo: 'bg-signal/20',
    shade: 'bg-[radial-gradient(circle_at_50%_30%,rgb(13_19_33/0.9)_28%,rgb(13_19_33/0.55)_48%,rgb(13_19_33/0)_70%)]',
    text: 'text-porcelain',
    eyebrow: 'text-porcelain/60',
    shadow: '[text-shadow:0_2px_24px_rgb(13_19_33/0.6)]',
    em: 'text-[#9db3ff]',
    line: 'text-porcelain/75',
    second: 'border-white/25 bg-white/10 text-porcelain hover:bg-white/20',
    caption: 'text-faint',
  },
}

// A big globe with the pitch written on top of it. The sphere is sized so the text always sits
// inside the disc (on phones the globe is wider than the screen), which keeps the text readable.
// In the white look the section is black and slides up under the floating navbar, so there is no
// light strip above it.
function Hero() {
  const [params] = useSearchParams()
  const lookName = params.get('globe') === 'black' ? 'black' : 'white'
  const look = HERO_LOOKS[lookName]
  return (
    <section className={`relative overflow-hidden ${look.section}`}>
      <div className="relative mx-auto flex max-w-6xl justify-center">
        <div className="relative -mt-4 w-[min(200vw,1180px)] shrink-0 sm:-mt-10">
          <div className={`absolute inset-[12%] rounded-full blur-3xl ${look.halo}`} />
          <Globe tone={lookName === 'black' ? 'dark' : 'light'} />
          {/* Calmer area behind the words (upper half, where the text sits), so the dots never fight the text. */}
          <div className={`pointer-events-none absolute inset-[11%] rounded-full ${look.shade}`} />
        </div>

        {/* Text layer: clicks pass through to the globe (so it can still be dragged) except on the buttons. */}
        <div className={`pointer-events-none absolute inset-0 flex flex-col items-center justify-start px-6 pt-[40%] sm:pt-[22%] lg:pt-[19%] text-center ${look.text}`}>
          <p className={`font-mono text-[0.75rem] uppercase tracking-[0.12em] sm:text-[0.85rem] ${look.eyebrow}`}>AI flat finder · Bengaluru</p>
          <h1 className={`mt-5 max-w-[16ch] font-display sm:max-w-none text-[2.6rem] leading-[0.95] tracking-[-0.015em] sm:text-[4.2rem] lg:text-[5.2rem] ${look.shadow}`}>
            Tell the AI how you live. <br className="hidden sm:block" />
            <em className={look.em}>It finds the flat.</em>
          </h1>
          <p className={`mt-5 max-w-[30rem] text-[0.95rem] leading-relaxed sm:text-[1.05rem] ${look.line}`}>
            Say where you work and what you need. It shows the flats that fit, why they fit, and whether the rent is fair.
          </p>
          <div className="pointer-events-auto mt-10 flex flex-wrap items-center justify-center gap-3 sm:mt-12 sm:gap-4">
            <Link to="/match" className="inline-flex items-center gap-2 rounded-full bg-signal px-7 py-3.5 text-[1.05rem] font-medium text-white sm:px-9 sm:py-4 sm:text-lg shadow-[0_10px_30px_-10px_rgb(30_79_255/0.9)] transition hover:bg-signal-deep">
              Ask the AI <ArrowRight size={20} />
            </Link>
            <Link to="/rent-check" className={`inline-flex items-center gap-2 rounded-full border px-7 py-3.5 text-[1.05rem] font-medium sm:px-9 sm:py-4 sm:text-lg backdrop-blur transition ${look.second}`}>
              Check a rent
            </Link>
          </div>
        </div>

        {NOTES.map((n) => (
          <div key={n.label} className={`glass absolute hidden rounded-2xl !bg-white/80 px-3.5 py-2.5 text-left xl:block ${n.className}`}>
            <p className="eyebrow !text-[0.62rem]">{n.label}</p>
            <p className="mt-0.5 text-sm font-medium">{n.value}</p>
          </div>
        ))}
      </div>
      <p className={`relative -mt-6 pb-10 text-center font-mono text-[0.7rem] sm:-mt-12 ${look.caption}`}>Drag the globe · Arcs: where Bengaluru's newcomers come from</p>
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

// Real Fair Rent Check results for these offers in the demo data (median, middle half, full range).
// `count` is how many similar flats the check compared; `bhk` is used in the captions.
const RENT_EXAMPLES = [
  { flat: '2BHK · HSR Layout', bhk: '2BHKs', count: 7, asked: 48000, median: 42000, low: 33250, high: 46500, min: 27500, max: 49500 },
  { flat: '1BHK · Indiranagar', bhk: '1BHKs', count: 17, asked: 30000, median: 22000, low: 18500, high: 28000, min: 15500, max: 35000 },
  { flat: '2BHK · Whitefield', bhk: '2BHKs', count: 10, asked: 30000, median: 30750, low: 28250, high: 36125, min: 21500, max: 39500 },
  { flat: '1BHK · Electronic City', bhk: '1BHKs', count: 6, asked: 14000, median: 24500, low: 22500, high: 25750, min: 14500, max: 28000 },
]
const LEVEL_STYLE = {
  low: { badge: 'bg-good/10 text-good', dot: 'bg-good', text: (d) => `${Math.abs(d)}% below median` },
  fair: { badge: 'bg-good/10 text-good', dot: 'bg-good', text: () => 'Fair price' },
  slightly_high: { badge: 'bg-warn/10 text-warn', dot: 'bg-warn', text: (d) => `${d}% above median` },
  high: { badge: 'bg-bad/10 text-bad', dot: 'bg-bad', text: (d) => `${d}% above median` },
}
const k = (n) => `₹${Number((n / 1000).toFixed(1))}k`

// Same bands as the server's verdict (server/src/lib/fairRent.js).
const levelFor = (diff) => (diff <= -10 ? 'low' : diff <= 10 ? 'fair' : diff <= 25 ? 'slightly_high' : 'high')

const inr = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`
// How long each step of the story stays on screen.
const STEP_MS = [1500, 1800, 2000, 3200]

// What the story says at each step for one example.
function caption(ex, step, target) {
  const diff = Math.round(((ex.asked - ex.median) / ex.median) * 100)
  const level = levelFor(diff)
  if (step === 0) return `The broker asks ${inr(ex.asked)} a month.`
  if (step === 1) return `${ex.count} similar ${ex.bhk} nearby rent for ${k(ex.low)} to ${k(ex.high)}.`
  if (step === 2) return `Their median is ${inr(ex.median)}, so this is ${level === 'fair' ? 'about right' : `${Math.abs(diff)}% ${diff > 0 ? 'above' : 'below'} it`}.`
  if (level === 'fair') return 'A fair price. Negotiate the deposit, not the rent.'
  if (level === 'low') return "Well below similar flats. Ask what's missing before you pay."
  return `Counter at ${inr(target)}: you save ${inr(ex.asked - target)} a month, ${inr((ex.asked - target) * 12)} a year.`
}

function tryCaption(value, median) {
  const gap = value - median
  if (Math.abs(gap / median) <= 0.1) return `At ${inr(value)}: within 10% of the median, a fair price.`
  return `At ${inr(value)}: ${inr(Math.abs(gap))} a month ${gap > 0 ? 'above' : 'below'} the median, ${inr(Math.abs(gap) * 12)} a year.`
}

// Tells the story of one rent check, step by step: the quote, the range of similar flats, the median,
// then what to do about it (with the yearly saving). It loops through four real checks.
// Moving the cursor (or a finger) along the bar tries your own price instead.
function RentPreview() {
  const [index, setIndex] = useState(0)
  const reduceMotion = useReducedMotion()
  const [step, setStep] = useState(reduceMotion ? 3 : 0)
  const [tryRent, setTryRent] = useState(null) // the rent under the cursor, or null when not interacting
  const interacting = tryRent !== null

  useEffect(() => {
    if (interacting || reduceMotion) return
    const id = setTimeout(() => {
      if (step < STEP_MS.length - 1) setStep(step + 1)
      else {
        setStep(0)
        setIndex((i) => (i + 1) % RENT_EXAMPLES.length)
      }
    }, STEP_MS[step])
    return () => clearTimeout(id)
  }, [step, interacting, reduceMotion])

  const ex = RENT_EXAMPLES[index]
  // A little room either side of the real range, so you can try prices beyond it.
  const lo = Math.floor((Math.min(ex.min, ex.asked) * 0.9) / 1000) * 1000
  const hi = Math.ceil((Math.max(ex.max, ex.asked) * 1.1) / 1000) * 1000
  // The counter-offer, as the real check works it out: the median, never above what was asked.
  const target = Math.min(ex.asked, Math.round(ex.median / 500) * 500)
  const askedLevel = levelFor(Math.round(((ex.asked - ex.median) / ex.median) * 100))
  const countering = !interacting && step === 3 && (askedLevel === 'high' || askedLevel === 'slightly_high')
  const shown = interacting ? tryRent : countering ? target : ex.asked
  const diff = Math.round(((shown - ex.median) / ex.median) * 100)
  const style = LEVEL_STYLE[levelFor(diff)]
  const showBand = interacting || step >= 1
  const showVerdict = interacting || step >= 2
  const pos = (v) => `${((v - lo) / (hi - lo)) * 100}%`
  const glide = 'transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]'
  const text = interacting ? tryCaption(tryRent, ex.median) : caption(ex, step, target)

  const follow = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width))
    setTryRent(Math.round((lo + ratio * (hi - lo)) / 500) * 500)
  }

  return (
    <div className="mt-6 glass-inset rounded-2xl p-4">
      <div className="flex items-center justify-between gap-3 text-sm">
        <motion.span key={ex.flat} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="text-ink-2">{ex.flat}</motion.span>
        <span className={`rounded-full px-2 py-0.5 font-mono text-[0.7rem] transition-colors duration-300 ${showVerdict ? style.badge : 'bg-ink/[.05] text-muted'}`}>
          {!showVerdict ? 'checking…' : countering ? 'your counter is fair' : style.text(diff)}
        </span>
      </div>

      {/* Tall invisible hit area around the thin bar; taps here try a price instead of opening the page. */}
      <div
        className="relative -mx-1 mt-2 cursor-ew-resize touch-pan-y px-1 py-3"
        onPointerMove={follow}
        onPointerDown={follow}
        onPointerLeave={() => setTryRent(null)}
        onClick={(e) => e.preventDefault()}
        role="slider"
        aria-label={`Try an asked rent for ${ex.flat}`}
        aria-valuemin={lo}
        aria-valuemax={hi}
        aria-valuenow={shown}
        aria-valuetext={`₹${shown.toLocaleString('en-IN')}, ${style.text(diff)}`}
      >
        <div className="relative h-2 rounded-full bg-ink/[.07]">
          {/* Range of similar flats (middle half) grows in from the median. */}
          <div
            className={`absolute inset-y-0 origin-center rounded-full bg-signal/35 ${glide} ${showBand ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0'}`}
            style={{ left: pos(ex.low), width: `calc(${pos(ex.high)} - ${pos(ex.low)})` }}
          />
          <div className={`absolute -inset-y-1.5 w-0.5 bg-ink ${glide} ${showVerdict ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'}`} style={{ left: pos(ex.median) }} />
          {/* Where the broker started, left behind as an outline once we counter. */}
          {countering && <div className="absolute -top-1.5 size-5 -translate-x-1/2 rounded-full border-2 border-dashed border-ink/30" style={{ left: pos(ex.asked) }} />}
          <div
            className={`absolute -top-1.5 size-5 -translate-x-1/2 rounded-full border-2 border-white shadow ${showVerdict ? style.dot : 'bg-ink-2'} ${interacting ? 'scale-110 transition-colors' : glide}`}
            style={{ left: pos(shown) }}
          />
        </div>
      </div>

      <div className="mt-1 flex justify-between font-mono text-[0.68rem] text-muted">
        <span>{k(lo)}</span>
        <span>{k(hi)}</span>
      </div>
      <motion.p
        key={`${index}-${step}-${interacting}`}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mt-2 min-h-[2.6em] text-[0.88rem] leading-snug text-ink"
        aria-live="polite"
      >
        {text}
      </motion.p>
      <div className="mt-2 flex items-center gap-1.5">
        {STEP_MS.map((_, i) => (
          <span key={i} aria-hidden="true" className={`h-1 rounded-full transition-all duration-500 ${!interacting && i <= step ? 'w-5 bg-signal' : 'w-3 bg-ink/15'}`} />
        ))}
        <span className="ml-auto font-mono text-[0.62rem] text-faint">{interacting ? 'your price' : 'or move over the bar'}</span>
      </div>
    </div>
  )
}

function ComparePreview() {
  const rows = [['Monthly', '₹18,000', '₹21,500'], ['Deposit', '3 mo', '2 mo'], ['Metro', '1.2 km', '0.8 km']]
  return (
    <div className="mt-6 overflow-hidden glass-inset rounded-2xl text-sm">
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
          <div className="mt-6 flex items-center gap-4 glass-inset rounded-2xl p-4">
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

// The numbers below are what the real Fair Rent Check returns for this offer in the demo data.
const ANSWER_ROWS = [
  { icon: HomeIcon, label: 'Rent asked', value: '₹48,000', delta: '14%', fill: 1, tone: 'bg-warn' },
  { icon: Building2, label: 'Median nearby', value: '₹42,000', fill: 0.875, tone: 'bg-ink/25' },
  { icon: Wallet, label: 'Deposit asked', value: '10 mo', delta: '+7', fill: 1, tone: 'bg-warn' },
  { icon: PiggyBank, label: 'Usual deposit', value: '3 mo', fill: 0.3, tone: 'bg-ink/25' },
]

function AnswerRow({ icon: Icon, label, value, delta, fill, tone, index }) {
  return (
    <li className="border-b border-ink/[.07] px-3 py-3 last:border-0 sm:px-3.5">
      <div className="flex items-center gap-3 text-[0.85rem]">
        <span className="grid size-7 shrink-0 place-items-center rounded-lg border border-ink/10 text-ink-2"><Icon size={14} /></span>
        <span className="flex-1 text-ink">{label}</span>
        <span className="font-mono text-ink-2">{value}</span>
        {delta && <span className="w-11 text-right font-mono text-[0.72rem] text-bad">↗ {delta}</span>}
        {!delta && <span className="w-11" />}
      </div>
      <div className="ml-10 mt-2 h-1.5 overflow-hidden rounded-full bg-ink/[.06]">
        <motion.div
          className={`h-full origin-left rounded-full ${tone}`}
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: fill }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.9, delay: 0.15 + index * 0.12, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </li>
  )
}

// Compact: question on the left, the answer card on the right (stacked on phones).
function AskAnything() {
  return (
    <section className="mx-auto max-w-6xl px-5 sm:px-8">
      <div className="relative overflow-hidden rounded-[2rem] bg-ink px-4 py-10 text-porcelain sm:px-10 sm:py-12">
        <div className="absolute -right-24 -top-24 size-96 rounded-full bg-signal/35 blur-[110px]" />
        <div className="absolute -bottom-32 -left-20 size-80 rounded-full bg-signal/20 blur-[110px]" />

        <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_25rem] lg:gap-14">
          <div className="text-center lg:text-left">
            <svg viewBox="0 0 24 24" className="mx-auto size-6 text-[#8ea6ff] lg:mx-0" aria-hidden="true">
              <path fill="currentColor" d="M12 1.5c.5 5.6 4.9 10 10.5 10.5-5.6.5-10 4.9-10.5 10.5C11.5 16.9 7.1 12.5 1.5 12 7.1 11.5 11.5 7.1 12 1.5Z" />
            </svg>
            <h2 className="mt-3 font-display text-[2.8rem] italic leading-none sm:text-[3.4rem]">Ask anything</h2>
            <p className="mx-auto mt-3 max-w-[24rem] text-[0.92rem] leading-relaxed text-porcelain/60 lg:mx-0">
              Clear answers about rent, deposits and commutes, worked out from real flats and the Bengaluru metro map.
            </p>
            <Link
              to="/rent-check"
              className="mx-auto mt-6 flex max-w-[25rem] items-center gap-3 rounded-full bg-white py-2 pl-4 pr-2 text-left text-[0.86rem] text-ink shadow-[0_20px_50px_-20px_rgb(0_0_0/0.6)] transition hover:shadow-[0_20px_50px_-12px_rgb(30_79_255/0.55)] sm:pl-5 sm:text-[0.92rem] lg:mx-0"
            >
              <span className="flex-1">Is ₹48,000 fair for a 2BHK in HSR?</span>
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-ink text-white"><ArrowUp size={17} /></span>
            </Link>
          </div>

          <div className="rounded-3xl bg-white p-4 text-left text-ink shadow-[0_30px_60px_-30px_rgb(0_0_0/0.7)] sm:p-5">
            <p className="font-semibold">This rent is 14% above similar flats</p>
            <p className="mt-1 text-[0.85rem] leading-snug text-ink-2">
              Seven 2BHKs in and around HSR Layout have a median rent of ₹42,000, and the deposit is more than three times the usual.
            </p>
            <ul className="mt-4 rounded-2xl border border-ink/10">
              {ANSWER_ROWS.map((row, i) => <AnswerRow key={row.label} {...row} index={i} />)}
            </ul>
            <p className="mt-3 flex gap-2.5 rounded-2xl border border-ink/10 bg-porcelain/60 px-3.5 py-3 text-[0.82rem] leading-snug text-ink-2">
              <Lightbulb size={15} className="mt-0.5 shrink-0 text-signal" />
              Counter with ₹42,000 rent and a 3-month deposit. A polite message is ready to copy.
            </p>
            <p className="mt-3 border-t border-ink/[.07] pt-3 text-[0.7rem] text-faint">
              Based on the sample listings in this demo. Distances are straight-line.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

const FAQ_GROUPS = [
  {
    name: 'Finding a flat',
    items: [
      ['Are these real listings?', 'No. The 120 flats and the brokers are sample data made for this demo. The map, the 82 Namma Metro stations, the tech parks and every distance are real (from OpenStreetMap).'],
      ['Which parts of Bengaluru does it cover?', '25 neighbourhoods, from Yelahanka and Hebbal in the north to Electronic City in the south, and from Whitefield in the east to Vijayanagar in the west. Distances are worked out to six tech parks: Manyata, ITPL Whitefield, Electronic City, Bagmane, Embassy Tech Village and Prestige Tech Park.'],
      ['Can I type in Hindi or Hinglish?', 'Yes. Write the way you would text a friend, in English, Hindi or Hinglish, and the assistant replies in the same language.'],
      ['How do you know if a rent is fair?', 'Your quote is compared with flats of the same size in the same area. If there are too few, nearby areas within 4 km, then 8 km, are added, and you are told how wide it looked. You get the median, the usual range and a fair counter-offer.'],
      ['What deposit is normal in Bengaluru?', "Many owners accept two to six months' rent. NestFinder flags a deposit above six months, or above what similar flats nearby ask, and suggests what to counter with."],
      ['Are the commute distances real travel times?', 'No. They are straight-line distances in kilometres, so treat them as a guide. The road distance is longer, and peak-hour traffic can make the same trip take twice as long.'],
      ['How do I contact a broker or book a visit?', 'Open a flat and use "Contact the broker". Tick "I want to visit" to pick a date within the next 60 days, and the broker sees it on their dashboard. The brokers here are sample accounts, so a dummy number is fine.'],
      ['Is my shortlist saved?', 'Yes, in your browser, with no login needed. You can shortlist up to four flats. Clearing your browser data or switching device starts a fresh list.'],
      ['Does it cost anything?', 'No. There is no sign-up for flat seekers and no brokerage. It is a portfolio project.'],
    ],
  },
  {
    name: 'Data and AI',
    items: [
      ['How is the match score worked out?', 'From fixed rules, not a guess. Budget, commute, metro, pets, tenant type and a few comforts each carry a weight, and anything you did not mention is left out. A flat that breaks a dealbreaker, like no pets when you have one, cannot score above 40%. The AI only turns your words into preferences and explains the result.'],
      ['Which AI does it use?', 'An open model (gpt-oss-120b) served by Groq. It reads your message, writes the replies and drafts counter-offers. Match scores and rent verdicts never come from the model; they come from rules in the code.'],
      ['Can the AI make things up?', 'It only sees the facts passed to it for each answer, and when comparing it can only pick from your own shortlist. It can still word something badly, which is why every flat shows the reasons behind its score.'],
      ['How does Compare pick one flat?', 'It weighs your preferences first, then value for money, the metro walk and the deposit. You get three reasons with real numbers, when the runner-up would be the better choice, and one thing to check before you pay.'],
      ['What happens to my phone number?', 'An enquiry goes only to the broker of that flat. On the shared demo broker account, visitor numbers are masked, and numbers are removed before anything is sent to the AI monitoring tools.'],
      ['Where does the map data come from?', 'OpenStreetMap. The metro stations, neighbourhoods and tech parks were pulled from its open data. Map © OpenStreetMap contributors.'],
    ],
  },
  {
    name: 'For brokers',
    items: [
      ['Can I list my flats here?', 'Yes. Create a broker account and add a flat with its area, rent and details. The nearest metro and the distance to every tech park are worked out for you.'],
      ['How do I hear about new leads?', 'Every enquiry and visit booking shows on your dashboard, where you can mark it contacted, visit booked or closed. Turn on browser notifications to hear about a new lead straight away, even with the site closed.'],
      ['Can I try it without signing up?', 'Yes. Use the demo broker login on the "For brokers" page. Demo data resets regularly, and visitors\' numbers are masked on that shared account.'],
    ],
  },
]

// Native <details> keeps each answer accessible and working without JavaScript; tabs pick the group.
function Faq() {
  const [group, setGroup] = useState(0)
  const { items } = FAQ_GROUPS[group]

  return (
    <section className="mx-auto max-w-6xl px-5 pt-28 sm:px-8" aria-labelledby="faq-title">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr] lg:gap-16">
        <div>
          <p className="eyebrow">FAQ</p>
          <h2 id="faq-title" className="mt-3 font-display text-4xl leading-[1.02] sm:text-5xl">Questions people ask first.</h2>
          <p className="mt-4 max-w-xs text-[0.95rem] leading-relaxed text-ink-2">Something else on your mind? Ask the assistant; it knows the flats better than this page does.</p>
          <div className="mt-8 flex flex-wrap gap-2 lg:flex-col lg:items-start" role="tablist" aria-label="FAQ topics">
            {FAQ_GROUPS.map((g, i) => (
              <button
                key={g.name}
                type="button"
                role="tab"
                aria-selected={group === i}
                onClick={() => setGroup(i)}
                className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-[0.9rem] transition ${
                  group === i ? 'bg-ink text-porcelain' : 'text-ink-2 hover:bg-ink/[.05] hover:text-ink'
                }`}
              >
                {g.name}
                <span className={`font-mono text-[0.7rem] ${group === i ? 'text-porcelain/60' : 'text-faint'}`}>{g.items.length}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="border-t border-ink/10" role="tabpanel" aria-label={FAQ_GROUPS[group].name}>
          {items.map(([q, a]) => (
            <details key={q} className="group border-b border-ink/10">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-[1.05rem] font-medium marker:hidden [&::-webkit-details-marker]:hidden">
                {q}
                <span className="relative size-4 shrink-0 text-muted transition group-open:rotate-45" aria-hidden="true">
                  <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-current" />
                  <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-current" />
                </span>
              </summary>
              <p className="max-w-2xl pb-6 pr-10 text-[0.95rem] leading-relaxed text-ink-2">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

function Closing() {
  return (
    <section className="mx-auto max-w-6xl px-5 pb-4 pt-28 text-center sm:px-8">
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
      <AskAnything />
      <Faq />
      <Closing />
    </main>
  )
}
