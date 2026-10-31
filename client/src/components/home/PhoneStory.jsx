import { useRef, useState } from 'react'
import { motion, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react'
import { ArrowUp, BatteryFull, Signal, Wifi } from 'lucide-react'
import { LogoMark } from '../Logo.jsx'

// Scroll progress (0..1 across the tall section) drives everything, so scrolling back up
// plays it in reverse: the phone stands up and wakes on the way down, lies back and sleeps on the way up.
const STAND_UP = [0, 0.3]
const WAKE = [0.26, 0.36]
const LOCK = [0.3, 0.36, 0.44, 0.48]
const CHAT = [0.44, 0.5]

const STEPS = [
  { from: 0.36, title: 'Say it your way', text: 'English, Hindi or Hinglish. “Manyata me job, 25k, ek kutta hai” is a perfectly good search.' },
  { from: 0.6, title: 'Get reasons, not just results', text: 'Every flat is scored against your day, and the catch is spelled out: the deposit, the metro walk, the owner who says family only.' },
  { from: 0.8, title: 'Decide, then negotiate', text: 'Shortlist a few, compare them side by side, and get a polite counter-offer ready to send the broker.' },
]

// Sample matches from the demo data (same numbers the real assistant returns for this query).
const MATCHES = [
  { score: 86, area: 'Mahadevapura', bhk: 1, rent: '18,000', note: 'Metro 1.2 km · pets ok' },
  { score: 86, area: 'KR Puram', bhk: 2, rent: '21,500', note: 'Metro 0.8 km · pets ok' },
  { score: 82, area: 'Hebbal', bhk: 1, rent: '23,000', note: '2.4 km to Manyata' },
]

function Reveal({ progress, at, children, className = '' }) {
  const opacity = useTransform(progress, [at, at + 0.035], [0, 1])
  const y = useTransform(progress, [at, at + 0.035], [10, 0])
  return <motion.div style={{ opacity, y }} className={className}>{children}</motion.div>
}

function Typing({ progress }) {
  const opacity = useTransform(progress, [0.555, 0.575, 0.6, 0.615], [0, 1, 1, 0])
  return (
    <motion.div style={{ opacity }} className="flex w-fit gap-1 rounded-2xl rounded-bl-md bg-white px-3 py-2.5 shadow-sm">
      {[0, 1, 2].map((i) => (
        <span key={i} className="size-1.5 animate-bounce rounded-full bg-faint" style={{ animationDelay: `${i * 120}ms` }} />
      ))}
    </motion.div>
  )
}

function Screen({ progress }) {
  const off = useTransform(progress, WAKE, [1, 0])
  const lock = useTransform(progress, LOCK, [0, 1, 1, 0])
  const chat = useTransform(progress, CHAT, [0, 1])

  return (
    <div className="relative h-full overflow-hidden rounded-[2.4rem] bg-porcelain text-ink">
      {/* Wallpaper: the same soft blue as the site. */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_70%_at_80%_0%,rgb(30_79_255/0.22),transparent_60%),radial-gradient(90%_60%_at_0%_100%,rgb(14_143_99/0.12),transparent_60%)]" />

      {/* Status bar */}
      <div className="relative z-10 flex items-center justify-between px-7 pt-3.5 text-[11px] font-semibold">
        <span>9:41</span>
        <span className="flex items-center gap-1"><Signal size={12} /><Wifi size={12} /><BatteryFull size={14} /></span>
      </div>

      {/* Lock screen */}
      <motion.div style={{ opacity: lock }} className="absolute inset-0 flex flex-col items-center pt-16">
        <p className="text-[12px] font-medium text-ink-2">Saturday 31 October</p>
        <p className="font-display text-[84px] leading-none tracking-tight">9:41</p>
        <div className="glass mt-8 w-[86%] rounded-2xl p-3 text-left">
          <p className="flex items-center gap-1.5 text-[10px] text-muted"><LogoMark className="size-3.5" /> NESTFINDER · now</p>
          <p className="mt-1 text-[12px] font-semibold">3 flats match your commute</p>
          <p className="text-[11px] text-ink-2">Ask me anything about renting in Bengaluru.</p>
        </div>
      </motion.div>

      {/* Chat */}
      <motion.div style={{ opacity: chat }} className="absolute inset-0 flex flex-col pt-11">
        <div className="mx-3 flex items-center gap-2 rounded-2xl bg-white/70 px-3 py-2 backdrop-blur">
          <LogoMark className="size-7" />
          <div className="leading-tight">
            <p className="text-[12px] font-semibold">NestFinder</p>
            <p className="flex items-center gap-1 text-[10px] text-good"><span className="size-1.5 rounded-full bg-good" /> AI assistant</p>
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-end gap-2 px-3 pb-2 text-[11.5px] leading-snug">
          <Reveal progress={progress} at={0.47} className="w-[82%] rounded-2xl rounded-bl-md bg-white px-3 py-2 shadow-sm">
            Hi! You can ask me anything here: areas, rent, commute, deposits.
          </Reveal>
          <Reveal progress={progress} at={0.52} className="ml-auto w-[80%] rounded-2xl rounded-br-md bg-signal px-3 py-2 text-white">
            Manyata me job hai, 25k budget, ek kutta bhi hai
          </Reveal>
          {/* The typing dots sit in the reply's slot, so no gap is left once the reply arrives. */}
          <div className="relative">
            <Reveal progress={progress} at={0.61} className="w-[86%] rounded-2xl rounded-bl-md bg-white px-3 py-2 shadow-sm">
              Samajh gaya. These three fit your budget, commute and your dog:
            </Reveal>
            <div className="absolute left-0 top-0"><Typing progress={progress} /></div>
          </div>
          {MATCHES.map((m, i) => (
            <Reveal key={m.area} progress={progress} at={0.66 + i * 0.05} className="flex items-center gap-2.5 rounded-xl border border-ink/5 bg-white/90 px-2.5 py-2 shadow-sm">
              <span className={`grid size-9 shrink-0 place-items-center rounded-lg font-mono text-[11px] font-medium ${m.score >= 85 ? 'bg-good/10 text-good' : 'bg-signal/10 text-signal'}`}>{m.score}%</span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{m.bhk}BHK · {m.area}</span>
                <span className="block text-[10px] text-muted">{m.note}</span>
              </span>
              <span className="font-mono text-[11px]">₹{m.rent}</span>
            </Reveal>
          ))}
          <Reveal progress={progress} at={0.83} className="w-[82%] rounded-2xl rounded-bl-md bg-white px-3 py-2 shadow-sm">
            Want me to check if the Mahadevapura deposit is fair?
          </Reveal>
        </div>

        <div className="mx-3 mb-6 flex items-center gap-2 rounded-full border border-ink/10 bg-white px-3.5 py-2 text-[11px] text-faint">
          <span className="flex-1">Ask NestFinder anything…</span>
          <span className="grid size-6 place-items-center rounded-full bg-signal text-white"><ArrowUp size={13} /></span>
        </div>
      </motion.div>

      {/* Asleep: a black screen with a faint reflection. */}
      <motion.div style={{ opacity: off }} className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,#1a2133_0%,#05070d_55%,#0d1321_100%)]">
        <div className="absolute -left-1/4 top-0 h-full w-1/2 rotate-12 bg-white/[.04]" />
      </motion.div>
    </div>
  )
}

