"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "./AuthProvider"
import SettingsPanel from "./SettingsPanel"

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "📚" },
  { href: "/dashboard/2029", label: "Classroom", icon: "🏫" },
  { href: "/chat", label: "Chat", icon: "💬" },
  { href: "/dm", label: "Messages", icon: "✉️" },
  { href: "/calculator", label: "Calculator", icon: "🧮" },
]

export default function AppShell({ children }) {
  const { user, isAdmin, isContributor, logOut } = useAuth()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--c-bg)" }}>
      <header className="flex items-center justify-between px-4 py-2.5 border-b shrink-0" style={{ background: "var(--c-card)", borderColor: "var(--c-border)" }}>
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-lg leading-none px-1.5 py-1 rounded md:hidden" style={{ color: "var(--c-fg)" }}>
            ☰
          </button>
          <Link href="/dashboard" className="text-base font-bold" style={{ color: "var(--c-fg)" }}>
            StudyHub
          </Link>
        </div>
        <div className="flex items-center gap-2">
          {(isAdmin || isContributor) && (
            <Link href="/admin/dashboard" className="text-xs px-2.5 py-1.5 rounded-lg" style={{ background: "var(--c-bg)", color: "var(--c-subtle)" }}>
              Admin
            </Link>
          )}
          {isAdmin && (
            <Link href="/admin/console" className="text-xs px-2.5 py-1.5 rounded-lg font-mono" style={{ background: "#1a1a1a", color: "#00ff00" }}>
              &gt;_ Console
            </Link>
          )}
          <SettingsPanel />
          <span className="text-xs hidden sm:inline" style={{ color: "var(--c-subtle)" }}>{user?.email}</span>
          <button onClick={logOut} className="text-xs px-2 py-1 rounded" style={{ color: "var(--c-subtle)" }}>Log out</button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        <aside className={`w-56 shrink-0 border-r overflow-y-auto transition-all ${sidebarOpen ? "block" : "hidden"} md:block`} style={{ background: "var(--c-card)", borderColor: "var(--c-border)" }}>
          <nav className="p-3 space-y-1">
            {NAV_ITEMS.map(item => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors"
                  style={{
                    background: isActive ? "var(--c-bg)" : "transparent",
                    color: isActive ? "var(--c-accent)" : "var(--c-fg)",
                    fontWeight: isActive ? 600 : 400,
                  }}
                >
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </aside>

        <main className="flex-1 min-w-0 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
