"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import SettingsPanel from "../SettingsPanel"

export default function AdminLogin() {
  const [password, setPassword] = useState("")
  const [error, setError] = useState(false)
  const router = useRouter()

  const handleLogin = (e) => {
    e.preventDefault()
    if (password === "studyhub2024") {
      router.push("/admin/dashboard")
    } else {
      setError(true)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--c-bg)" }}>
      <div style={{ background: "var(--c-card)", borderColor: "var(--c-border)" }} className="rounded-xl border p-8 max-w-sm w-full mx-4">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-xl font-bold" style={{ color: "var(--c-fg)" }}>Admin Login</h1>
          <SettingsPanel />
        </div>
        <p className="text-sm mb-6" style={{ color: "var(--c-muted)" }}>Enter the admin password to continue.</p>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(false) }}
              placeholder="Password"
              className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 border"
              style={{
                background: "var(--c-bg)",
                borderColor: "var(--c-border)",
                color: "var(--c-fg)",
                "--tw-ring-color": "#3b82f6",
              }}
            />
            {error && <p className="text-xs mt-1" style={{ color: "#ef4444" }}>Incorrect password.</p>}
          </div>
          <button
            type="submit"
            className="w-full py-2 text-white rounded-lg text-sm font-medium transition-colors"
            style={{ background: "#2563eb" }}
          >
            Log In
          </button>
        </form>
        <a href="/" className="block text-center text-xs mt-4" style={{ color: "var(--c-subtle)" }}>&larr; Back to site</a>
      </div>
    </div>
  )
}