import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

// Shows the page only to a logged-in broker; otherwise sends them to login and back afterwards.
export default function RequireBroker({ children }) {
  const { broker, checking } = useAuth()
  const location = useLocation()
  if (checking) return <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6"><div className="glass h-64 animate-pulse rounded-2xl" /></main>
  if (!broker) return <Navigate to="/broker/login" replace state={{ from: location.pathname + location.search }} />
  return children
}
