import { Link } from 'react-router-dom'
import Logo from './Logo.jsx'

export default function Footer() {
  return (
    <footer className="mx-auto mt-16 max-w-6xl px-5 pb-10 sm:px-8">
      <div className="flex flex-col gap-8 border-t border-ink/10 pt-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-xs">
          <Logo />
          <p className="mt-3 text-sm leading-relaxed text-muted">
            A portfolio project. Listings and brokers are sample data; the map, metro stations and distances are real.
          </p>
        </div>
        <nav className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm" aria-label="Footer">
          <Link to="/match" className="text-ink-2 hover:text-ink">Match</Link>
          <Link to="/flats" className="text-ink-2 hover:text-ink">All flats</Link>
          <Link to="/rent-check" className="text-ink-2 hover:text-ink">Rent check</Link>
          <Link to="/compare" className="text-ink-2 hover:text-ink">Compare</Link>
          <Link to="/broker/login" className="text-ink-2 hover:text-ink">For brokers</Link>
        </nav>
      </div>
      <p className="mt-8 font-mono text-[0.7rem] text-faint">Map data © OpenStreetMap contributors · Made in Bengaluru</p>
    </footer>
  )
}
