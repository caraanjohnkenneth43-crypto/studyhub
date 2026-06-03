"use client"

import Link from "next/link"
import { useAuth } from "./AuthProvider"

export default function AuthNav() {
  const { user } = useAuth()

  if (user) {
    return (
      <Link
        href="/admin/dashboard"
        className="text-xs transition-colors px-2 py-1 rounded"
        style={{ color: "var(--c-subtle)" }}
      >
        Dashboard
      </Link>
    )
  }

  return (
    <Link
      href="/login"
      className="text-xs transition-colors px-2 py-1 rounded"
      style={{ color: "var(--c-subtle)" }}
    >
      Log In
    </Link>
  )
}
