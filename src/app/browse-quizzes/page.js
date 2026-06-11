"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "../AuthProvider"

export default function BrowseQuizzesPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [quizzes, setQuizzes] = useState([])
  const [subjects, setSubjects] = useState([])
  const [filter, setFilter] = useState("")

  useEffect(() => {
    if (!loading && !user) router.push("/login")
  }, [user, loading, router])

  useEffect(() => {
    fetch("/api/data").then(r => r.json()).then(d => setSubjects(d.subjects || []))
    fetch("/api/quizzes").then(r => r.json()).then(d => setQuizzes((d.quizzes || []).filter(q => q.type !== "private")))
  }, [])

  const getSubjectName = (id) => {
    const s = subjects.find(s => s.id === id)
    return s ? `${s.icon} ${s.name}` : id
  }

  const filtered = filter ? quizzes.filter(q => q.subjectId === filter) : quizzes

  if (loading || !user) return null

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6" style={{ color: "var(--c-fg)" }}>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Community Quizzes</h1>
        <button onClick={() => router.push("/create-quiz")} className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: "var(--c-accent)" }}>+ Create</button>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setFilter("")} className="text-xs px-3 py-1.5 rounded-lg" style={{ background: !filter ? "var(--c-accent)" : "var(--c-card)", color: !filter ? "#fff" : "var(--c-fg)", border: "1px solid var(--c-border)" }}>All</button>
        {subjects.map(s => (
          <button key={s.id} onClick={() => setFilter(s.id)} className="text-xs px-3 py-1.5 rounded-lg" style={{ background: filter === s.id ? "var(--c-accent)" : "var(--c-card)", color: filter === s.id ? "#fff" : "var(--c-fg)", border: "1px solid var(--c-border)" }}>
            {s.icon}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--c-subtle)" }}>No quizzes yet. Be the first to create one!</p>
      ) : (
        <div className="space-y-3">
          {filtered.map(q => (
            <div key={q.id} className="card flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">{q.title}</div>
                <div className="text-xs mt-0.5" style={{ color: "var(--c-muted)" }}>{getSubjectName(q.subjectId)} · {q.questions?.length || 0} questions</div>
              </div>
              <button onClick={() => router.push(`/quiz/${q.id}?custom=true`)} className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: "var(--c-accent)" }}>
                Play
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
