import { adminDB } from "@/lib/firebase-admin"
import { verifyToken } from "@/lib/auth-middleware"

export async function DELETE(request, { params }) {
  try {
    const auth = await verifyToken(request)
    if (!auth.uid) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { id } = await params
    const snap = await adminDB.collection("conversations").doc(id).get()
    if (!snap.exists) {
      return Response.json({ error: "Conversation not found" }, { status: 404 })
    }
    const data = snap.data()
    if (!data.participants?.includes(auth.uid)) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }
    await adminDB.collection("conversations").doc(id).update({ deleted: true })
    return Response.json({ success: true })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
