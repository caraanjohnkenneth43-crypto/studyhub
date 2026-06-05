/**
 * Chat password gate helpers.
 * @checkTypes
 */

import { LS } from "@/lib/constants"

/**
 * Check if the current user has a stored password for a room.
 */
export function hasStoredPassword(roomId) {
  try {
    const stored = JSON.parse(localStorage.getItem(LS.PASSWORDS) || "{}")
    return stored[roomId] || null
  } catch {
    return null
  }
}

/**
 * Save a password for a room to localStorage.
 */
export function savePassword(roomId, password) {
  try {
    const stored = JSON.parse(localStorage.getItem(LS.PASSWORDS) || "{}")
    stored[roomId] = password
    localStorage.setItem(LS.PASSWORDS, JSON.stringify(stored))
  } catch {}
}

/**
 * Get all stored passwords (for notification filtering).
 */
export function getStoredPasswords() {
  try {
    return JSON.parse(localStorage.getItem(LS.PASSWORDS) || "{}")
  } catch {
    return {}
  }
}
