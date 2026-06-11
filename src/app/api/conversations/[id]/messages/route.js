import { adminDB } from "@/lib/firebase-admin"

export async function GET(_, { params }) {
  try {
    const { id } = await params
    const snap = await adminDB.collection("conversations").doc(id).collection("messages").orderBy("timestamp", "asc").get()
    const messages = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    return Response.json({ messages })
  } catch (e) {
    return Response.json({ messages: [], error: e.message }, { status: 500 })
  }
}

export async function POST(request, { params }) {
  try {
    const { id } = await params
    const { senderId, senderName, text } = await request.json()
    if (!senderId || !text) {
      return Response.json({ error: "senderId and text required" }, { status: 400 })
    }

    const message = {
      senderId,
      senderName: senderName || "Unknown",
      text,
      timestamp: new Date().toISOString(),
    }

    const ref = await adminDB.collection("conversations").doc(id).collection("messages").add(message)

    await adminDB.collection("conversations").doc(id).update({
      lastMessage: text,
      lastTimestamp: message.timestamp,
    })

    return Response.json({ id: ref.id, ...message })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
