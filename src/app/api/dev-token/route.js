import { adminAuth } from "@/lib/firebase-admin"
import { ADMIN_EMAILS } from "@/lib/constants"

export async function POST(request) {
  try {
    const { email } = await request.json()
    if (!email || !ADMIN_EMAILS.includes(email)) {
      return Response.json({ error: "Unauthorized" }, { status: 403 })
    }
    if (!adminAuth) {
      return Response.json({ error: "Admin SDK not initialized" }, { status: 500 })
    }
    const token = await adminAuth.createCustomToken(email)
    return Response.json({ token })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
