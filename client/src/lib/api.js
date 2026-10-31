// Small fetch wrappers: throw with the server's error message on non-2xx responses.
// Requests are same-origin (Vite proxy in dev, Vercel rewrite in prod), so the auth cookie is sent automatically.
// 502/503/504 with no message from our server means it could not be reached (restarting, or a free
// host waking up), so say that instead of a bare status code.
export const UNREACHABLE = new Set([502, 503, 504])
export const errorMessage = (status, body) =>
  body?.error || (UNREACHABLE.has(status) ? 'Could not reach the server. Please try again in a moment.' : `Request failed (${status})`)

async function handle(res) {
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(errorMessage(res.status, body))
  return body
}

export async function getJson(path, { signal } = {}) {
  return handle(await fetch(path, { signal }))
}

export async function sendJson(path, { method = 'POST', body } = {}) {
  return handle(
    await fetch(path, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    }),
  )
}
