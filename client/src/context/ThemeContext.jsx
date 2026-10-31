import { createContext, useContext, useEffect, useState } from 'react'

const KEY = 'nf_theme'
const ThemeContext = createContext(null)

// index.html sets data-theme before the first paint (so a dark visitor never sees a light flash);
// this starts from whatever it set.
function readInitial() {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}

// Light is the default. The choice is kept in the browser; storage can be blocked, so it is guarded.
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(readInitial)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0B0E15' : '#F4F3EE')
    try {
      localStorage.setItem(KEY, theme)
    } catch {
      // Storage unavailable: the theme still applies for this visit.
    }
  }, [theme])

  const value = { theme, toggle: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')) }
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

// oxlint-disable-next-line react/only-export-components
export const useTheme = () => useContext(ThemeContext)
