import { adminAuth } from "@/lib/firebase-admin"
import { ADMIN_EMAILS } from "@/lib/constants"

export async function verifyToken(request) {
  const authHeader = request.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return { uid: null, email: null, error: "No token" }
  }
  const token = authHeader.slice(7)
  if (!adminAuth) {
    return { uid: null, email: null, error: "Admin Auth not initialized" }
  }
  try {
    const decoded = await adminAuth.verifyIdToken(token)
    return { uid: decoded.uid, email: decoded.email || null, error: null }
  } catch {
    return { uid: null, email: null, error: "Invalid token" }
  }
}

export function requireAdmin(auth) {
  if (!auth.email || !ADMIN_EMAILS.includes(auth.email)) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }
  return null
}
