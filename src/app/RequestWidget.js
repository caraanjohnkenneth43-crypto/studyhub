"use client"

import { useState } from "react"

export default function RequestWidget() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [message, setMessage] = useState("")
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!message.trim()) return
    setSending(true)
    setError(false)
    try {
      const res = await fetch("/api/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), message: message.trim() }),
      })
      const data = await res.json()
      if (data.success) {
        setSent(true)
        setSending(false)
      } else {
        throw new Error()
      }
    } catch {
      setError(true)
      setSending(false)
    }
  }

  const reset = () => {
    setOpen(false)
    setSent(false)
    setMessage("")
    setName("")
    setError(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed left-0 top-1/3 z-40 px-3 py-4 rounded-r-lg text-sm font-bold shadow-md transition-colors"
        style={{ background: "#7c3aed", color: "white" }}
        title="Request a feature"
      >
        Request
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={reset}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="rounded-xl border shadow-xl p-6 w-full max-w-sm mx-4"
            style={{ background: "var(--c-card)", borderColor: "var(--c-border)", color: "var(--c-fg)" }}
          >
            {sent ? (
              <div className="text-center py-4">
                <div className="text-3xl mb-2">🚀</div>
                <h3 className="font-semibold" style={{ color: "var(--c-fg)" }}>Request sent!</h3>
                <p className="text-sm mt-1" style={{ color: "var(--c-muted)" }}>Kenneth will review your suggestion.</p>
                <button onClick={reset} className="mt-4 text-sm underline" style={{ color: "#7c3aed" }}>Close</button>
              </div>
            ) : (
              <>
                <h3 className="font-semibold mb-1" style={{ color: "var(--c-fg)" }}>Request a Feature</h3>
                <p className="text-xs mb-4" style={{ color: "var(--c-muted)" }}>Suggest something you'd like added to StudyHub.</p>
                <form onSubmit={submit} className="space-y-3">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name (optional)"
                    className="w-full px-3 py-2 rounded-lg text-sm border"
                    style={{ background: "var(--c-bg)", borderColor: "var(--c-border)", color: "var(--c-fg)" }}
                  />
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe the feature you'd like..."
                    rows={4}
                    required
                    className="w-full px-3 py-2 rounded-lg text-sm border resize-none"
                    style={{ background: "var(--c-bg)", borderColor: "var(--c-border)", color: "var(--c-fg)" }}
                  />
                  {error && <p className="text-xs" style={{ color: "#ef4444" }}>Something went wrong. Try again.</p>}
                  <button
                    type="submit"
                    disabled={sending || !message.trim()}
                    className="w-full py-2 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
                    style={{ background: "#7c3aed" }}
                  >
                    {sending ? "Sending..." : "Send Request"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
