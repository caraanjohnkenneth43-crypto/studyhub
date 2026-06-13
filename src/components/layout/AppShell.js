"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { useAuth } from "@/app/AuthProvider"
import Sidebar from "./Sidebar"
import Link from "next/link"
import SettingsPanel from "@/app/SettingsPanel"

const ROOM_PATHS = [/^\/chat\/[^/]+$/, /^\/dm\/[^/]+$/, /^\/quiz\//]
const HIDDEN_PATHS = ["/login", "/signup", "/admin", "/admin/dashboard", "/admin/console"]

function isRoomPath(pathname) {
  return ROOM_PATHS.some((re) => re.test(pathname))
}

export default function AppShell({ children }) {
  const pathname = usePathname()
  const { user, loading, isAdmin, isContributor, logOut } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const inRoom = isRoomPath(pathname)
  const hidden = HIDDEN_PATHS.some((p) => pathname.startsWith(p))

  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  if (loading || !user) return <>{children}</>
  if (hidden) return <>{children}</>
  if (inRoom) return <>{children}</>

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "var(--c-bg)" }}>
      <nav
        className="flex items-center justify-between px-4 py-2 border-b shrink-0 sticky top-0 z-10"
        style={{ background: "var(--c-card)", borderColor: "var(--c-border)", height: "var(--topbar-h)" }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="text-lg px-2 py-1 rounded md:hidden hover:bg-black/5 transition-colors"
            style={{ color: "var(--c-muted)" }}
          >
            ☰
          </button>
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
      <div className="flex flex-1">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main
          className="flex-1 flex flex-col min-w-0"
          style={{ maxWidth: "1200px", margin: "0 auto", width: "100%" }}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
