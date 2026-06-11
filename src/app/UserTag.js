"use client"

import { getGradientClass } from "@/lib/constants"

const AVATAR_COLORS = [
  "#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899",
  "#06b6d4", "#84cc16", "#f97316", "#6366f1", "#14b8a6", "#d946ef",
]

function hashCode(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

export function getAvatarColor(email) {
  return AVATAR_COLORS[hashCode(email || "") % AVATAR_COLORS.length]
}

export function getInitials(name, email) {
  const str = name || email || "?"
  const parts = str.split(/[@\s.]+/)
  return parts[0]?.[0]?.toUpperCase() + (parts[1]?.[0]?.toUpperCase() || "") || "?"
}

export function Avatar({ email, name, size = 28, role }) {
  const bg = role === "admin" ? "linear-gradient(135deg, #f59e0b, #ef4444)"
    : role === "contributor" ? "linear-gradient(135deg, #8b5cf6, #ec4899)"
    : getAvatarColor(email)
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold shrink-0"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        background: bg,
      }}
    >
      {getInitials(name, email)}
    </div>
  )
}

export function UserNameTag({ email, name, role, admins, contributors, gradient }) {
  const gradientClass = gradient || getGradientClass(email, admins || [], contributors || [])
  const userRole = role || (admins?.includes(email) ? "admin" : contributors?.includes(email) ? "contributor" : null)

  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg" style={{
      background: "rgba(0,0,0,0.06)",
      backdropFilter: "blur(4px)",
      WebkitBackdropFilter: "blur(4px)",
    }}>
      <Avatar email={email} name={name} size={16} role={userRole} />
      <span className={gradientClass} style={{ color: gradientClass ? undefined : "var(--c-fg)" }}>
        {name || email?.split("@")[0] || "Unknown"}
      </span>
    </span>
  )
}
