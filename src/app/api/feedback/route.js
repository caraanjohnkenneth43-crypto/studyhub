import { db } from "@/lib/firebase"
import { collection, addDoc, getDocs, query, orderBy } from "firebase/firestore"

export async function POST(request) {
  try {
    const { name, message } = await request.json()
    const doc = await addDoc(collection(db, "feedback"), {
      name: name || "Anonymous",
      message,
      timestamp: new Date().toISOString(),
    })
    return Response.json({ success: true, id: doc.id })
  } catch (e) {
    return Response.json({ success: false, error: e.message }, { status: 400 })
  }
}

export async function GET() {
  try {
    const q = query(collection(db, "feedback"), orderBy("timestamp", "desc"))
    const snap = await getDocs(q)
    const feedback = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    return Response.json(feedback)
  } catch (e) {
    return Response.json([], { status: 200 })
  }
}