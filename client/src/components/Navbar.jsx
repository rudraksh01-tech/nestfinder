import { Link, NavLink } from 'react-router-dom'
import { Home as HomeIcon } from 'lucide-react'

const linkClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-semibold transition ${isActive ? 'bg-white/10 text-white' : 'text-slate-300 hover:text-white'}`

export default function Navbar() {
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-ink/70 backdrop-blur-lg">
      <nav className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3 sm:px-6">
        <Link to="/" className="mr-auto flex items-center gap-2 text-lg font-extrabold text-white">
          <span className="grid size-8 place-items-center rounded-lg bg-violet">
            <HomeIcon size={18} />
          </span>
          NestFinder
        </Link>
        <NavLink to="/flats" className={linkClass}>Browse flats</NavLink>
        <span
          className="hidden rounded-full border border-amber/40 px-2.5 py-1 text-xs font-semibold text-amber sm:inline"
          title="All listings are sample data for a portfolio demo"
        >
          Demo data
        </span>
      </nav>
    </header>
  )
}
