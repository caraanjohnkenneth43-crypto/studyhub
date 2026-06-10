// StudyHub Firestore Restore
// Restores collections from a backup JSON file.
// Usage: node scripts/db-restore.mjs [backup-file]
//   If no file specified, restores from backups/latest.json
//   Pass "list" to see available backups.

import { readFileSync, readdirSync, existsSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"
import admin from "firebase-admin"

const __dirname = dirname(fileURLToPath(import.meta.url))
const BACKUP_DIR = resolve(__dirname, "..", "backups")

// ─── Load env ──────────────────────────────────────────────
try {
  const envRaw = readFileSync(resolve(__dirname, "..", ".env.local"), "utf-8")
  for (const line of envRaw.split("\n")) {
    const m = line.match(/^\s*([^#=]+?)\s*=\s*(.*?)\s*$/)
    if (m) process.env[m[1]] = m[2]
  }
} catch {}

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
      console.error("FATAL: FIREBASE_SERVICE_ACCOUNT not set.")
      process.exit(1)
    }
    admin.initializeApp({ credential: admin.credential.cert(JSON.parse(fullJson)) })
  }
}
const db = admin.firestore()

async function listBackups() {
  if (!existsSync(BACKUP_DIR)) { console.log("No backups directory found."); return }
  const dirs = readdirSync(BACKUP_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)
    .sort()
    .reverse()

  console.log("Available backups:")
  for (const d of dirs) {
    const info = existsSync(resolve(BACKUP_DIR, d, "backup.json"))
      ? JSON.parse(readFileSync(resolve(BACKUP_DIR, d, "backup.json"), "utf-8"))
      : null
    if (info) {
      const counts = Object.entries(info).map(([k, v]) => {
        if (v === null) return `${k}: (empty)`
        if (Array.isArray(v)) return `${k}: ${v.length} docs`
        if (typeof v === "object") return `${k}: 1 doc`
        return k
      })
      console.log(`  ${d}`)
      console.log(`    ${counts.join(", ")}`)
    } else {
      console.log(`  ${d} (no backup.json)`)
    }
  }
}

async function restore(filePath) {
  if (!existsSync(filePath)) {
    console.error(`File not found: ${filePath}`)
    process.exit(1)
  }

  const backup = JSON.parse(readFileSync(filePath, "utf-8"))

  // ─── Restore top-level docs/collections ──────────────────
  for (const [path, data] of Object.entries(backup)) {
    if (path === "chatRooms/{id}/messages") continue // handled separately

    if (data === null) {
      console.log(`  ⏭ ${path} (empty)`)
      continue
    }

    if (Array.isArray(data)) {
      // Collection of docs
      const batch = db.batch()
      for (const doc of data) {
        const { id, ...fields } = doc
        batch.set(db.collection(path).doc(id), fields, { merge: false })
      }
      await batch.commit()
      console.log(`  ✓ ${path} (${data.length} docs)`)
    } else if (typeof data === "object" && data.id) {
      // Single doc (app/data style)
      const { id, ...fields } = data
      await db.doc(path).set(fields, { merge: false })
      console.log(`  ✓ ${path}`)
    }
  }

  // ─── Restore chat messages ───────────────────────────────
  const messages = backup["chatRooms/{id}/messages"]
  if (messages) {
    let total = 0
    for (const [roomId, msgs] of Object.entries(messages)) {
      const batch = db.batch()
      for (const msg of msgs) {
        const { id, ...fields } = msg
        batch.set(db.collection(`chatRooms/${roomId}/messages`).doc(id), fields, { merge: false })
        total++
      }
      await batch.commit()
    }
    console.log(`  ✓ chatRooms/{id}/messages (${total} msgs across ${Object.keys(messages).length} rooms)`)
  }

  console.log(`\n✅ Restore complete from: ${filePath}`)
}

// ─── Main ──────────────────────────────────────────────────
const arg = process.argv[2]
if (arg === "list") {
  await listBackups()
} else if (arg) {
  await restore(resolve(arg))
} else if (existsSync(resolve(BACKUP_DIR, "latest.json"))) {
  const latest = JSON.parse(readFileSync(resolve(BACKUP_DIR, "latest.json"), "utf-8"))
  console.log(`Restoring from latest: ${latest.path}`)
  await restore(resolve(latest.path))
} else {
  console.log("Usage: node scripts/db-restore.mjs [path | list]")
  await listBackups()
}
