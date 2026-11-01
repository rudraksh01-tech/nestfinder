import { Link } from 'react-router-dom'

// Mark: a roof line over a pin dot, i.e. "a home, located". Kept as inline SVG so it stays crisp.
// Colours come from the theme tokens, so the mark inverts in the dark theme instead of disappearing.
export function LogoMark({ className = 'size-8' }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="9" className="fill-ink" />
      <path d="M8.5 15.5 16 9l7.5 6.5V23a1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1z" fill="none" className="stroke-porcelain" strokeWidth="2.2" strokeLinejoin="round" />
      <circle cx="16" cy="18.6" r="2.6" className="fill-signal" />
    </svg>
  )
}

export default function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5 text-ink" aria-label="NestFinder home">
      <LogoMark />
      <span className="text-[1.05rem] font-semibold tracking-tight">
        Nest<span className="font-display text-[1.2rem] font-normal italic tracking-normal">finder</span>
      </span>
    </Link>
  )
}
