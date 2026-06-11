import { adminDB } from "@/lib/firebase-admin"

export async function GET(_, { params }) {
  try {
    const { id } = await params
    const snap = await adminDB.collection("chatRooms").doc(id).get()
    if (!snap.exists) {
      return Response.json({ error: "Room not found" }, { status: 404 })
    }
    return Response.json({ id: snap.id, ...snap.data() })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
