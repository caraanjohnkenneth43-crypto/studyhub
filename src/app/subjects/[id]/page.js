'use client'

import { useParams, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import Link from "next/link"

export default function SubjectPage() {
  const params = useParams()
  const router = useRouter()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/data")
      .then((r) => r.json())
      .then((d) => {
        const subject = d.subjects.find((s) => s.id === params.id)
        setData(subject)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        Loading...
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-slate-400">
        <p className="text-lg">Subject not found.</p>
        <Link href="/" className="text-sm text-blue-500 hover:underline mt-2">Go home</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/" className="text-slate-400 hover:text-slate-600 text-sm">&larr; Back</Link>
          <span className="text-2xl">{data.icon}</span>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{data.name}</h1>
            <p className="text-sm text-slate-500">{data.description}</p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-8">

        <section>
          <h2 className="text-lg font-semibold text-slate-800 mb-3">Quizzes</h2>
          {data.quizzes.length === 0 && (
            <p className="text-sm text-slate-400">No quizzes yet.</p>
          )}
          <div className="space-y-2">
            {data.quizzes.map((quiz) => (
              <Link
                key={quiz.id}
                href={`/quiz/${quiz.id}`}
                className="block bg-white rounded-lg border border-slate-200 p-4 subject-card"
              >
                <h3 className="font-medium text-slate-900">{quiz.title}</h3>
                <p className="text-xs text-slate-400 mt-1">{quiz.questions.length} question{(quiz.questions.length !== 1) ? "s" : ""}</p>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-800 mb-3">Resources & Links</h2>
          {data.links.length === 0 && (
            <p className="text-sm text-slate-400">No links yet.</p>
          )}
          <div className="space-y-2">
            {data.links.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-white rounded-lg border border-slate-200 p-4 subject-card"
              >
                <h3 className="font-medium text-blue-600 hover:underline">{link.title}</h3>
                <p className="text-xs text-slate-400 mt-1">{link.description}</p>
              </a>
            ))}
          </div>
        </section>

      </main>
    </div>
  )
}