function Phone({ progress }) {
  const rotateZ = useTransform(progress, STAND_UP, [-90, 0])
  const rotateX = useTransform(progress, STAND_UP, [58, 0])
  const scale = useTransform(progress, STAND_UP, [0.82, 1])
  const y = useTransform(progress, STAND_UP, [70, 0])
  const glow = useTransform(progress, WAKE, [0, 1])

  return (
    <div className="relative grid place-items-center [perspective:1400px]">
      <motion.div style={{ opacity: glow }} className="absolute size-[30rem] rounded-full bg-signal/25 blur-[90px]" />
      <motion.div
        style={{ rotateZ, rotateX, scale, y }}
        className="relative h-[600px] w-[292px] rounded-[3rem] bg-[#0d1321] p-[10px] shadow-[0_50px_100px_-30px_rgb(13_19_33/0.55),0_0_0_1.5px_rgb(255_255_255/0.08)_inset]"
      >
        {/* Side buttons */}
        <span className="absolute -left-[3px] top-28 h-8 w-[3px] rounded-l bg-[#1f2738]" />
        <span className="absolute -left-[3px] top-40 h-14 w-[3px] rounded-l bg-[#1f2738]" />
        <span className="absolute -right-[3px] top-36 h-20 w-[3px] rounded-r bg-[#1f2738]" />
        <Screen progress={progress} />
        {/* Dynamic island */}
        <span className="absolute left-1/2 top-[18px] h-[26px] w-[92px] -translate-x-1/2 rounded-full bg-black" />
      </motion.div>
    </div>
  )
}

