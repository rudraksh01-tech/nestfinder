import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, SearchX, SlidersHorizontal } from 'lucide-react'
import Filters from '../components/Filters.jsx'
import ListingCard from '../components/ListingCard.jsx'
import { useFetch } from '../lib/useFetch.js'

const SORTS = [
  ['rent_asc', 'Rent: low to high'],
  ['rent_desc', 'Rent: high to low'],
  ['metro', 'Closest to metro'],
  ['newest', 'Available soonest'],
]

export default function Listings() {
  const [params, setParams] = useSearchParams()
  const [showFilters, setShowFilters] = useState(false) // mobile only; always visible on large screens
  const { data: meta } = useFetch('/api/listings/meta')
  // Refetches whenever the URL query changes; previous results stay on screen (dimmed) meanwhile.
  const { data, error, loading } = useFetch(`/api/listings?${params}`)

  // Changing any filter goes back to page 1.
  const set = (key, value) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key !== 'page') next.delete('page')
    setParams(next)
  }

  const page = data?.page ?? 1
  const activeFilters = [...params.keys()].filter((k) => k !== 'sort' && k !== 'page').length

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="page-title text-4xl sm:text-5xl">Flats in Bengaluru</h1>
      <p className="mt-1 text-sm text-muted">Sample listings for a demo. Distances are straight-line and approximate.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
        <div>
          <button
            type="button"
            aria-expanded={showFilters}
            onClick={() => setShowFilters((v) => !v)}
            className="glass flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-ink lg:hidden"
          >
            <SlidersHorizontal size={16} /> {showFilters ? 'Hide filters' : 'Filters'}
            {activeFilters > 0 && <span className="rounded-full bg-signal px-2 text-xs">{activeFilters}</span>}
          </button>
          <div className={`${showFilters ? 'mt-3 block' : 'hidden'} lg:mt-0 lg:block`}>
            <Filters meta={meta} params={params} set={set} onReset={() => setParams({})} />
          </div>
        </div>

        <section aria-live="polite">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-ink-2">
              {data ? <><strong className="text-ink">{data.total}</strong> flats found</> : ' '}
            </p>
            <label className="flex items-center gap-2 text-sm text-muted">
              Sort
              <select
                className="rounded-lg border border-ink/10 bg-paper/80 px-3 py-1.5 text-sm text-ink outline-none focus:border-signal-soft"
                value={params.get('sort') ?? 'rent_asc'}
                onChange={(e) => set('sort', e.target.value)}
              >
                {SORTS.map(([v, text]) => <option key={v} value={v}>{text}</option>)}
              </select>
            </label>
          </div>

          {error && <p className="glass rounded-2xl p-6 text-warn">Could not load flats: {error}</p>}

          {!error && data?.total === 0 && (
            <div className="glass flex flex-col items-center rounded-2xl p-10 text-center">
              <SearchX className="text-muted" size={32} />
              <p className="mt-3 font-semibold text-ink">No flats match these filters</p>
              <p className="mt-1 text-sm text-muted">Try a higher budget or a wider distance.</p>
            </div>
          )}

          <div className={`grid gap-4 sm:grid-cols-2 xl:grid-cols-3 transition-opacity ${loading ? 'opacity-50' : ''}`}>
            {data?.items.map((l) => <ListingCard key={l.code} listing={l} />)}
            {!data && loading && Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="glass h-52 animate-pulse rounded-2xl" />
            ))}
          </div>

          {data?.pages > 1 && (
            <nav className="mt-6 flex items-center justify-center gap-3 text-sm" aria-label="Pagination">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => set('page', String(page - 1))}
                className="glass flex items-center gap-1 rounded-lg px-3 py-2 text-ink disabled:opacity-40"
              >
                <ChevronLeft size={16} /> Prev
              </button>
              <span className="text-muted">Page {page} of {data.pages}</span>
              <button
                type="button"
                disabled={page >= data.pages}
                onClick={() => set('page', String(page + 1))}
                className="glass flex items-center gap-1 rounded-lg px-3 py-2 text-ink disabled:opacity-40"
              >
                Next <ChevronRight size={16} />
              </button>
            </nav>
          )}
        </section>
      </div>
    </main>
  )
}
