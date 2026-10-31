import { useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Heart, Home as HomeIcon, LogOut, Menu, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { useShortlist } from '../context/ShortlistContext.jsx'

const linkClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-semibold transition ${isActive ? 'bg-white/10 text-white' : 'text-slate-300 hover:text-white'}`

export default function Navbar() {
  const { broker, logout } = useAuth()
  const { codes } = useShortlist()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  // The mobile menu closes whenever the page changes: it is open only for the path it was opened on.
  const [openOn, setOpenOn] = useState(null)
  const open = openOn === pathname

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  const links = (
    <>
      <NavLink to="/match" className={linkClass}>Match</NavLink>
      <NavLink to="/rent-check" className={linkClass}>Rent check</NavLink>
      <NavLink to="/flats" end className={linkClass}>Flats</NavLink>
      <NavLink to="/compare" className={linkClass}>
        <span className="inline-flex items-center gap-1.5">
          Compare{codes.length > 0 && <span className="inline-flex items-center gap-0.5 rounded-full bg-pink-500/20 px-1.5 text-xs text-pink-300"><Heart size={10} fill="currentColor" />{codes.length}</span>}
        </span>
      </NavLink>
      {broker ? (
        <NavLink to="/broker" end className={linkClass}>Dashboard</NavLink>
      ) : (
        <NavLink to="/broker/login" className={linkClass}>For brokers</NavLink>
      )}
    </>
  )

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-ink/80 backdrop-blur-lg">
      <nav className="mx-auto flex max-w-6xl items-center gap-1 px-4 py-3 sm:px-6">
        <Link to="/" className="mr-auto flex items-center gap-2 text-lg font-extrabold text-white">
          <span className="grid size-8 place-items-center rounded-lg bg-violet">
            <HomeIcon size={18} />
          </span>
          NestFinder
        </Link>

        <div className="hidden items-center gap-1 lg:flex">{links}</div>
        {broker && (
          <button type="button" onClick={handleLogout} className="rounded-lg p-2 text-slate-300 hover:text-white" aria-label="Log out" title="Log out">
            <LogOut size={18} />
          </button>
        )}
        <span
          className="ml-1 hidden rounded-full border border-amber/40 px-2.5 py-1 text-xs font-semibold text-amber sm:inline"
          title="All listings are sample data for a portfolio demo"
        >
          Demo data
        </span>
        <button
          type="button"
          onClick={() => setOpenOn(open ? null : pathname)}
          className="rounded-lg p-2 text-slate-200 hover:bg-white/10 lg:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          aria-controls="mobile-menu"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>
      {open && (
        <div id="mobile-menu" className="mx-auto flex max-w-6xl flex-col gap-1 border-t border-white/10 px-4 py-3 lg:hidden">
          {links}
        </div>
      )}
    </header>
  )
}
