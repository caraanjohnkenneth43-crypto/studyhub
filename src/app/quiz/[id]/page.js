'use client'

import { useParams, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import Link from "next/link"
import SettingsPanel from "../../SettingsPanel"

export default function QuizPage() {
  const params = useParams()
  const router = useRouter()
  const [quiz, setQuiz] = useState(null)
  const [currentQ, setCurrentQ] = useState(0)
  const [selected, setSelected] = useState(null)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/data")
      .then((r) => r.json())
      .then((d) => {
        for (const s of d.subjects) {
          const q = s.quizzes.find((qz) => qz.id === params.id)
          if (q) { setQuiz(q); break }
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--c-bg)", color: "var(--c-subtle)" }}>Loading...</div>
    )
  }

  if (!quiz) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: "var(--c-bg)", color: "var(--c-subtle)" }}>
        <p className="text-lg">Quiz not found.</p>
          <button onClick={() => router.back()} className="text-sm underline mt-2" style={{ color: "#3b82f6" }}>Go back</button>
      </div>
    )
  }

  const question = quiz.questions[currentQ]
  const total = quiz.questions.length

  const handleAnswer = (option) => {
    if (showResult) return
    setSelected(option)
    setShowResult(true)
    if (option === question.answer) setScore((s) => s + 1)
  }

  const nextQuestion = () => {
    if (currentQ + 1 < total) {
      setCurrentQ((q) => q + 1)
      setSelected(null)
      setShowResult(false)
    } else {
      setFinished(true)
    }
  }

  if (finished) {
    const percent = Math.round((score / total) * 100)
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--c-bg)" }}>
        <div className="rounded-xl border p-8 text-center max-w-sm" style={{ background: "var(--c-card)", borderColor: "var(--c-border)" }}>
          <div className="text-4xl mb-3">{percent >= 70 ? "🎉" : "📚"}</div>
          <h1 className="text-xl font-bold" style={{ color: "var(--c-fg)" }}>Quiz Complete!</h1>
          <p className="text-3xl font-bold mt-3 mb-3" style={{ color: "#2563eb" }}>{score}/{total}</p>
          <p className="text-sm" style={{ color: "var(--c-muted)" }}>{percent >= 70 ? "Great job!" : "Keep practicing!"}</p>
          <button onClick={() => router.back()} className="inline-block mt-4 text-sm underline" style={{ color: "#3b82f6" }}>Back</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8" style={{ background: "var(--c-bg)" }}>
      <div className="max-w-xl mx-auto px-4">
        <div className="mb-4 flex items-center justify-between header-content">
          <button onClick={() => router.back()} className="text-sm" style={{ color: "var(--c-subtle)" }}>&larr; Back</button>
          <div className="flex items-center gap-2">
            <SettingsPanel />
            <span className="text-xs" style={{ color: "var(--c-subtle)" }}>Q{currentQ + 1}/{total}</span>
          </div>
        </div>

        <div className="rounded-xl border p-6" style={{ background: "var(--c-card)", borderColor: "var(--c-border)" }}>
          <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--c-fg)" }}>{question.question}</h2>

          <div className="space-y-2">
            {question.options.map((option, i) => {
              let btnStyle = { background: "var(--c-card)", borderColor: "var(--c-border)", color: "var(--c-fg)" }
              if (showResult) {
                if (option === question.answer) btnStyle = { background: "#052e16", borderColor: "#22c55e", color: "#bbf7d0" }
                else if (option === selected && option !== question.answer) btnStyle = { background: "#450a0a", borderColor: "#ef4444", color: "#fecaca" }
                else btnStyle = { background: "transparent", borderColor: "var(--c-border)", color: "var(--c-subtle)" }
              } else if (selected === option) {
                btnStyle = { background: "#1e3a5f", borderColor: "#3b82f6", color: "var(--c-fg)" }
              }
              return (
                <button
                  key={i}
                  onClick={() => handleAnswer(option)}
                  className="w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors"
                  style={btnStyle}
                >
                  {option}
                </button>
              )
            })}
          </div>

          {showResult && (
            <button
              onClick={nextQuestion}
              className="mt-4 w-full py-2 rounded-lg text-sm font-medium transition-colors text-white"
              style={{ background: "#2563eb" }}
            >
              {currentQ + 1 < total ? "Next Question" : "See Results"}
            </button>
          )}
        </div>

        <div className="mt-3 flex justify-center gap-1">
          {quiz.questions.map((_, i) => (
            <div key={i} className="w-2 h-2 rounded-full" style={{ background: i === currentQ ? "#3b82f6" : "var(--c-border)" }} />
          ))}
        </div>
      </div>
    </div>
  )
}