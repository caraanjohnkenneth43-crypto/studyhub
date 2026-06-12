import { adminDB } from "@/lib/firebase-admin"
import { verifyToken } from "@/lib/auth-middleware"

export async function GET(_, { params }) {
  try {
    const auth = await verifyToken(_)
    if (!auth.uid) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const snap = await adminDB.collection("chatRooms").doc(id).get()
    if (!snap.exists) {
      return Response.json({ error: "Room not found" }, { status: 404 })
    }
    const { password, ...safeData } = { id: snap.id, ...snap.data() }
    return Response.json({ ...safeData, hasPassword: safeData.type === "private" })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(_, { params }) {
  try {
    const auth = await verifyToken(_)
    if (!auth.uid) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const { password } = await _.json()

    const snap = await adminDB.collection("chatRooms").doc(id).get()
    if (!snap.exists) {
      return Response.json({ error: "Room not found" }, { status: 404 })
    }

    const data = snap.data()
    if (data.type === "public") {
      return Response.json({ ok: true })
    }

    if (data.password && password === data.password) {
      return Response.json({ ok: true })
    }

    return Response.json({ ok: false }, { status: 403 })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
