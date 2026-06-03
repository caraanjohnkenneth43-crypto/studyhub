import { db } from "@/lib/firebase"
import { doc, getDoc, setDoc } from "firebase/firestore"

export async function GET() {
  const snap = await getDoc(doc(db, "app", "data"))
  if (!snap.exists()) {
    return Response.json({ subjects: [] })
  }
  return Response.json(snap.data())
}

export async function PUT(request) {
  try {
    const body = await request.json()
    if (!body || typeof body !== "object") {
      return Response.json({ success: false, error: "Invalid data" }, { status: 400 })
    }
    if (!Array.isArray(body.subjects)) {
      body.subjects = []
    }
    await setDoc(doc(db, "app", "data"), body)
    return Response.json({ success: true })
  } catch (e) {
    return Response.json({ success: false, error: e.message }, { status: 400 })
  }
}