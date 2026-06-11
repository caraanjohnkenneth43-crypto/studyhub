import { adminDB } from "@/lib/firebase-admin"
import { ADMIN_EMAILS } from "@/lib/constants"
import { verifyToken } from "@/lib/auth-middleware"

export async function POST(request) {
  try {
    const auth = await verifyToken(request)
    if (!auth.uid) {
      return Response.json({ role: "student" })
    }
    const { email } = await request.json()
    if (!email || email !== auth.email) {
      const snap = await adminDB.collection("users").doc(auth.uid).get()
      const userData = snap.data()
      return Response.json({ role: "student", email: userData?.email || auth.email })
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
