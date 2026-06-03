"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

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
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white rounded-xl border border-slate-200 p-8 max-w-sm w-full mx-4">
        <h1 className="text-xl font-bold text-slate-900 mb-1">Admin Login</h1>
        <p className="text-sm text-slate-500 mb-6">Enter the admin password to continue.</p>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(false) }}
              placeholder="Password"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            {error && <p className="text-xs text-red-500 mt-1">Incorrect password.</p>}
          </div>
          <button
            type="submit"
            className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Log In
          </button>
        </form>
        <a href="/" className="block text-center text-xs text-slate-400 mt-4 hover:underline">&larr; Back to site</a>
      </div>
    </div>
  )
}