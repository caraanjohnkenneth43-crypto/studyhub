/**
 * Chat moderation helpers (block/unblock).
 * @checkTypes
 */

/**
 * Check if a user's email is blocked in a room.
 */
export function isBlocked(room, email) {
  if (!room || !email) return false
  return (room.blocked || []).includes(email)
}

/**
 * Add a blocked user to the room's blocked list.
 */
export function addBlocked(room, email) {
  return [...(room.blocked || []), email]
}

/**
 * Remove a blocked user from the room's blocked list.
 */
export function removeBlocked(room, email) {
  return (room.blocked || []).filter(e => e !== email)
}
