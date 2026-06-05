import { adminDB } from "@/lib/firebase-admin"

export async function GET() {
  try {
    const snap = await adminDB.collection("app").doc("data").get()
    if (!snap.exists) {
      return Response.json({ subjects: [] })
    }
    return Response.json({ ...snap.data(), _db: "admin" })
  } catch (e) {
    return Response.json({ subjects: [], error: e.message }, { status: 500 })
  }
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
    await adminDB.collection("app").doc("data").set(body)
    return Response.json({ success: true })
  } catch (e) {
    return Response.json({ success: false, error: e.message }, { status: 400 })
  }
}
