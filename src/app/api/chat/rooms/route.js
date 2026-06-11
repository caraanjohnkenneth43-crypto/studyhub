import { adminDB } from "@/lib/firebase-admin"

export async function GET() {
  try {
    const snap = await adminDB.collection("chatRooms").get()
    const rooms = await Promise.all(snap.docs.map(async (doc) => {
      const msgSnap = await adminDB.collection("chatRooms").doc(doc.id).collection("messages").count().get()
      return {
        id: doc.id,
        ...doc.data(),
        messageCount: msgSnap.data().count,
      }
    }))
    return Response.json({ rooms })
  } catch (e) {
    return Response.json({ rooms: [], error: e.message }, { status: 500 })
  }
}
