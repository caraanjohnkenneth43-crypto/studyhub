"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "./AuthProvider"
import SettingsPanel from "./SettingsPanel"
import { getAvatarColor } from "../lib/chat/gradients"

const HIDDEN_PATHS = ["/login", "/signup", "/admin", "/admin/dashboard", "/admin/console"]

export default function Navbar({
  room,
  onBack,
  onMembersToggle,
  showMembersPanel,
  membersCount,
  onMenuToggle,
  hideNavLinks,
}) {
  const { user, loading, isAdmin, isContributor, logOut } = useAuth()
  const pathname = usePathname()

  if (loading || !user) return null
  if (HIDDEN_PATHS.some((p) => pathname.startsWith(p))) return null

  // Room-aware mode
  if (room) {
    return (
      <nav
        className="flex items-center justify-between px-4 py-2 border-b shrink-0 sticky top-0 z-10"
        style={{ background: "var(--c-card)", borderColor: "var(--c-border)", height: "var(--topbar-h)" }}
      >
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-sm px-2 py-1 rounded transition-colors hover:bg-black/5" style={{ color: "var(--c-muted)" }}>
            &larr;
          </button>
          <span className="text-lg font-bold" style={{ color: "var(--c-fg)" }}>
            # {room.name || "..."}
          </span>
          <Link href="/dashboard" className="text-xs px-2 py-0.5 rounded" style={{ color: "var(--c-subtle)" }}>
            Dashboard
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs hidden sm:inline" style={{ color: "var(--c-subtle)" }}>
            {user.email}
          </span>
          <button
            onClick={onMembersToggle}
            className="text-xs px-2 py-1 rounded hover:bg-black/5 transition-colors flex items-center gap-1"
            style={{ color: "var(--c-fg)" }}
          >
            👥 {membersCount || 0}
          </button>
          <SettingsPanel />
          <button onClick={logOut} className="text-xs" style={{ color: "var(--c-subtle)" }}>
            Log out
          </button>
        </div>
      </nav>
    )
  }

  // Default mode
  return (
    <nav
      className="flex items-center justify-between px-4 py-2 border-b shrink-0 sticky top-0 z-10"
      style={{ background: "var(--c-card)", borderColor: "var(--c-border)", height: "var(--topbar-h)" }}
    >
      <div className="flex items-center gap-3">
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="text-lg px-2 py-1 rounded md:hidden hover:bg-black/5 transition-colors"
            style={{ color: "var(--c-muted)" }}
          >
            ☰
          </button>
        )}
        <Link href="/dashboard" className="text-sm font-bold" style={{ color: "var(--c-fg)" }}>
          StudyHub
        </Link>
      </div>
      <div className="flex items-center gap-2">
        {(isAdmin || isContributor) && (
          <Link
            href="/admin/dashboard"
            className="text-xs px-2 py-1 rounded"
            style={{ background: "var(--c-bg)", color: "var(--c-subtle)" }}
          >
            Admin
          </Link>
        )}
        {isAdmin && (
          <Link
            href="/admin/console"
            className="text-xs px-2 py-1 rounded font-mono"
            style={{ background: "#1a1a1a", color: "#00ff00" }}
          >
            &gt;_ Console
          </Link>
        )}
        <SettingsPanel />
        <Link href="/profile" className="text-xs hidden sm:inline" style={{ color: "var(--c-subtle)" }}>
          {user.email}
        </Link>
        <button onClick={logOut} className="text-xs px-2 py-1 rounded" style={{ color: "var(--c-subtle)" }}>
          Log out
        </button>
      </div>
    </nav>
  )
}
