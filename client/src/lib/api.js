// Small fetch wrappers: throw with the server's error message on non-2xx responses.
// Requests are same-origin (Vite proxy in dev, Vercel rewrite in prod), so the auth cookie is sent automatically.
async function handle(res) {
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`)
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
