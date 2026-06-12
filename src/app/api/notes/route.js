import { adminDB } from "@/lib/firebase-admin"
import { verifyToken } from "@/lib/auth-middleware"

export async function GET(request) {
  try {
    const auth = await verifyToken(request)
    if (!auth.uid) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const subjectId = searchParams.get("subjectId")
    if (userId && userId !== auth.uid) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }
    let ref = adminDB.collection("notes")
    ref = ref.where("userId", "==", auth.uid)
    if (subjectId) ref = ref.where("subjectId", "==", subjectId)
    const snap = await ref.orderBy("updatedAt", "desc").get()
    const notes = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    return Response.json({ notes })
  } catch (e) {
    return Response.json({ notes: [], error: e.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const auth = await verifyToken(request)
    if (!auth.uid) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { subjectId, title, content } = await request.json()
    if (!content) {
      return Response.json({ error: "content required" }, { status: 400 })
    }
    const ref = adminDB.collection("notes").doc()
    const note = {
      userId: auth.uid,
      subjectId: subjectId || "",
      title: title?.trim() || "Untitled",
      content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    await ref.set(note)
    return Response.json({ id: ref.id, ...note })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const auth = await verifyToken(request)
    if (!auth.uid) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { id, title, content } = await request.json()
    if (!id) return Response.json({ error: "id required" }, { status: 400 })
    const existing = await adminDB.collection("notes").doc(id).get()
    if (!existing.exists) return Response.json({ error: "Not found" }, { status: 404 })
    if (existing.data().userId !== auth.uid) return Response.json({ error: "Forbidden" }, { status: 403 })
    const update = { updatedAt: new Date().toISOString() }
    if (title !== undefined) update.title = title.trim() || "Untitled"
    if (content !== undefined) update.content = content
    await adminDB.collection("notes").doc(id).update(update)
    return Response.json({ success: true })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const auth = await verifyToken(request)
    if (!auth.uid) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { id } = await request.json()
    if (!id) return Response.json({ error: "id required" }, { status: 400 })
    const existing = await adminDB.collection("notes").doc(id).get()
    if (!existing.exists) return Response.json({ error: "Not found" }, { status: 404 })
    if (existing.data().userId !== auth.uid) return Response.json({ error: "Forbidden" }, { status: 403 })
    await adminDB.collection("notes").doc(id).delete()
    return Response.json({ success: true })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
