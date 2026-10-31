import { useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { ArrowUpRight, Heart, LogOut, Menu, X } from 'lucide-react'
import Logo from './Logo.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useShortlist } from '../context/ShortlistContext.jsx'

const linkClass = ({ isActive }) =>
  `rounded-full px-3.5 py-1.5 text-[0.9rem] transition ${isActive ? 'bg-ink text-porcelain' : 'text-ink-2 hover:bg-ink/[.05] hover:text-ink'}`

// Floating glass bar. Below `lg` the links fold into a menu (they overflow a phone otherwise).
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
          Compare
          {codes.length > 0 && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-rose-500/15 px-1.5 font-mono text-[0.7rem] text-rose-600">
              <Heart size={9} fill="currentColor" />{codes.length}
            </span>
          )}
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
    <header className="sticky top-0 z-40 px-3 pt-3 sm:px-5">
      <nav className="glass mx-auto flex max-w-6xl items-center gap-1 rounded-full py-2 pl-4 pr-2">
        <div className="mr-auto"><Logo /></div>

        <div className="hidden items-center gap-0.5 lg:flex">{links}</div>
        {broker && (
          <button type="button" onClick={handleLogout} className="rounded-full p-2 text-ink-2 hover:bg-ink/[.05] hover:text-ink" aria-label="Log out" title="Log out">
            <LogOut size={17} />
          </button>
        )}
        <Link
          to="/match"
          className="ml-1 hidden items-center gap-1 rounded-full bg-signal px-4 py-2 text-[0.9rem] font-medium text-white transition hover:bg-signal-deep sm:inline-flex"
        >
          Find my match <ArrowUpRight size={15} />
        </Link>
        <button
          type="button"
          onClick={() => setOpenOn(open ? null : pathname)}
          className="rounded-full p-2 text-ink hover:bg-ink/[.06] lg:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          aria-controls="mobile-menu"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>
      {open && (
        <div id="mobile-menu" className="glass mx-auto mt-2 flex max-w-6xl flex-col gap-1 rounded-3xl p-3 lg:hidden">
          {links}
          <Link to="/match" className="mt-1 rounded-full bg-signal px-4 py-2 text-center text-[0.9rem] font-medium text-white sm:hidden">Find my match</Link>
        </div>
      )}
    </header>
  )
}
