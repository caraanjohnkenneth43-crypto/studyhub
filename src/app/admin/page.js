"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "../AuthProvider"

export default function AdminPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push("/admin/dashboard")
      } else {
        router.push("/login")
      }
    }
  }, [user, loading, router])

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--c-bg)", color: "var(--c-subtle)" }}>
      Redirecting...
    </div>
  )
}
