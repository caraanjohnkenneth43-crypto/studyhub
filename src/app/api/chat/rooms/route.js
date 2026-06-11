import { adminDB } from "@/lib/firebase-admin"
import { verifyToken } from "@/lib/auth-middleware"

export async function GET(request) {
  try {
    const auth = await verifyToken(request)
    if (!auth.uid) {
      return Response.json({ rooms: [], error: "Unauthorized" }, { status: 401 })
    }
    const snap = await adminDB.collection("chatRooms").get()
    const rooms = await Promise.all(snap.docs.map(async (doc) => {
      const data = { id: doc.id, ...doc.data() }
      // Get message count for this room
      let messageCount = 0
      try {
        const msgSnap = await adminDB.collection("chatRooms").doc(doc.id).collection("messages").count().get()
        messageCount = msgSnap.data().count
      } catch {
        // fallback: limit query if count not supported
        const msgSnap = await adminDB.collection("chatRooms").doc(doc.id).collection("messages").limit(1000).get()
        messageCount = msgSnap.docs.length
      }
      return {
        ...data,
        messageCount,
      }
    }))
    return Response.json({ rooms })
  } catch (e) {
    return Response.json({ rooms: [], error: e.message }, { status: 500 })
  }
}
