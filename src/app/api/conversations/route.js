import { adminDB } from "@/lib/firebase-admin"

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const uid = searchParams.get("uid")
    if (!uid) {
      return Response.json({ error: "uid required" }, { status: 400 })
    }
    const snap = await adminDB.collection("conversations").where("participants", "array-contains", uid).get()
    const conversations = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    conversations.sort((a, b) => new Date(b.lastTimestamp) - new Date(a.lastTimestamp))
    return Response.json({ conversations })
  } catch (e) {
    return Response.json({ conversations: [], error: e.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { participants } = await request.json()
    if (!participants || participants.length !== 2) {
      return Response.json({ error: "Two participants required" }, { status: 400 })
    }
    const [a, b] = participants.sort()
    const pairId = `${a}__${b}`

    const existing = await adminDB.collection("conversations").doc(pairId).get()
    if (existing.exists) {
      return Response.json({ id: pairId, ...existing.data() })
    }

    const conversation = {
      participants: [a, b],
      lastMessage: "",
      lastTimestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    }
    await adminDB.collection("conversations").doc(pairId).set(conversation)
    return Response.json({ id: pairId, ...conversation })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
