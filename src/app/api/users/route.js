import { adminAuth } from "@/lib/firebase-admin"
import { db } from "@/lib/firebase"
import { collection, getDocs, query, orderBy, getDoc, doc, setDoc, collectionGroup } from "firebase/firestore"

export async function GET() {
  try {
    if (adminAuth) {
      const list = await adminAuth.listUsers()
      const users = list.users.map(u => ({
        uid: u.uid,
        email: u.email || "no-email",
        createdAt: u.metadata.creationTime,
        lastSeen: u.metadata.lastSignInTime,
      }))
      users.sort((a, b) => (a.email || "").localeCompare(b.email || ""))
      return Response.json(users)
    }
  } catch {}

  const seen = new Map()

  try {
    const q = query(collection(db, "users"), orderBy("email", "asc"))
    const snap = await getDocs(q)
    snap.docs.forEach(d => {
      const data = d.data()
      if (data.email) seen.set(data.email, { uid: d.id, ...data })
    })
  } catch {}

  try {
    const msgSnap = await getDocs(query(collectionGroup(db, "messages")))
    msgSnap.forEach(d => {
      const data = d.data()
      const email = data.userEmail
      if (email && !seen.has(email)) {
        seen.set(email, {
          uid: data.userId || email,
          email,
          userName: data.userName || email.split("@")[0],
          createdAt: data.timestamp?.seconds ? new Date(data.timestamp.seconds * 1000).toISOString() : undefined,
          lastSeen: data.timestamp?.seconds ? new Date(data.timestamp.seconds * 1000).toISOString() : undefined,
        })
      }
    })
  } catch {}

  const users = [...seen.values()].sort((a, b) => (a.email || "").localeCompare(b.email || ""))
  return Response.json(users)
}

export async function POST(request) {
  try {
    const { uid, email } = await request.json()
    if (!uid || !email) {
      return Response.json({ success: false, error: "uid and email required" }, { status: 400 })
    }
    const ref = doc(db, "users", uid)
    const existing = await getDoc(ref)
    if (!existing.exists()) {
      await setDoc(ref, {
        uid,
        email,
        createdAt: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
      })
    } else {
      await setDoc(ref, { lastSeen: new Date().toISOString() }, { merge: true })
    }
    return Response.json({ success: true })
  } catch (e) {
    return Response.json({ success: false, error: e.message }, { status: 400 })
  }
}
