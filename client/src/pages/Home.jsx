import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowRight, ArrowUp, ArrowUpRight, Building2, Home as HomeIcon, Lightbulb, PiggyBank, Wallet } from 'lucide-react'
import Globe from '../components/Globe.jsx'
import PhoneStory from '../components/home/PhoneStory.jsx'

// Little floating notes either side of the globe: real distances from the demo data.
const NOTES = [
  { label: 'Manyata Tech Park', value: '2.4 km from a Hebbal 1BHK', className: 'left-0 top-[20%]' },
  { label: 'Purple line', value: 'Indiranagar · 0.5 km', className: 'left-[3%] bottom-[22%]' },
  { label: 'Deposit check', value: '10 months? Ask for 3', className: 'right-0 top-[44%]' },
]

// A big globe with the pitch written on top of it. The sphere is sized so the text always sits
// inside the navy disc (on phones the globe is wider than the screen), which keeps light text readable.
function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="relative mx-auto flex max-w-6xl justify-center">
        <div className="relative -mt-4 w-[min(190vw,1060px)] shrink-0 sm:-mt-10">
          <div className="absolute inset-[12%] rounded-full bg-signal/25 blur-3xl" />
          <Globe />
          {/* Darker centre behind the words, so the dots never fight the text. */}
          <div className="pointer-events-none absolute inset-[13%] rounded-full bg-[radial-gradient(circle,rgb(13_19_33/0.88)_32%,rgb(13_19_33/0.55)_52%,rgb(13_19_33/0)_72%)]" />
        </div>

        {/* Text layer: clicks pass through to the globe (so it can still be dragged) except on the buttons. */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-porcelain">
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.08em] text-porcelain/60">AI flat finder · Bengaluru</p>
          <h1 className="mt-4 max-w-[17ch] font-display text-[2.8rem] leading-[0.98] tracking-[-0.015em] [text-shadow:0_2px_24px_rgb(13_19_33/0.6)] sm:text-[4.2rem] lg:text-[4.8rem]">
            Tell the AI how you live. <em className="text-[#9db3ff]">It finds the flat.</em>
          </h1>
          <p className="mt-5 max-w-[30rem] text-[0.98rem] leading-relaxed text-porcelain/80 sm:text-[1.05rem]">
            Type your office, budget and needs in plain words. The AI matches you to flats and checks if the rent is fair.
          </p>
          <div className="pointer-events-auto mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link to="/match" className="inline-flex items-center gap-2 rounded-full bg-signal px-6 py-3 font-medium text-white shadow-[0_10px_30px_-10px_rgb(30_79_255/0.9)] transition hover:bg-signal-deep">
              Ask the AI <ArrowRight size={18} />
            </Link>
            <Link to="/rent-check" className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-6 py-3 font-medium text-porcelain backdrop-blur transition hover:bg-white/20">
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
      <p className="relative -mt-6 pb-10 text-center font-mono text-[0.7rem] text-faint sm:-mt-12">Drag the globe · Arcs: where Bengaluru's newcomers come from</p>
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

const FAQS = [
  ['Are these real listings?', 'No. The 120 flats and the brokers are sample data made for this demo. The map, the 82 Namma Metro stations, the tech parks and every distance are real (from OpenStreetMap).'],
  ['How is the match score worked out?', 'From fixed rules, not a guess. Budget, commute, metro, pets, tenant type and a few comforts each carry a weight, and anything you did not mention is left out. A flat that breaks a dealbreaker, like no pets when you have one, cannot score above 40%. The AI only turns your words into preferences and explains the result.'],
  ['Can I type in Hindi or Hinglish?', 'Yes. Write the way you would text a friend, in English, Hindi or Hinglish, and the assistant replies in the same language.'],
  ['How do you know if a rent is fair?', 'Your quote is compared with flats of the same size in the same area. If there are too few, nearby areas within 4 km, then 8 km, are added, and you are told how wide it looked. You get the median, the usual range and a fair counter-offer.'],
  ['What happens to my phone number?', 'An enquiry goes only to the broker of that flat. On the shared demo broker account, visitor numbers are masked, and numbers are removed before anything is sent to the AI monitoring tools.'],
  ['Does it cost anything?', 'No. There is no sign-up for flat seekers and no brokerage. It is a portfolio project.'],
]

// Native <details> keeps it accessible and works without JavaScript.
function Faq() {
  return (
    <section className="mx-auto max-w-6xl px-5 pt-28 sm:px-8" aria-labelledby="faq-title">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr] lg:gap-16">
        <div>
          <p className="eyebrow">FAQ</p>
          <h2 id="faq-title" className="mt-3 font-display text-4xl leading-[1.02] sm:text-5xl">Questions people ask first.</h2>
          <p className="mt-4 max-w-xs text-[0.95rem] leading-relaxed text-ink-2">Something else on your mind? Ask the assistant; it knows the flats better than this page does.</p>
        </div>
        <div className="border-t border-ink/10">
          {FAQS.map(([q, a]) => (
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
      <AskAnything />
      <Faq />
      <Closing />
    </main>
  )
}
