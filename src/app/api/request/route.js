import { db } from "@/lib/firebase"
import { collection, addDoc, getDocs, query, orderBy } from "firebase/firestore"

export async function POST(request) {
  try {
    const { name, message } = await request.json()
    if (!message || typeof message !== "string" || !message.trim()) {
      return Response.json({ success: false, error: "Message is required" }, { status: 400 })
    }
    await addDoc(collection(db, "requests"), {
      name: typeof name === "string" && name.trim() ? name.trim() : "Anonymous",
      message: message.trim(),
      timestamp: new Date().toISOString(),
    })
    return Response.json({ success: true })
  } catch (e) {
    return Response.json({ success: false, error: e.message }, { status: 400 })
  }
}

export async function GET() {
  try {
    const q = query(collection(db, "requests"), orderBy("timestamp", "desc"))
    const snap = await getDocs(q)
    const requests = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    return Response.json(requests)
  } catch (e) {
    return Response.json([], { status: 200 })
  }
}
