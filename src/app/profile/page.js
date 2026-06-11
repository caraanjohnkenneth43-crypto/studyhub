"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "../AuthProvider"
import { updateProfile } from "firebase/auth"
import { auth } from "@/lib/firebase"

export default function ProfilePage() {
  const { user, loading, logOut } = useAuth()
  const router = useRouter()
  const [displayName, setDisplayName] = useState("")
  const [scores, setScores] = useState([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.push("/login")
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || "")
      fetch(`/api/score?uid=${user.uid}`).then(r => r.json()).then(d => setScores(d.scores || []))
    }
  }, [user])

  const saveName = async () => {
    if (!user || !displayName.trim()) return
    setSaving(true)
    try {
      await updateProfile(auth.currentUser, { displayName: displayName.trim() })
      await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: user.uid, displayName: displayName.trim() }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {}
    setSaving(false)
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--c-bg)", color: "var(--c-subtle)" }}>
        Loading...
      </div>
    )
  }

  const totalQuizzes = scores.length
  const avgScore = scores.length ? Math.round((scores.reduce((s, x) => s + x.score / x.total, 0) / scores.length) * 100) : 0
  const bestScore = scores.length ? Math.round(Math.max(...scores.map(x => x.score / x.total)) * 100) : 0

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6" style={{ color: "var(--c-fg)" }}>
      <div className="card space-y-4">
        <h1 className="text-xl font-bold">Profile</h1>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white" style={{ background: "var(--c-accent)" }}>
            {(displayName || user.email)?.[0]?.toUpperCase() || "?"}
          </div>
          <div>
            <div className="font-semibold text-lg">{displayName || user.email?.split("@")[0]}</div>
            <div className="text-sm" style={{ color: "var(--c-muted)" }}>{user.email}</div>
          </div>
        </div>
      </div>

      <div className="card space-y-3">
        <h2 className="text-base font-semibold">Display Name</h2>
        <div className="flex gap-2">
          <input value={displayName} onChange={e => setDisplayName(e.target.value)} className="flex-1 px-3 py-2 rounded-lg border text-sm" style={{ background: "var(--c-bg)", borderColor: "var(--c-border)", color: "var(--c-fg)" }} />
          <button onClick={saveName} disabled={saving} className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50" style={{ background: "var(--c-accent)" }}>
            {saving ? "Saving..." : saved ? "Saved!" : "Save"}
          </button>
        </div>
      </div>

      <div className="card space-y-3">
        <h2 className="text-base font-semibold">Quiz Stats</h2>
        {scores.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--c-subtle)" }}>No quizzes taken yet.</p>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 rounded-lg" style={{ background: "var(--c-bg)" }}>
                <div className="text-2xl font-bold" style={{ color: "var(--c-accent)" }}>{totalQuizzes}</div>
                <div className="text-xs" style={{ color: "var(--c-muted)" }}>Quizzes</div>
              </div>
              <div className="text-center p-3 rounded-lg" style={{ background: "var(--c-bg)" }}>
                <div className="text-2xl font-bold" style={{ color: "var(--c-accent)" }}>{avgScore}%</div>
                <div className="text-xs" style={{ color: "var(--c-muted)" }}>Avg Score</div>
              </div>
              <div className="text-center p-3 rounded-lg" style={{ background: "var(--c-bg)" }}>
                <div className="text-2xl font-bold" style={{ color: "var(--c-accent)" }}>{bestScore}%</div>
                <div className="text-xs" style={{ color: "var(--c-muted)" }}>Best Score</div>
              </div>
            </div>
            <div className="space-y-1.5 mt-3">
              {scores.map(s => (
                <div key={s.id} className="flex items-center justify-between px-3 py-2 rounded-lg text-sm" style={{ background: "var(--c-bg)" }}>
                  <span className="truncate">{s.quizTitle || "Quiz"}</span>
                  <span className="font-medium">{Math.round(s.score / s.total * 100)}%</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <button onClick={() => router.push("/dashboard")} className="text-sm" style={{ color: "var(--c-accent)" }}>
        &larr; Back to Dashboard
      </button>
    </div>
  )
}
