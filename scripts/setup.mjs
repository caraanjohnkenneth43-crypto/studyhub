// StudyHub One-Command Dev Setup
// Usage: node scripts/setup.mjs
// Installs deps, copies .env.example, checks Firebase emulators, seeds data.

import { existsSync, copyFileSync, readFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"
import { execSync } from "child_process"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, "..")

function run(cmd) {
  console.log(`\n> ${cmd}`)
  execSync(cmd, { cwd: ROOT, stdio: "inherit" })
}

function check(label, condition, hint) {
  if (condition) {
    console.log(`  ✓ ${label}`)
  } else {
    console.log(`  ⚠ ${label} — ${hint}`)
  }
}

console.log("StudyHub — Dev Setup\n")

// ─── 1. Node version ──────────────────────────────────────
run("node --version")
run("npm --version")

// ─── 2. Install deps ──────────────────────────────────────
if (!existsSync(resolve(ROOT, "node_modules"))) {
  console.log("\n📦 Installing dependencies...")
  run("npm install")
} else {
  console.log("  ✓ node_modules exists")
}

// ─── 3. .env.local ────────────────────────────────────────
const envExample = resolve(ROOT, ".env.example")
const envLocal = resolve(ROOT, ".env.local")
if (!existsSync(envLocal)) {
  console.log("\n📝 Creating .env.local from .env.example...")
  copyFileSync(envExample, envLocal)
  console.log("  ⚠ Edit .env.local and add your FIREBASE_SERVICE_ACCOUNT")
} else {
  console.log("  ✓ .env.local exists")
}

// ─── 4. Check FIREBASE_SERVICE_ACCOUNT ────────────────────
try {
  const envRaw = readFileSync(envLocal, "utf-8")
  const hasSa = envRaw.includes("FIREBASE_SERVICE_ACCOUNT=") && !envRaw.match(/FIREBASE_SERVICE_ACCOUNT=\n/)
  check("FIREBASE_SERVICE_ACCOUNT set", hasSa, "Add your service account JSON to .env.local")
} catch {
  check("FIREBASE_SERVICE_ACCOUNT set", false, ".env.local not readable")
}

// ─── 5. Check Firebase emulators ──────────────────────────
try {
  execSync("which firebase", { stdio: "ignore" })
  console.log("  ✓ Firebase CLI installed")
  try {
    execSync("firebase emulators:exec --help", { stdio: "ignore" })
    console.log("  ✓ Firebase emulators available")
  } catch {
    console.log("  ⚠ Firebase emulators not started — run: firebase emulators:start")
  }
} catch {
  console.log("  ⚠ Firebase CLI not installed — run: npm install -g firebase-tools")
}

// ─── 6. Check .gitignore ──────────────────────────────────
const gitignore = resolve(ROOT, ".gitignore")
if (existsSync(gitignore)) {
  const content = readFileSync(gitignore, "utf-8")
  check("backups/ in .gitignore", content.includes("backups/"), "Add 'backups/' to .gitignore")
}

// ─── 7. Build check ───────────────────────────────────────
console.log("\n🔍 Running build check...")
try {
  execSync("npm run build", { cwd: ROOT, stdio: "pipe", timeout: 60000 })
  console.log("  ✓ Build passes")
} catch {
  console.log("  ⚠ Build has errors — run 'npm run build' to see details")
}

console.log("\n✅ Setup complete. Run 'npm run dev' to start.")
