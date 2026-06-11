"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "./AuthProvider"
import SettingsPanel from "./SettingsPanel"

const HIDDEN_PATHS = ["/login", "/signup", "/admin", "/admin/dashboard", "/admin/console"]

export default function Navbar() {
  const { user, loading, isAdmin, isContributor, logOut } = useAuth()
  const pathname = usePathname()

  if (loading || !user) return null
  if (HIDDEN_PATHS.some(p => pathname.startsWith(p))) return null

  return (
    <nav className="flex items-center justify-between px-4 py-2 border-b shrink-0" style={{ background: "var(--c-card)", borderColor: "var(--c-border)" }}>
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="text-sm font-bold" style={{ color: "var(--c-fg)" }}>
          StudyHub
        </Link>
        <Link href="/dashboard" className="text-xs" style={{ color: pathname.startsWith("/dashboard") ? "var(--c-accent)" : "var(--c-subtle)" }}>
          Dashboard
        </Link>
        <Link href="/chat" className="text-xs" style={{ color: pathname.startsWith("/chat") ? "var(--c-accent)" : "var(--c-subtle)" }}>
          Chat
        </Link>
        <Link href="/dm" className="text-xs" style={{ color: pathname.startsWith("/dm") ? "var(--c-accent)" : "var(--c-subtle)" }}>
          Messages
        </Link>
        <Link href="/calculator" className="text-xs" style={{ color: pathname === "/calculator" ? "var(--c-accent)" : "var(--c-subtle)" }}>
          Calculator
        </Link>
        <Link href="/browse-quizzes" className="text-xs" style={{ color: pathname === "/browse-quizzes" || pathname === "/create-quiz" ? "var(--c-accent)" : "var(--c-subtle)" }}>
          Quiz Sets
        </Link>
      </div>
      <div className="flex items-center gap-2">
        {(isAdmin || isContributor) && (
          <Link href="/admin/dashboard" className="text-xs px-2 py-1 rounded" style={{ background: "var(--c-bg)", color: "var(--c-subtle)" }}>
            Admin
          </Link>
        )}
        {isAdmin && (
          <Link href="/admin/console" className="text-xs px-2 py-1 rounded font-mono" style={{ background: "#1a1a1a", color: "#00ff00" }}>
            &gt;_ Console
          </Link>
        )}
        <SettingsPanel />
        <Link href="/profile" className="text-xs hidden sm:inline" style={{ color: "var(--c-subtle)" }}>{user.email}</Link>
        <button onClick={logOut} className="text-xs px-2 py-1 rounded" style={{ color: "var(--c-subtle)" }}>
          Log out
        </button>
      </div>
    </nav>
  )
}
