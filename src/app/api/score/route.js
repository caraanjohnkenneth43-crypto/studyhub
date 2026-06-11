import { adminDB, adminAuth } from "@/lib/firebase-admin"

export async function POST(request) {
  try {
    const { quizId, quizTitle, score, total } = await request.json()
    if (typeof score !== "number" || typeof total !== "number" || total < 1) {
      return Response.json({ success: false, error: "Valid score and total required" }, { status: 400 })
    }
    if (!adminDB) return Response.json({ success: false, error: "Database not initialized" }, { status: 500 })

    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    let uid = "anonymous", email = "anonymous@unknown"
    if (token && adminAuth) {
      try {
        const decoded = await adminAuth.verifyIdToken(token)
        uid = decoded.uid
        email = decoded.email || email
      } catch {}
    }

    const docId = `${uid}_${quizId}`
    const ref = adminDB.collection("scores").doc(docId)
    const existing = await ref.get()

    if (existing.exists && score > existing.data().score) {
      await ref.update({ score, total, timestamp: new Date().toISOString() })
    } else if (!existing.exists) {
      await ref.set({
        uid, email, quizId, quizTitle: quizTitle || "Untitled", score, total, timestamp: new Date().toISOString(),
      })
    }
    return Response.json({ success: true })
  } catch (e) {
    return Response.json({ success: false, error: e.message }, { status: 400 })
  }
}

export async function GET(request) {
  try {
    if (!adminDB) return Response.json({ scores: [], positions: {} }, { status: 200 })
    const url = new URL(request.url)
    const quizId = url.searchParams.get("quizId")
    const uid = url.searchParams.get("uid")
    let ref = adminDB.collection("scores")
    if (uid) {
      ref = ref.where("uid", "==", uid)
    } else {
      ref = ref.orderBy("score", "desc").orderBy("timestamp", "asc")
    }
    if (quizId) ref = ref.where("quizId", "==", quizId)
    const snap = await ref.limit(50).get()
    const scores = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    if (uid) scores.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

    const positions = {}
    let prevScore = null, rank = 0
    scores.forEach((s, i) => {
      if (s.score !== prevScore) { rank = i + 1; prevScore = s.score }
      if (!positions[s.uid]) positions[s.uid] = rank
    })
    return Response.json({ scores, positions })
  } catch (e) {
    return Response.json({ scores: [], positions: {} }, { status: 200 })
  }
}
