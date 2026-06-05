/**
 * @fileoverview Centralized configuration for StudyHub.
 * Every hardcoded value lives here — import, don't duplicate.
 * @checkTypes
 */

// ─── Admin Access ───────────────────────────────────────────
/** Emails with full admin privileges. */
export const ADMIN_EMAILS = [
  "john.caraan@student.nhsau64.gov",
  "dev@studyhub.local",
]

// ─── Gradients (used in chat messages + admin Users tab) ────
export const GRADIENTS = {
  admin: "font-bold bg-gradient-to-r from-gray-700 via-gray-300 to-white bg-clip-text text-transparent",
  contributor: "font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent",
}

/** Resolve gradient class for a user email. Returns one of GRADIENTS or "". */
export function getGradientClass(email, admins, contributors) {
  if (!email) return ""
  if (admins.includes(email)) return GRADIENTS.admin
  if (contributors.includes(email)) return GRADIENTS.contributor
  return ""
}

/** Resolve text color for a name span. undefined = let gradient win, else explicit. */
export function getNameColor(email, isOwn, admins, contributors) {
  if (!email) return isOwn ? "#3b82f6" : "var(--c-fg)"
  if (admins.includes(email) || contributors.includes(email)) return undefined
  return isOwn ? "#3b82f6" : "var(--c-fg)"
}

// ─── Gradients for admin dashboard (no font-bold on contributor) ──
export const ADMIN_GRADIENTS = {
  admin: "font-bold bg-gradient-to-r from-gray-700 via-gray-300 to-white bg-clip-text text-transparent",
  contributor: "bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent",
}

export function getAdminGradientClass(email, admins, contributors) {
  if (!email) return ""
  if (admins.includes(email)) return ADMIN_GRADIENTS.admin
  if (contributors.includes(email) && !admins.includes(email)) return ADMIN_GRADIENTS.contributor
  return ""
}

// ─── localStorage Keys ──────────────────────────────────────
export const LS = {
  SETTINGS: "studyhub-settings",
  PASSWORDS: "chat-passwords",
  NOTIF_TIMESTAMPS: "studyhub-notif-timestamps",
  CLASSROOMS: "studyhub-classrooms",
}

// ─── Default Settings ───────────────────────────────────────
export const DEFAULT_SETTINGS = {
  dark: false,
  fontSize: 16,
}

export const LEGACY_FONT_MAP = { small: 14, medium: 16, large: 18 }

// ─── Firebase ───────────────────────────────────────────────
export const FIRESTORE = {
  APP_DATA: { collection: "app", doc: "data" },
  FEEDBACK: "feedback",
  REQUESTS: "requests",
  CHAT_ROOMS: "chatRooms",
  USERS: "users",
  PRESENCE: "presence",
}

// ─── Colors ─────────────────────────────────────────────────
export const COLORS = {
  BLUE: "#3b82f6",
  BLUE_BG: "#2563eb",
  RED: "#ef4444",
  GREEN: "#16a34a",
  WHITE: "#ffffff",
}
