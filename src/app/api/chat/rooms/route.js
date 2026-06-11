import { adminDB } from "@/lib/firebase-admin"
import { verifyToken } from "@/lib/auth-middleware"

export async function GET(request) {
  try {
    const auth = await verifyToken(request)
    if (!auth.uid) {
      return Response.json({ rooms: [], error: "Unauthorized" }, { status: 401 })
    }
    const snap = await adminDB.collection("chatRooms").get()
    const rooms = snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      messageCount: 0,
    }))
    return Response.json({ rooms })
  } catch (e) {
    return Response.json({ rooms: [], error: e.message }, { status: 500 })
  }
}
