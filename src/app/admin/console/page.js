"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "../../AuthProvider"

export default function DevConsole() {
  const { user, loading, isAdmin, role } = useAuth()
  const router = useRouter()
  const [logs, setLogs] = useState([])
  const [input, setInput] = useState("")
  const logEndRef = useRef(null)

  useEffect(() => {
    if (!loading) {
      if (!user) router.push("/login")
      else if (role && role !== "admin") router.push("/admin/dashboard")
    }
  }, [user, loading, router, role])

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [logs])

  const addLog = (text, type) => {
    setLogs(prev => [...prev, { text, type: type || "info", time: new Date().toLocaleTimeString() }])
  }

  const runCommand = async (cmd) => {
    addLog(`> ${cmd}`, "command")

    const parts = cmd.trim().split(/\s+/)
    const action = parts[0].toLowerCase()

    switch (action) {
      case "help":
        addLog("Available commands:", "info")
        addLog("  help              — Show this help", "info")
        addLog("  logs              — Show session log count", "info")
        addLog("  whoami            — Show current user info", "info")
        addLog("  rooms             — List all chat rooms", "info")
        addLog("  room-password <id> — Reveal password for a private room (if stored)", "info")
        addLog("  clear             — Clear console", "info")
        addLog("  users count       — Show total registered users", "info")
        break

      case "clear":
        setLogs([])
        return

      case "whoami":
        addLog(`Email: ${user?.email}`, "info")
        addLog(`UID: ${user?.uid}`, "info")
        addLog(`Role: ${role}`, "info")
        addLog(`Display name: ${user?.displayName || "none"}`, "info")
        break

      case "logs":
        addLog(`Session has ${logs.length} log entries`, "info")
        break

      case "rooms":
        try {
          const res = await fetch("/api/chat/rooms")
          const data = await res.json()
          if (data.rooms?.length) {
            data.rooms.forEach(r => addLog(`[${r.type}] ${r.name} (${r.id}) — ${r.messageCount || 0} msgs`, "info"))
          } else {
            addLog("No rooms found", "info")
          }
        } catch {
          addLog("Failed to fetch rooms", "error")
        }
        break

      case "room-password":
        if (parts.length < 2) {
          addLog("Usage: room-password <room-id>", "error")
          return
        }
        try {
          const res = await fetch(`/api/chat/rooms/${parts[1]}`)
          const data = await res.json()
          if (data.password) {
            addLog(`Password for "${data.name}": ${data.password}`, "success")
          } else {
            addLog(`Room "${data.name}" is public (no password)`, "info")
          }
        } catch {
          addLog("Failed to fetch room", "error")
        }
        break

      case "users":
        if (parts[1] === "count") {
          try {
            const res = await fetch("/api/users")
            const data = await res.json()
            addLog(`Total users: ${data.users?.length || data.length || 0}`, "info")
          } catch {
            addLog("Failed to fetch users", "error")
          }
        } else {
          addLog("Usage: users count", "error")
        }
        break

      default:
        addLog(`Unknown command: ${action}. Type 'help' for available commands.`, "error")
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!input.trim()) return
    runCommand(input.trim())
    setInput("")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a0a0a", color: "#666" }}>
        Loading...
      </div>
    )
  }

  if (!user || (role && role !== "admin")) {
    return null
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#0a0a0a" }}>
      <header className="flex items-center justify-between px-6 py-3 border-b" style={{ borderColor: "#1a1a1a" }}>
        <div className="flex items-center gap-4">
          <h1 className="text-base font-bold" style={{ color: "#00ff00" }}>DEV CONSOLE</h1>
          <span className="text-xs px-2 py-0.5 rounded" style={{ background: "#1a1a1a", color: "#666" }}>v0.1</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs" style={{ color: "#555" }}>{user.email}</span>
          <button onClick={() => router.push("/admin/dashboard")} className="text-xs px-3 py-1.5 rounded" style={{ background: "#1a1a1a", color: "#888" }}>Admin Dashboard</button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 font-mono text-sm" style={{ background: "#0a0a0a", height: "calc(100vh - 100px)" }}>
        <div className="mb-4 text-xs" style={{ color: "#555" }}>
          Type 'help' for available commands.
        </div>
        {logs.length === 0 && (
          <div className="text-xs" style={{ color: "#333" }}>
            &gt; Console ready. Waiting for input...
          </div>
        )}
        {logs.map((log, i) => (
          <div key={i} className="py-0.5" style={{
            color: log.type === "error" ? "#ff4444"
              : log.type === "success" ? "#00ff00"
              : log.type === "command" ? "#ffaa00"
              : "#cccccc",
          }}>
            <span className="opacity-50 mr-2">[{log.time}]</span>{log.text}
          </div>
        ))}
        <div ref={logEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2 px-4 py-3 border-t" style={{ borderColor: "#1a1a1a", background: "#0d0d0d" }}>
        <span className="text-xs font-mono" style={{ color: "#00ff00" }}>&gt;</span>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type a command..."
          className="flex-1 bg-transparent text-sm font-mono outline-none"
          style={{ color: "#00ff00", caretColor: "#00ff00" }}
          autoFocus
        />
      </form>
    </div>
  )
}
