// StudyHub Dev Environment
// Starts Firebase emulators + Next.js dev server + seeds emulator data.
// Usage: node scripts/dev.mjs

import { spawn, execSync } from "child_process"
import { existsSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, "..")

function run(cmd, opts = {}) {
  console.log(`\n> ${cmd}`)
  return execSync(cmd, { cwd: ROOT, stdio: "inherit", ...opts })
}

async function waitForPort(port, host = "127.0.0.1", timeoutMs = 15000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const url = `http://${host}:${port}`
      const resp = await fetch(url, { signal: AbortSignal.timeout(1000) })
      if (resp.ok || resp.status === 400) return
    } catch {}
    await new Promise(r => setTimeout(r, 500))
  }
  throw new Error(`Port ${port} did not open within ${timeoutMs}ms`)
}

async function main() {
  console.log("StudyHub — Dev Environment\n")

  // ─── 1. Check firebase-tools ────────────────────────────
  try { execSync("which firebase", { stdio: "ignore" }) }
  catch {
    console.error("firebase-tools not found. Run: npm install -g firebase-tools")
    process.exit(1)
  }

  // ─── 2. Start emulators in background ───────────────────
  console.log("🔥 Starting Firebase emulators...")
  const emu = spawn("firebase", ["emulators:start", "--project", "studyhub-e1f30"], {
    cwd: ROOT,
    stdio: ["ignore", "inherit", "inherit"],
  })

  process.on("SIGINT", () => { emu.kill(); process.exit() })
  process.on("SIGTERM", () => { emu.kill(); process.exit() })

  // ─── 3. Wait for emulators ──────────────────────────────
  console.log("\n⏳ Waiting for emulators...")
  await Promise.race([
    waitForPort(9099), // Auth
    waitForPort(8080), // Firestore
    waitForPort(4000), // Emulator UI
  ])
  console.log("   ✓ Emulators ready")

  // ─── 4. Seed from backup if available ───────────────────
  const latest = resolve(ROOT, "backups", "latest.json")
  if (existsSync(latest)) {
    console.log("\n📦 Seeding emulator from latest backup...")
    try {
      run("FIREBASE_EMULATOR=true node scripts/db-restore.mjs", { stdio: "pipe" })
      console.log("   ✓ Seed complete")
    } catch {
      console.log("   ⚠ Seed skipped (no backup or restore failed)")
    }
  } else {
    console.log("\n   ⏭ No backup found — emulator starts empty")
    console.log("      Run 'npm run db:backup' on production first, or")
    console.log("      use the admin panel to create data manually.")
  }

  // ─── 5. Start Next.js dev server ────────────────────────
  console.log("\n🚀 Starting Next.js dev server...")
  run("NEXT_PUBLIC_EMULATOR=true npm run dev", { stdio: "inherit" })
}

main().catch(e => {
  console.error("Dev setup failed:", e.message)
  process.exit(1)
})
