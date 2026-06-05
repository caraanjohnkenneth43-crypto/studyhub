import { adminAuth, initError as adminInitError } from "@/lib/firebase-admin"
import { db } from "@/lib/firebase"
import { collection, getDocs, query, orderBy, getDoc, doc, setDoc } from "firebase/firestore"

export async function GET() {
  let usedAdmin = false

  try {
    if (adminAuth) {
      usedAdmin = true
      const list = await adminAuth.listUsers()
      const users = list.users.map(u => ({
        uid: u.uid,
        email: u.email || "no-email",
        createdAt: u.metadata.creationTime,
        lastSeen: u.metadata.lastSignInTime,
      }))
      users.sort((a, b) => (a.email || "").localeCompare(b.email || ""))
      return Response.json({ users, _debug: { usedAdmin, adminInitError: adminInitError || null, count: users.length } })
    }
  } catch (e) {
    return Response.json({ users: [], _debug: { usedAdmin: false, adminInitError: adminInitError || e.message, error: "admin list failed" } })
  }

  const seen = new Map()
  const uidMap = new Map()

  const upsertUser = async (uid, email, userName, timestampMs) => {
    if (!email) return
    if (seen.has(email)) {
      const existing = seen.get(email)
      if (!existing.userName && userName) existing.userName = userName
      return
    }
    seen.set(email, {
      uid: uid || email,
      email,
      userName: userName || email.split("@")[0],
      createdAt: timestampMs ? new Date(timestampMs).toISOString() : undefined,
      lastSeen: timestampMs ? new Date(timestampMs).toISOString() : undefined,
    })
    if (uid) uidMap.set(uid, email)
    try {
      const ref = doc(db, "users", uid || email)
      const existing = await getDoc(ref)
      if (!existing.exists()) {
        await setDoc(ref, {
          uid: uid || email,
          email,
          userName: userName || email.split("@")[0],
          createdAt: timestampMs ? new Date(timestampMs).toISOString() : new Date().toISOString(),
          lastSeen: timestampMs ? new Date(timestampMs).toISOString() : new Date().toISOString(),
        })
      }
    } catch {}
  }

  try {
    const snap = await getDocs(query(collection(db, "users"), orderBy("email", "asc")))
    snap.docs.forEach(d => {
      const data = d.data()
      if (data.email) {
        seen.set(data.email, { uid: d.id, ...data })
        uidMap.set(d.id, data.email)
      }
    })
  } catch {}

  const uidChecked = new Set()

  try {
    const roomSnap = await getDocs(collection(db, "chatRooms"))
    for (const room of roomSnap.docs) {
      const msgSnap = await getDocs(query(collection(db, "chatRooms", room.id, "messages")))
      for (const d of msgSnap.docs) {
        const data = d.data()
        const ts = data.timestamp?.seconds ? data.timestamp.seconds * 1000 : null
        if (data.userEmail) {
          await upsertUser(data.userId, data.userEmail, data.userName, ts)
        } else if (data.userId && !uidChecked.has(data.userId)) {
          uidChecked.add(data.userId)
          if (uidMap.has(data.userId)) {
            const email = uidMap.get(data.userId)
            upsertUser(data.userId, email, data.userName, ts)
          }
        }
      }
    }
  } catch {}

  const users = [...seen.values()].sort((a, b) => (a.email || "").localeCompare(b.email || ""))
  return Response.json({ users, _debug: { usedAdmin, adminInitError: adminInitError || null, count: users.length } })
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
