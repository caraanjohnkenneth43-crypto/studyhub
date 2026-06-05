import admin from "firebase-admin"

let adminAuth = null
let initError = null

try {
  if (!admin.apps.length) {
    const fullJson = process.env.FIREBASE_SERVICE_ACCOUNT
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
    const projectId = process.env.FIREBASE_PROJECT_ID || "studyhub-e1f30"

    if (fullJson) {
      const serviceAccount = JSON.parse(fullJson)
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
    } else if (clientEmail && privateKey) {
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

const adminDB = admin.apps.length ? admin.firestore() : null

export { adminAuth, adminDB, initError }
