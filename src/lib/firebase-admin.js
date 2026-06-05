import admin from "firebase-admin"

let adminAuth = null
let initError = null

try {
  if (!admin.apps.length) {
    const projectId = process.env.FIREBASE_PROJECT_ID || "studyhub-e1f30"
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
    const privateKey = process.env.FIREBASE_PRIVATE_KEY

    if (clientEmail && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, "\n"),
        }),
      })
    } else {
      admin.initializeApp({ projectId })
    }
  }
  adminAuth = admin.auth()
} catch (e) {
  initError = e.message
  if (!admin.apps.length) {
    try { admin.initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID || "studyhub-e1f30" }) } catch {}
  }
}

export { adminAuth, initError }
