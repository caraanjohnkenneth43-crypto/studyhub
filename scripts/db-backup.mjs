// StudyHub Firestore Backup
// Dumps all collections to JSON files in backups/ directory.
// Usage: node scripts/db-backup.mjs
// Requires FIREBASE_SERVICE_ACCOUNT in .env.local

import { readFileSync, writeFileSync, mkdirSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"
import admin from "firebase-admin"

const __dirname = dirname(fileURLToPath(import.meta.url))
const BACKUP_DIR = resolve(__dirname, "..", "backups")
const timestamp = new Date().toISOString().replace(/[:.]/g, "-")

// ─── Load env ──────────────────────────────────────────────
try {
  const envRaw = readFileSync(resolve(__dirname, "..", ".env.local"), "utf-8")
  for (const line of envRaw.split("\n")) {
    const m = line.match(/^\s*([^#=]+?)\s*=\s*(.*?)\s*$/)
    if (m) process.env[m[1]] = m[2]
  }
} catch { /* .env.local may not exist, rely on env */ }

// ─── Init Admin SDK ────────────────────────────────────────
const isEmulator = process.env.FIREBASE_EMULATOR === "true"
if (isEmulator) {
  process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080"
}

if (!admin.apps.length) {
  if (isEmulator) {
    admin.initializeApp({ projectId: "studyhub-e1f30" })
  } else {
    const fullJson = process.env.FIREBASE_SERVICE_ACCOUNT
    if (!fullJson) {
      console.error("FATAL: FIREBASE_SERVICE_ACCOUNT not set. Copy .env.example to .env.local and fill it in.")
      process.exit(1)
    }
    admin.initializeApp({ credential: admin.credential.cert(JSON.parse(fullJson)) })
  }
}
const db = admin.firestore()

// ─── Collections to back up ────────────────────────────────
const COLLECTIONS = [
  { path: "app/data", type: "doc" },
  { path: "feedback", type: "collection" },
  { path: "requests", type: "collection" },
  { path: "users", type: "collection" },
  { path: "presence", type: "collection" },
  { path: "chatRooms", type: "collection" },
]

async function backup() {
  mkdirSync(BACKUP_DIR, { recursive: true })
  const backup = {}
  const dir = resolve(BACKUP_DIR, timestamp)
  mkdirSync(dir, { recursive: true })

  for (const col of COLLECTIONS) {
    if (col.type === "doc") {
      const snap = await db.doc(col.path).get()
      backup[col.path] = snap.exists ? { id: snap.id, ...snap.data() } : null
      console.log(`  ✓ ${col.path}`)
    } else {
      const snap = await db.collection(col.path).get()
      backup[col.path] = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      console.log(`  ✓ ${col.path} (${snap.size} docs)`)

      // ─── Back up subcollections ──────────────────────────
      if (col.path === "chatRooms") {
        const sub = {}
        for (const doc of snap.docs) {
          const msgSnap = await db.collection(`chatRooms/${doc.id}/messages`).get()
          if (msgSnap.size > 0) {
            sub[doc.id] = msgSnap.docs.map(m => ({ id: m.id, ...m.data() }))
          }
        }
        if (Object.keys(sub).length > 0) {
          backup["chatRooms/{id}/messages"] = sub
          const total = Object.values(sub).flat().length
          console.log(`    ↳ messages/ (${total} msgs across ${Object.keys(sub).length} rooms)`)
        }
      }
    }
  }

  const outPath = resolve(dir, "backup.json")
  writeFileSync(outPath, JSON.stringify(backup, null, 2))
  console.log(`\n✅ Backup saved: ${outPath}`)
  console.log(`   Size: ${(Buffer.byteLength(JSON.stringify(backup)) / 1024).toFixed(1)} KB`)

  // ─── Write a latest symlink ──────────────────────────────
  const latest = resolve(BACKUP_DIR, "latest.json")
  writeFileSync(latest, JSON.stringify({ timestamp, path: outPath }))
  console.log(`   Latest: ${latest}`)
}

backup().catch(e => { console.error("Backup failed:", e); process.exit(1) })
