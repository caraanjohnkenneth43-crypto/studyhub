import { auth } from "@/lib/firebase"

export async function authFetch(url, options = {}) {
  const user = auth.currentUser
  const token = user ? await user.getIdToken() : null
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: token ? `Bearer ${token}` : "",
    },
  })
}

export async function authHeaders() {
  const user = auth.currentUser
  const token = user ? await user.getIdToken() : null
  return token ? { Authorization: `Bearer ${token}` } : {}
}
