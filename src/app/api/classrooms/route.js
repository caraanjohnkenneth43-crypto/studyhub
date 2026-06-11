import { adminDB } from "@/lib/firebase-admin"

export async function GET() {
  try {
    const snap = await adminDB.collection("classrooms").orderBy("name", "asc").get()
    const classrooms = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    return Response.json({ classrooms })
  } catch (e) {
    return Response.json({ classrooms: [], error: e.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { name, subjects } = await request.json()
    if (!name || !name.trim()) {
      return Response.json({ error: "name required" }, { status: 400 })
    }
    const ref = adminDB.collection("classrooms").doc()
    const classroom = {
      name: name.trim(),
      subjects: subjects || [],
      createdAt: new Date().toISOString(),
    }
    await ref.set(classroom)
    return Response.json({ id: ref.id, ...classroom })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const { id, name, subjects } = await request.json()
    if (!id) return Response.json({ error: "id required" }, { status: 400 })
    const update = {}
    if (name) update.name = name.trim()
    if (subjects) update.subjects = subjects
    await adminDB.collection("classrooms").doc(id).update(update)
    return Response.json({ success: true })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const { id } = await request.json()
    if (!id) return Response.json({ error: "id required" }, { status: 400 })
    await adminDB.collection("classrooms").doc(id).delete()
    return Response.json({ success: true })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
