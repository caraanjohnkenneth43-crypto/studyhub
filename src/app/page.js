"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "./AuthProvider"
import SettingsPanel from "./SettingsPanel"

export default function LandingPage() {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user) {
      router.push("/dashboard")
    }
  }, [user, router])

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--c-bg)" }}>
      <header className="flex justify-end p-4">
        <SettingsPanel />
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="text-center max-w-lg">
          <div className="text-6xl mb-6">📚</div>
          <h1 className="text-4xl font-bold mb-3" style={{ color: "var(--c-fg)" }}>StudyHub</h1>
          <p className="text-lg mb-8 leading-relaxed" style={{ color: "var(--c-muted)" }}>
            A hub of information and study materials where you don&apos;t have to access your Chromebook to get to them.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/login"
              className="px-6 py-3 rounded-lg text-white font-medium transition-colors"
              style={{ background: "#2563eb" }}
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="px-6 py-3 rounded-lg font-medium transition-colors border"
              style={{
                color: "var(--c-fg)",
                borderColor: "var(--c-border)",
                background: "var(--c-card)",
              }}
            >
              Sign Up
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
