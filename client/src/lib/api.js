// Small fetch wrappers: throw with the server's error message on non-2xx responses.
// Requests are same-origin (Vite proxy in dev, Vercel rewrite in prod), so the auth cookie is sent automatically.
// 502/503/504 with no message from our server means it could not be reached (restarting, or a free
// host waking up), so say that instead of a bare status code.
export const UNREACHABLE = new Set([502, 503, 504])
export const errorMessage = (status, body) =>
  body?.error || (UNREACHABLE.has(status) ? 'Could not reach the server. Please try again in a moment.' : `Request failed (${status})`)

// The free API host sleeps after 15 idle minutes and takes up to a minute to wake; the proxy in front
// of it gives up sooner with a 502. wakeServer polls /api/health until it answers (callers share one
// poll), so a request that hit a sleeping server can wait for it and try again instead of failing.
let waking = null
export function wakeServer({ timeoutMs = 75000 } = {}) {
  waking ??= (async () => {
    const until = Date.now() + timeoutMs
    while (Date.now() < until) {
      try {
        if ((await fetch('/api/health', { cache: 'no-store' })).ok) return true
      } catch {
        // offline or still waking: keep trying until the deadline
      }
      await new Promise((r) => setTimeout(r, 3000))
    }
    return false
  })().finally(() => {
    waking = null
  })
  return waking
}

// fetch, but if the server could not be reached, wait for it to wake and try once more.
export async function request(path, init = {}, { onWaking } = {}) {
  const res = await fetch(path, init)
  if (!UNREACHABLE.has(res.status) || init.signal?.aborted) return res
  onWaking?.()
  return (await wakeServer()) ? fetch(path, init) : res
}

async function handle(res) {
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(errorMessage(res.status, body))
  return body
}

export async function getJson(path, { signal } = {}) {
  return handle(await request(path, { signal }))
}

export async function sendJson(path, { method = 'POST', body } = {}) {
  return handle(
    await request(path, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    }),
  )
}
