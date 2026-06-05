/**
 * Gradient resolution for chat usernames and admin user lists.
 * Pure functions — no React dependency.
 * @checkTypes
 */

import { ADMIN_EMAILS, GRADIENTS } from "@/lib/constants"

/** Map of uid → email for old-message resolution. */
export const EMPTY_UID_MAP = {}

/**
 * Resolve display email for a chat message.
 * New messages have userEmail; old ones need uid → email lookup.
 */
export function resolveMessageEmail(msg, uidToEmail) {
  return msg.userEmail || (uidToEmail || EMPTY_UID_MAP)[msg.userId] || null
}

/**
 * Determine gradient class and color for a chat message sender name.
 * Returns { className, styleColor }.
 */
export function getMessageNameStyle(email, isOwn, admins, contributors) {
  if (!email) {
    return { className: "", styleColor: isOwn ? "#3b82f6" : "var(--c-fg)" }
  }
  const isAdmin = admins.includes(email)
  const isContributor = !isAdmin && contributors.includes(email)

  if (isAdmin) return { className: GRADIENTS.admin, styleColor: undefined }
  if (isContributor) return { className: GRADIENTS.contributor, styleColor: undefined }
  return { className: "", styleColor: isOwn ? "#3b82f6" : "var(--c-fg)" }
}

/**
 * Build uid→email map from /api/users response and Firestore users collection.
 */
export function buildUidToEmailMap(users, usersSnap) {
  const map = {}
  if (users) {
    users.forEach(u => {
      if (u.uid && u.email) map[u.uid] = u.email
    })
  }
  if (usersSnap) {
    usersSnap.forEach(d => {
      const data = d.data()
      if (data.uid && data.email) map[data.uid] = data.email
    })
  }
  return map
}
