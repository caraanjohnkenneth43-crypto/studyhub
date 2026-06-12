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
      const msgCol = adminDB.collection("chatRooms").doc(doc.id).collection("messages")

      // Get message count for this room
      let messageCount = 0
      try {
        const msgSnap = await msgCol.count().get()
        messageCount = msgSnap.data().count
      } catch {
        const msgSnap = await msgCol.limit(1000).get()
        messageCount = msgSnap.docs.length
      }

      // Get unique users who have sent messages in this room
      let memberCount = 0
      let members = []
      try {
        const msgSnap = await msgCol.limit(1000).get()
        const userMap = new Map()
        msgSnap.docs.forEach(m => {
          const d = m.data()
          if (d.userId) {
            const name = d.userName || d.userEmail?.split("@")[0] || "Unknown"
            userMap.set(d.userId, name)
          }
        })
        memberCount = userMap.size
        members = [...userMap.values()]
      } catch {
        memberCount = 0
      }

      const { password, ...safeData } = data
      return {
        ...safeData,
        hasPassword: safeData.type === "private" && !!password,
        messageCount,
        memberCount,
        members,
      }
    }))
    return Response.json({ rooms })
  } catch (e) {
    return Response.json({ rooms: [], error: e.message }, { status: 500 })
  }
}