export default function PhoneStory() {
  const ref = useRef(null)
  const reduceMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const smooth = useSpring(scrollYProgress, { stiffness: 140, damping: 28, mass: 0.35 })
  // With reduced motion, show the finished state: phone upright, chat fully shown.
  const finished = useMotionValue(1)
  const progress = reduceMotion ? finished : smooth

  const [active, setActive] = useState(reduceMotion ? STEPS.length - 1 : -1)
  useMotionValueEvent(smooth, 'change', (v) => {
    if (reduceMotion) return
    const index = STEPS.findLastIndex((s) => v >= s.from)
    setActive((prev) => (prev === index ? prev : index))
  })
  const hint = useTransform(smooth, [0, 0.12], [1, 0])

  return (
    <section ref={ref} className={reduceMotion ? 'py-24' : 'relative h-[340vh]'} aria-label="How the assistant works">
      <div className={reduceMotion ? '' : 'sticky top-0 flex h-screen items-center overflow-hidden'}>
        <div className="mx-auto grid w-full max-w-6xl items-center gap-6 px-5 lg:grid-cols-[1fr_auto] lg:gap-16 sm:px-8">
          <div className="order-2 lg:order-1">
            <p className="eyebrow">02 · The assistant</p>
            <h2 className="mt-3 max-w-md font-display text-4xl leading-[1.02] sm:text-6xl">
              Ask it like you'd ask <em className="text-signal">a friend</em> who knows Bengaluru.
            </h2>
            <ol className="mt-8 hidden max-w-md space-y-6 lg:block">
              {STEPS.map((s, i) => (
                <li key={s.title} className={`grid grid-cols-[2.25rem_1fr] transition-opacity duration-500 ${active === i || reduceMotion ? 'opacity-100' : 'opacity-35'}`}>
                  <span className="font-mono text-xs text-muted">0{i + 1}</span>
                  <span>
                    <span className="block text-lg font-medium">{s.title}</span>
                    <span className="mt-1 block text-[0.95rem] leading-relaxed text-ink-2">{s.text}</span>
                  </span>
                </li>
              ))}
            </ol>
            {/* Phones get one line at a time under the heading. */}
            <p className="mt-4 min-h-[3rem] text-[0.95rem] leading-relaxed text-ink-2 lg:hidden">{active >= 0 ? STEPS[active].text : 'Keep scrolling to wake the phone.'}</p>
            {!reduceMotion && (
              <motion.p style={{ opacity: hint }} className="eyebrow mt-6 hidden lg:block">Scroll to wake it ↓</motion.p>
            )}
          </div>
          {/* Scaling does not shrink layout, so negative margins give back the space on small screens. */}
          <div className="order-1 -my-[84px] origin-center scale-[0.72] sm:-my-[45px] sm:scale-[0.85] lg:order-2 lg:my-0 lg:scale-100">
            <Phone progress={progress} />
          </div>
        </div>
      </div>
    </section>
  )
}
