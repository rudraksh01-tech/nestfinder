// Small fetch wrapper: throws with the server's error message on non-2xx responses.
export async function getJson(path, { signal } = {}) {
  const res = await fetch(path, { signal })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`)
  return body
}
