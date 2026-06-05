import admin from "firebase-admin"

function init() {
  if (admin.apps.length) return admin

  const projectId = process.env.FIREBASE_PROJECT_ID || "studyhub-e1f30"
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY

  if (clientEmail && privateKey) {
    return admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, "\n"),
      }),
    })
  }

  return admin.initializeApp({ projectId })
}

export const adminApp = init()
export const adminAuth = adminApp.auth ? adminApp.auth() : null
