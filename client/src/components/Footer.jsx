import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight } from 'lucide-react'

const LINKS = [
  ['/match', 'Match'],
  ['/rent-check', 'Rent check'],
  ['/compare', 'Compare'],
  ['/flats', 'All flats'],
  ['/broker/login', 'For brokers'],
]

const bengaluruTime = () =>
  new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' }).format(new Date())

// The local time in Bengaluru, updated every 20 seconds.
function LocalTime() {
  const [time, setTime] = useState(bengaluruTime)
  useEffect(() => {
    const id = setInterval(() => setTime(bengaluruTime()), 20000)
    return () => clearInterval(id)
  }, [])
  return <span className="tabular-nums">{time}</span>
}

// Light, editorial footer in the same serif as the hero, ending in a big cropped wordmark.
export default function Footer() {
  return (
    <footer className="mt-20 overflow-hidden border-t border-ink/10">
      <div className="mx-auto max-w-6xl px-5 pt-16 sm:px-8 sm:pt-20">
        <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr] lg:gap-20">
          <div>
            <p className="eyebrow">Before you sign anything</p>
            <p className="mt-4 max-w-xl font-display text-[2.3rem] leading-[1.04] sm:text-5xl">
              Ask the AI before you pay a deposit. <em className="text-signal">It doesn't charge brokerage.</em>
            </p>
            <Link to="/match" className="group mt-7 inline-flex items-center gap-2 border-b border-ink pb-1 font-medium transition hover:border-signal hover:text-signal">
              Ask the AI <ArrowRight size={17} className="transition group-hover:translate-x-0.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-8 text-[0.95rem] lg:pt-9">
            <nav aria-label="Footer">
              <p className="eyebrow">Pages</p>
              <ul className="mt-4 space-y-2">
                {LINKS.map(([to, label]) => (
                  <li key={to}>
                    <Link to={to} className="group inline-flex items-center gap-1 text-ink-2 transition hover:text-ink">
                      {label}
                      <ArrowUpRight size={13} className="opacity-0 transition group-hover:opacity-100" />
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <div>
              <p className="eyebrow">Right now</p>
              <ul className="mt-4 space-y-2 text-ink-2">
                <li className="whitespace-nowrap font-mono text-[0.8rem]">Bengaluru · <LocalTime /></li>
                <li className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-good" /> Assistant online</li>
                <li>120 flats, 25 areas</li>
                <li>82 metro stations</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-2 border-t border-ink/10 pt-5 text-[0.8rem] text-muted sm:flex-row sm:justify-between">
          <span>Designed and built by <span className="font-medium text-ink">Rudra Pratap Singh</span>. Sample listings, real map data © OpenStreetMap contributors.</span>
          <span>Made in Bengaluru, between two rent hikes.</span>
        </div>
      </div>

      {/* Big wordmark in the hero serif, cropped by the page edge on purpose. */}
      <p
        aria-hidden="true"
        className="mt-6 select-none whitespace-nowrap text-center font-display text-[23vw] leading-[0.82] tracking-[-0.03em] text-ink [margin-bottom:-0.04em] min-[1500px]:text-[21rem]"
      >
        Nestfinder<span className="text-signal">.</span>
      </p>
    </footer>
  )
}
