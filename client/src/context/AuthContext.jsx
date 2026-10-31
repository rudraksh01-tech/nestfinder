import { createContext, useContext, useEffect, useState } from 'react'
import { getJson, sendJson } from '../lib/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // undefined = still checking the cookie, null = logged out
  const [broker, setBroker] = useState(undefined)

  useEffect(() => {
    getJson('/api/auth/me')
      .then((d) => setBroker(d.broker))
      .catch(() => setBroker(null))
  }, [])

  const value = {
    broker,
    checking: broker === undefined,
    setBroker, // e.g. after connecting Telegram
    login: async (email, password) => setBroker((await sendJson('/api/auth/login', { body: { email, password } })).broker),
    register: async (form) => setBroker((await sendJson('/api/auth/register', { body: form })).broker),
    logout: async () => {
      await sendJson('/api/auth/logout')
      setBroker(null)
    },
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// oxlint-disable-next-line react/only-export-components
export const useAuth = () => useContext(AuthContext)
