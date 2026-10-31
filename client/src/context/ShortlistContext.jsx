import { createContext, useContext, useEffect, useState } from 'react'

const KEY = 'nf_shortlist'
export const SHORTLIST_MAX = 4
const ShortlistContext = createContext(null)

// localStorage can be unavailable (private mode, blocked storage), so every access is guarded.
function readSaved() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(saved) ? saved.filter((c) => typeof c === 'string').slice(0, SHORTLIST_MAX) : []
  } catch {
    return []
  }
}

// Shortlisted flat codes, kept in the browser so no login is needed.
export function ShortlistProvider({ children }) {
  const [codes, setCodes] = useState(readSaved)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(codes))
    } catch {
      // Storage unavailable: the shortlist still works for this visit.
    }
  }, [codes])

  const value = {
    codes,
    has: (code) => codes.includes(code),
    full: codes.length >= SHORTLIST_MAX,
    toggle: (code) =>
      setCodes((c) => (c.includes(code) ? c.filter((x) => x !== code) : c.length >= SHORTLIST_MAX ? c : [...c, code])),
    remove: (code) => setCodes((c) => c.filter((x) => x !== code)),
    clear: () => setCodes([]),
  }
  return <ShortlistContext.Provider value={value}>{children}</ShortlistContext.Provider>
}

// oxlint-disable-next-line react/only-export-components
export const useShortlist = () => useContext(ShortlistContext)

// The last preferences used on /match, so Compare can score flats the same way.
const PREFS_KEY = 'nf_prefs'
// oxlint-disable-next-line react/only-export-components
export function savePrefs(query) {
  try {
    localStorage.setItem(PREFS_KEY, query)
  } catch {
    // ignore
  }
}
// oxlint-disable-next-line react/only-export-components
export function loadPrefs() {
  try {
    return localStorage.getItem(PREFS_KEY) ?? ''
  } catch {
    return ''
  }
}
