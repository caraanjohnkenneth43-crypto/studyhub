"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "../AuthProvider"
import SettingsPanel from "../SettingsPanel"
import { auth } from "@/lib/firebase"
import { signInWithCustomToken } from "firebase/auth"
import { ADMIN_EMAILS } from "@/lib/constants"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showDev, setShowDev] = useState(false)
  const clickCount = useRef(0)
  const { logIn } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await logIn(email, password)
      router.push("/dashboard")
    } catch (err) {
      setError(err.message.replace("Firebase: ", "").replace(/\(.*\)/, ""))
    }
    setLoading(false)
  }

  const devLogin = async (adminEmail) => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/dev-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: adminEmail }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      await signInWithCustomToken(auth, data.token)
      router.push("/dashboard")
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  const handleTitleClick = () => {
    clickCount.current += 1
    if (clickCount.current >= 5) {
      setShowDev(true)
      clickCount.current = 0
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--c-bg)" }}>
      <div style={{ background: "var(--c-card)", borderColor: "var(--c-border)" }} className="rounded-xl border p-8 max-w-sm w-full mx-4">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-xl font-bold cursor-pointer select-none" style={{ color: "var(--c-fg)" }} onClick={handleTitleClick}>Log In</h1>
          <SettingsPanel />
        </div>
        <p className="text-sm mb-6" style={{ color: "var(--c-muted)" }}>Sign in with your account.</p>

        {showDev && (
          <div className="mb-6 rounded-lg border p-4" style={{ background: "var(--c-bg)", borderColor: "var(--c-border)" }}>
            <p className="text-xs font-semibold mb-2" style={{ color: "var(--c-muted)" }}>Quick Login</p>
            <div className="flex flex-col gap-1.5">
              {ADMIN_EMAILS.map(adminEmail => (
                <button
                  key={adminEmail}
                  onClick={() => devLogin(adminEmail)}
                  disabled={loading}
                  className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:bg-black/5 disabled:opacity-50"
                  style={{ color: "var(--c-fg)", background: "var(--c-card)" }}
                >
                  {adminEmail}
                </button>
              ))}
            </div>
            <button onClick={() => setShowDev(false)} className="text-xs mt-2" style={{ color: "var(--c-subtle)" }}>Hide</button>
          </div>
        )}

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
            style={{ background: "var(--c-accent)" }}
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
