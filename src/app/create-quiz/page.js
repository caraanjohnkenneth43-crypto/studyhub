"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "../AuthProvider"
import { auth } from "@/lib/firebase"

export default function CreateQuizPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [subjectId, setSubjectId] = useState("")
  const [subjects, setSubjects] = useState([])
  const [questions, setQuestions] = useState([{ question: "", options: ["", "", "", ""], correct: 0, explanation: "" }])
  const [isPublic, setIsPublic] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.push("/login")
  }, [user, loading, router])

  useEffect(() => {
    fetch("/api/data").then(r => r.json()).then(d => setSubjects(d.subjects || []))
  }, [])

  const addQuestion = () => setQuestions([...questions, { question: "", options: ["", "", "", ""], correct: 0, explanation: "" }])

  const removeQuestion = (i) => setQuestions(questions.filter((_, idx) => idx !== i))

  const updateQuestion = (i, field, value) => {
    const q = [...questions]
    q[i] = { ...q[i], [field]: value }
    setQuestions(q)
  }

  const updateOption = (qi, oi, value) => {
    const q = [...questions]
    q[qi].options[oi] = value
    setQuestions(q)
  }

  const submit = async () => {
    if (!title.trim() || !subjectId) return
    setSaving(true)
    const token = await auth.currentUser?.getIdToken()
    const res = await fetch("/api/quizzes", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title: title.trim(), subjectId, questions, type: isPublic ? "public" : "private" }),
    })
    const data = await res.json()
    if (data.id) {
      router.push("/browse-quizzes")
    }
    setSaving(false)
  }

  if (loading || !user) return null

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6" style={{ color: "var(--c-fg)" }}>
      <h1 className="text-xl font-bold">Create Quiz Set</h1>

      <div className="card space-y-3">
        <div>
          <label className="text-sm font-medium block mb-1" style={{ color: "var(--c-muted)" }}>Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ background: "var(--c-bg)", borderColor: "var(--c-border)", color: "var(--c-fg)" }} />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1" style={{ color: "var(--c-muted)" }}>Subject</label>
          <select value={subjectId} onChange={e => setSubjectId(e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ background: "var(--c-bg)", borderColor: "var(--c-border)", color: "var(--c-fg)" }}>
            <option value="">Select subject...</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} />
          Public (anyone can play)
        </label>
      </div>

      {questions.map((q, qi) => (
        <div key={qi} className="card space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Question {qi + 1}</span>
            {questions.length > 1 && <button onClick={() => removeQuestion(qi)} className="text-xs" style={{ color: "#ef4444" }}>Remove</button>}
          </div>
          <input value={q.question} onChange={e => updateQuestion(qi, "question", e.target.value)} placeholder="Enter question..." className="w-full px-3 py-2 rounded-lg border text-sm" style={{ background: "var(--c-bg)", borderColor: "var(--c-border)", color: "var(--c-fg)" }} />
          <div className="space-y-2">
            {q.options.map((opt, oi) => (
              <label key={oi} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm" style={{ background: q.correct === oi ? "#052e16" : "var(--c-bg)", border: q.correct === oi ? "1px solid #22c55e" : "1px solid var(--c-border)", color: q.correct === oi ? "#bbf7d0" : "var(--c-fg)" }}>
                <input type="radio" name={`correct-${qi}`} checked={q.correct === oi} onChange={() => updateQuestion(qi, "correct", oi)} />
                <input value={opt} onChange={e => updateOption(qi, oi, e.target.value)} placeholder={`Option ${oi + 1}...`} className="bg-transparent w-full" />
              </label>
            ))}
          </div>
          <input value={q.explanation || ""} onChange={e => updateQuestion(qi, "explanation", e.target.value)} placeholder="Explanation (optional)..." className="w-full px-3 py-2 rounded-lg border text-sm" style={{ background: "var(--c-bg)", borderColor: "var(--c-border)", color: "var(--c-subtle)" }} />
        </div>
      ))}

      <button onClick={addQuestion} className="text-sm" style={{ color: "var(--c-accent)" }}>+ Add Question</button>

      <button onClick={submit} disabled={saving || !title.trim() || !subjectId} className="w-full py-3 rounded-xl text-sm font-medium text-white disabled:opacity-50" style={{ background: "var(--c-accent)" }}>
        {saving ? "Saving..." : "Create Quiz Set"}
      </button>
    </div>
  )
}
