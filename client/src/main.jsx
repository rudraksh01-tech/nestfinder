import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import { wakeServer } from './lib/api.js'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { ShortlistProvider } from './context/ShortlistContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'

// The free API host sleeps when idle and takes up to a minute to wake. Start waking it as soon as
// the page loads, so it is usually awake by the time someone sends a message.
wakeServer()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ShortlistProvider>
            <App />
          </ShortlistProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)
