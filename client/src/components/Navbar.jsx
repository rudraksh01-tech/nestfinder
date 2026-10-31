import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Home as HomeIcon, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

const linkClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-semibold transition ${isActive ? 'bg-white/10 text-white' : 'text-slate-300 hover:text-white'}`

export default function Navbar() {
  const { broker, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-ink/70 backdrop-blur-lg">
      <nav className="mx-auto flex max-w-6xl items-center gap-1 px-4 py-3 sm:gap-2 sm:px-6">
        <Link to="/" className="mr-auto flex items-center gap-2 text-lg font-extrabold text-white">
          <span className="grid size-8 place-items-center rounded-lg bg-violet">
            <HomeIcon size={18} />
          </span>
          NestFinder
        </Link>
        <NavLink to="/flats" className={linkClass}>Flats</NavLink>
        {broker ? (
          <>
            <NavLink to="/broker" end className={linkClass}>Dashboard</NavLink>
            <button type="button" onClick={handleLogout} className="rounded-lg p-2 text-slate-300 hover:text-white" aria-label="Log out" title="Log out">
              <LogOut size={18} />
            </button>
          </>
        ) : (
          <NavLink to="/broker/login" className={linkClass}>For brokers</NavLink>
        )}
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
