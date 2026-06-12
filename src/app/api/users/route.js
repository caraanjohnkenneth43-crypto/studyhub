import { adminAuth, adminDB, initError as adminInitError } from "@/lib/firebase-admin"
import { verifyToken } from "@/lib/auth-middleware"
import { ADMIN_EMAILS } from "@/lib/constants"

export async function GET(request) {
  const auth = await verifyToken(request)
  if (!auth.uid) {
    return Response.json({ users: [], _debug: { error: "Unauthorized" } }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const isResolve = searchParams.get("resolve") === "true"

  if (isResolve) {
    const snap = await adminDB.collection("users").get()
    const map = {}
    snap.docs.forEach(d => {
      const data = d.data()
      if (data.uid && data.email) map[data.uid] = data.email
    })
    return Response.json({ map })
  }

  if (!auth.email || !ADMIN_EMAILS.includes(auth.email)) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  let usedAdmin = false

  try {
    if (adminAuth) {
      usedAdmin = true
      const list = await adminAuth.listUsers()
      const users = list.users.map(u => ({
        uid: u.uid,
        email: u.email || "no-email",
        displayName: u.displayName,
        createdAt: u.metadata.creationTime,
        lastSeen: u.metadata.lastSignInTime,
      }))
      users.sort((a, b) => (a.email || "").localeCompare(b.email || ""))
      return Response.json({ users, _debug: { usedAdmin, adminInitError: adminInitError || null, hasServiceAccount: !!process.env.FIREBASE_SERVICE_ACCOUNT, saLength: process.env.FIREBASE_SERVICE_ACCOUNT?.length || 0, count: users.length } })
    }
  } catch (e) {
    return Response.json({ users: [], _debug: { usedAdmin: false, adminInitError: adminInitError || e.message, hasServiceAccount: !!process.env.FIREBASE_SERVICE_ACCOUNT, saLength: process.env.FIREBASE_SERVICE_ACCOUNT?.length || 0, error: "admin list failed" } })
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
      const ref = adminDB.collection("users").doc(uid || email)
      const existing = await ref.get()
      if (!existing.exists) {
        await ref.set({
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
    const snap = await adminDB.collection("users").orderBy("email", "asc").get()
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
    const roomSnap = await adminDB.collection("chatRooms").get()
    for (const room of roomSnap.docs) {
      const msgSnap = await adminDB.collection("chatRooms").doc(room.id).collection("messages").get()
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
  return Response.json({ users, _debug: { usedAdmin, adminInitError: adminInitError || null, hasServiceAccount: !!process.env.FIREBASE_SERVICE_ACCOUNT, saLength: process.env.FIREBASE_SERVICE_ACCOUNT?.length || 0, count: users.length } })
}

export async function POST(request) {
  try {
    const { uid, email, displayName } = await request.json()
    if (!uid || !email) {
      return Response.json({ success: false, error: "uid and email required" }, { status: 400 })
    }
    const ref = adminDB.collection("users").doc(uid)
    const existing = await ref.get()
    if (!existing.exists) {
      await ref.set({
        uid,
        email,
        displayName: displayName || email.split("@")[0],
        createdAt: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
      })
    } else {
      await ref.set({ lastSeen: new Date().toISOString() }, { merge: true })
    }
    return Response.json({ success: true })
  } catch (e) {
    return Response.json({ success: false, error: e.message }, { status: 400 })
  }
}

export async function PUT(request) {
  try {
    const { uid, displayName } = await request.json()
    if (!uid || !displayName || typeof displayName !== "string" || !displayName.trim()) {
      return Response.json({ success: false, error: "Valid uid and displayName required" }, { status: 400 })
    }
    await adminDB.collection("users").doc(uid).update({ displayName: displayName.trim() })
    return Response.json({ success: true })
  } catch (e) {
    return Response.json({ success: false, error: e.message }, { status: 400 })
  }
}
