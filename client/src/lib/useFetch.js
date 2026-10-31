import { useCallback, useEffect, useState } from 'react'
import { getJson } from './api.js'

// Loads JSON from `path` (pass null to skip). `key` records which request the stored
// result belongs to, so `loading` is derived instead of set inside the effect.
// `data` keeps the previous result while a new one loads, so lists can stay on screen dimmed.
export function useFetch(path) {
  const [version, setVersion] = useState(0)
  const key = path ? `${path}#${version}` : null
  const [result, setResult] = useState({ key: null, data: null, error: null })

  useEffect(() => {
    if (!path) return
    // Aborting stops an older, slower response from overwriting a newer one.
    const ctrl = new AbortController()
    getJson(path, { signal: ctrl.signal })
      .then((data) => setResult({ key, data, error: null }))
      .catch((err) => {
        if (err.name !== 'AbortError') setResult({ key, data: null, error: err.message })
      })
    return () => ctrl.abort()
  }, [path, key])

  const loading = key !== null && result.key !== key
  const reload = useCallback(() => setVersion((v) => v + 1), [])
  // Update the cached data in place, e.g. after a successful PATCH.
  const mutate = useCallback((update) => setResult((r) => ({ ...r, data: update(r.data) })), [])

  return { data: result.data, error: loading ? null : result.error, loading, reload, mutate }
}
