"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "../AuthProvider"
import SettingsPanel from "../SettingsPanel"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { logIn } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await logIn(email, password)
      router.push("/admin/dashboard")
    } catch (err) {
      setError(err.message.replace("Firebase: ", "").replace(/\(.*\)/, ""))
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--c-bg)" }}>
      <div style={{ background: "var(--c-card)", borderColor: "var(--c-border)" }} className="rounded-xl border p-8 max-w-sm w-full mx-4">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-xl font-bold" style={{ color: "var(--c-fg)" }}>Log In</h1>
          <SettingsPanel />
        </div>
        <p className="text-sm mb-6" style={{ color: "var(--c-muted)" }}>Sign in with your account.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 border"
              style={{
                background: "var(--c-bg)",
                borderColor: "var(--c-border)",
                color: "var(--c-fg)",
              }}
            />
          </div>
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 border"
              style={{
                background: "var(--c-bg)",
                borderColor: "var(--c-border)",
                color: "var(--c-fg)",
              }}
            />
          </div>
          {error && <p className="text-xs" style={{ color: "#ef4444" }}>{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
            style={{ background: "#2563eb" }}
          >
            {loading ? "Signing in..." : "Log In"}
          </button>
        </form>
        <p className="text-xs text-center mt-4" style={{ color: "var(--c-muted)" }}>
          Don't have an account? <Link href="/signup" className="underline" style={{ color: "#3b82f6" }}>Sign up</Link>
        </p>
        <Link href="/" className="block text-center text-xs mt-2" style={{ color: "var(--c-subtle)" }}>&larr; Back to site</Link>
      </div>
    </div>
  )
}
