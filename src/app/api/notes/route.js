import { adminDB } from "@/lib/firebase-admin"

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const subjectId = searchParams.get("subjectId")
    let ref = adminDB.collection("notes")
    if (userId) ref = ref.where("userId", "==", userId)
    if (subjectId) ref = ref.where("subjectId", "==", subjectId)
    
    // Try with orderBy first (requires composite index)
    let snap
    try {
      snap = await ref.orderBy("updatedAt", "desc").get()
    } catch (orderError) {
      // Fallback: fetch without orderBy and sort in memory
      console.warn("orderBy query failed, falling back to in-memory sort:", orderError.message)
      snap = await ref.get()
    }
    const notes = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    // Sort in memory if we couldn't use orderBy
    notes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    return Response.json({ notes })
  } catch (e) {
    return Response.json({ notes: [], error: e.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { userId, subjectId, title, content } = await request.json()
    if (!userId || !content) {
      return Response.json({ error: "userId and content required" }, { status: 400 })
    }
    const ref = adminDB.collection("notes").doc()
    const note = {
      userId,
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
    const { id, title, content } = await request.json()
    if (!id) return Response.json({ error: "id required" }, { status: 400 })
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
    const { id } = await request.json()
    if (!id) return Response.json({ error: "id required" }, { status: 400 })
    await adminDB.collection("notes").doc(id).delete()
    return Response.json({ success: true })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
