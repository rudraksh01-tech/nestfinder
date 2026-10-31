import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-24 text-center sm:px-6">
      <h1 className="page-title text-4xl sm:text-5xl">Page not found</h1>
      <Link to="/flats" className="mt-6 inline-block text-signal hover:underline">Browse flats</Link>
    </main>
  )
}
