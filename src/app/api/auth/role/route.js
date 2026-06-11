import { adminDB } from "@/lib/firebase-admin"
import { ADMIN_EMAILS } from "@/lib/constants"

export async function POST(request) {
  try {
    const { email } = await request.json()
    if (!email) {
      return Response.json({ role: "student" })
    }

    const snap = await adminDB.collection("app").doc("data").get()
    const data = snap.data() || {}
    const contributors = data.contributors || []

    const role = ADMIN_EMAILS.includes(email) ? "admin" 
      : contributors.includes(email) ? "contributor" 
      : "student"

    return Response.json({ role, email })
  } catch {
    return Response.json({ role: "student" })
  }
}
