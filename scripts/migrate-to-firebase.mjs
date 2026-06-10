// One-time script: pushes content.json data into Firestore
// Now uses Admin SDK — required since Firestore rules were deployed.
// Usage: node scripts/migrate-to-firebase.mjs
// Requires FIREBASE_SERVICE_ACCOUNT in .env.local

import { readFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"
import admin from "firebase-admin"

const __dirname = dirname(fileURLToPath(import.meta.url))

// ─── Load env ──────────────────────────────────────────────
try {
  const envRaw = readFileSync(resolve(__dirname, "..", ".env.local"), "utf-8")
  for (const line of envRaw.split("\n")) {
    const m = line.match(/^\s*([^#=]+?)\s*=\s*(.*?)\s*$/)
    if (m) process.env[m[1]] = m[2]
  }
} catch {}

// ─── Init Admin SDK ────────────────────────────────────────
const fullJson = process.env.FIREBASE_SERVICE_ACCOUNT
if (!fullJson) {
  console.error("FATAL: FIREBASE_SERVICE_ACCOUNT not set.")
  process.exit(1)
}

const serviceAccount = JSON.parse(fullJson)
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
}
const db = admin.firestore()

// ─── Migrate data ──────────────────────────────────────────
const dataPath = resolve(__dirname, "..", "data", "content.json")
const data = JSON.parse(readFileSync(dataPath, "utf-8"))

await db.doc("app/data").set(data)

console.log("Data migrated to Firestore successfully!")
console.log(`Subjects: ${data.subjects.length}`)
data.subjects.forEach((s) => {
  console.log(`  ${s.icon} ${s.name}: ${s.quizzes.length} quizzes, ${s.links.length} links`)
})

process.exit(0)
