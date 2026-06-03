'use client'

import { useParams } from "next/navigation"
import { useState, useEffect } from "react"
import Link from "next/link"

export default function QuizPage() {
  const params = useParams()
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
      <div className="min-h-screen flex items-center justify-center text-slate-400">Loading...</div>
    )
  }

  if (!quiz) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-slate-400">
        <p className="text-lg">Quiz not found.</p>
        <Link href="/" className="text-sm text-blue-500 hover:underline mt-2">Go home</Link>
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center max-w-sm">
          <div className="text-4xl mb-3">{percent >= 70 ? "🎉" : "📚"}</div>
          <h1 className="text-xl font-bold text-slate-900">Quiz Complete!</h1>
          <p className="text-3xl font-bold text-blue-600 my-3">{score}/{total}</p>
          <p className="text-sm text-slate-500">{percent >= 70 ? "Great job!" : "Keep practicing!"}</p>
          <Link href="/" className="inline-block mt-4 text-sm text-blue-500 hover:underline">Back to home</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-xl mx-auto px-4">
        <div className="mb-4 flex items-center justify-between">
          <Link href="/" className="text-sm text-slate-400 hover:text-slate-600">&larr; Back</Link>
          <span className="text-xs text-slate-400">Question {currentQ + 1} of {total}</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">{question.question}</h2>

          <div className="space-y-2">
            {question.options.map((option, i) => {
              let style = "border-slate-200 hover:border-slate-300"
              if (showResult) {
                if (option === question.answer) style = "border-green-400 bg-green-50 text-green-800"
                else if (option === selected && option !== question.answer) style = "border-red-400 bg-red-50 text-red-800"
                else style = "border-slate-100 text-slate-300"
              } else if (selected === option) {
                style = "border-blue-400 bg-blue-50"
              }
              return (
                <button
                  key={i}
                  onClick={() => handleAnswer(option)}
                  className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors ${style}`}
                >
                  {option}
                </button>
              )
            })}
          </div>

          {showResult && (
            <button
              onClick={nextQuestion}
              className="mt-4 w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              {currentQ + 1 < total ? "Next Question" : "See Results"}
            </button>
          )}
        </div>

        <div className="mt-3 flex justify-center gap-1">
          {quiz.questions.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${i === currentQ ? "bg-blue-500" : "bg-slate-300"}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
