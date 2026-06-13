"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/app/AuthProvider"

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/chat", label: "Chat", icon: "💬" },
  { href: "/dm", label: "Messages", icon: "✉️" },
  { href: "/profile", label: "Profile", icon: "👤" },
]

export default function Sidebar({ open, onClose }) {
  const pathname = usePathname()
  const { isAdmin, isContributor } = useAuth()

  const isActive = (href) => {
    if (href === "/dashboard") return pathname === "/dashboard" || pathname.startsWith("/dashboard/")
    return pathname.startsWith(href)
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-20 md:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`
          fixed md:sticky top-0 md:top-[var(--topbar-h)] h-[calc(100vh-var(--topbar-h))]
          w-[var(--sidebar-w)] shrink-0 border-r z-30
          transition-transform duration-[var(--motion-base)] ease-[var(--motion-ease)]
          flex flex-col
          ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
        style={{
          background: "var(--c-card)",
          borderColor: "var(--c-border)",
        }}
      >
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {NAV.map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-sm transition-colors duration-[var(--motion-fast)]"
              style={{
                background: isActive(href) ? "var(--c-accent)" : "transparent",
                color: isActive(href) ? "#fff" : "var(--c-fg)",
              }}
              onMouseEnter={(e) => {
                if (!isActive(href)) e.currentTarget.style.background = "var(--c-bg)"
              }}
              onMouseLeave={(e) => {
                if (!isActive(href)) e.currentTarget.style.background = "transparent"
              }}
            >
              <span className="text-lg">{icon}</span>
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t space-y-1" style={{ borderColor: "var(--c-border)" }}>
          {(isAdmin || isContributor) && (
            <Link
              href="/admin/dashboard"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] text-sm"
              style={{
                color: pathname.startsWith("/admin") ? "var(--c-accent)" : "var(--c-subtle)",
              }}
            >
              🔧 Admin
            </Link>
          )}
          {isAdmin && (
            <Link
              href="/admin/console"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] text-sm"
              style={{ color: "var(--c-subtle)" }}
            >
              &gt;_ Console
            </Link>
          )}
        </div>
      </aside>
    </>
  )
}
