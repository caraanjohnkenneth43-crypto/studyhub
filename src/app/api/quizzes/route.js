import { adminDB } from "@/lib/firebase-admin"

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const subjectId = searchParams.get("subjectId")
    const uid = searchParams.get("uid")
    let ref = adminDB.collection("userQuizzes")
    if (subjectId) ref = ref.where("subjectId", "==", subjectId)
    if (uid) ref = ref.where("createdBy", "==", uid)
    const snap = await ref.orderBy("createdAt", "desc").get()
    const quizzes = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    return Response.json({ quizzes })
  } catch (e) {
    return Response.json({ quizzes: [], error: e.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { title, subjectId, questions, type } = await request.json()
    if (!title || !subjectId || !questions?.length) {
      return Response.json({ error: "title, subjectId, and questions required" }, { status: 400 })
    }
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    let uid = "anonymous", email = "anonymous@unknown"
    if (token) {
      try {
        const { adminAuth } = await import("@/lib/firebase-admin")
        const decoded = await adminAuth.verifyIdToken(token)
        uid = decoded.uid
        email = decoded.email || email
      } catch {}
    }
    const ref = adminDB.collection("userQuizzes").doc()
    const quiz = {
      title: title.trim(),
      subjectId,
      questions,
      type: type === "private" ? "private" : "public",
      createdBy: uid,
      createdByEmail: email,
      createdAt: new Date().toISOString(),
    }
    await ref.set(quiz)
    return Response.json({ id: ref.id, ...quiz })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
