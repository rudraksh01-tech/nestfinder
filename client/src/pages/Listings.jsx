import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, SearchX, SlidersHorizontal } from 'lucide-react'
import Filters from '../components/Filters.jsx'
import ListingCard from '../components/ListingCard.jsx'
import { getJson } from '../lib/api.js'

const SORTS = [
  ['rent_asc', 'Rent: low to high'],
  ['rent_desc', 'Rent: high to low'],
  ['metro', 'Closest to metro'],
  ['newest', 'Available soonest'],
]

export default function Listings() {
  const [params, setParams] = useSearchParams()
  const [meta, setMeta] = useState(null)
  const [showFilters, setShowFilters] = useState(false) // mobile only; always visible on large screens
  // `query` records which URL the data/error belongs to; a mismatch means we are loading.
  const [result, setResult] = useState({ query: null, error: null, data: null })

  useEffect(() => {
    const ctrl = new AbortController()
    getJson('/api/listings/meta', { signal: ctrl.signal }).then(setMeta).catch(() => {})
    return () => ctrl.abort()
  }, [])

  // Refetch whenever the URL query changes. Aborting stops an older, slower
  // response from overwriting a newer one when filters change quickly.
  const query = params.toString()
  useEffect(() => {
    const ctrl = new AbortController()
    getJson(`/api/listings?${query}`, { signal: ctrl.signal })
      .then((data) => setResult({ query, error: null, data }))
      .catch((err) => {
        if (err.name !== 'AbortError') setResult({ query, error: err.message, data: null })
      })
    return () => ctrl.abort()
  }, [query])

  // Changing any filter goes back to page 1.
  const set = (key, value) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key !== 'page') next.delete('page')
    setParams(next)
  }

  const loading = result.query !== query
  const error = loading ? null : result.error
  // Keep showing the previous results (dimmed) while the next page loads.
  const data = result.data
  const page = data?.page ?? 1
  const activeFilters = [...params.keys()].filter((k) => k !== 'sort' && k !== 'page').length

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-extrabold text-white">Flats in Bengaluru</h1>
      <p className="mt-1 text-sm text-slate-400">Sample listings for a demo. Distances are straight-line and approximate.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
        <div>
          <button
            type="button"
            aria-expanded={showFilters}
            onClick={() => setShowFilters((v) => !v)}
            className="glass flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white lg:hidden"
          >
            <SlidersHorizontal size={16} /> {showFilters ? 'Hide filters' : 'Filters'}
            {activeFilters > 0 && <span className="rounded-full bg-violet px-2 text-xs">{activeFilters}</span>}
          </button>
          <div className={`${showFilters ? 'mt-3 block' : 'hidden'} lg:mt-0 lg:block`}>
            <Filters meta={meta} params={params} set={set} onReset={() => setParams({})} />
          </div>
        </div>

        <section aria-live="polite">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-300">
              {data ? <><strong className="text-white">{data.total}</strong> flats found</> : ' '}
            </p>
            <label className="flex items-center gap-2 text-sm text-slate-400">
              Sort
              <select
                className="rounded-lg border border-white/10 bg-ink-2 px-3 py-1.5 text-sm text-white outline-none focus:border-violet-soft"
                value={params.get('sort') ?? 'rent_asc'}
                onChange={(e) => set('sort', e.target.value)}
              >
                {SORTS.map(([v, text]) => <option key={v} value={v}>{text}</option>)}
              </select>
            </label>
          </div>

          {error && <p className="glass rounded-2xl p-6 text-amber">Could not load flats: {error}</p>}

          {!error && data?.total === 0 && (
            <div className="glass flex flex-col items-center rounded-2xl p-10 text-center">
              <SearchX className="text-slate-400" size={32} />
              <p className="mt-3 font-semibold text-white">No flats match these filters</p>
              <p className="mt-1 text-sm text-slate-400">Try a higher budget or a wider distance.</p>
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
                className="glass flex items-center gap-1 rounded-lg px-3 py-2 text-slate-200 disabled:opacity-40"
              >
                <ChevronLeft size={16} /> Prev
              </button>
              <span className="text-slate-400">Page {page} of {data.pages}</span>
              <button
                type="button"
                disabled={page >= data.pages}
                onClick={() => set('page', String(page + 1))}
                className="glass flex items-center gap-1 rounded-lg px-3 py-2 text-slate-200 disabled:opacity-40"
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
