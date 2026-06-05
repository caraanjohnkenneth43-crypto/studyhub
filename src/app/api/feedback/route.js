import { adminDB } from "@/lib/firebase-admin"

export async function POST(request) {
  try {
    const { name, message } = await request.json()
    if (!message || typeof message !== "string" || !message.trim()) {
      return Response.json({ success: false, error: "Message is required" }, { status: 400 })
    }
    const doc = await adminDB.collection("feedback").add({
      name: typeof name === "string" && name.trim() ? name.trim() : "Anonymous",
      message: message.trim(),
      timestamp: new Date().toISOString(),
    })
    return Response.json({ success: true, id: doc.id })
  } catch (e) {
    return Response.json({ success: false, error: e.message }, { status: 400 })
  }
}

export async function GET() {
  try {
    const snap = await adminDB.collection("feedback").orderBy("timestamp", "desc").get()
    const feedback = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    return Response.json(feedback)
  } catch (e) {
    return Response.json([], { status: 200 })
  }
}
