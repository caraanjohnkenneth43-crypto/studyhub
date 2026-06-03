'use client'

import { useParams } from "next/navigation"
import { useState, useEffect } from "react"
import Link from "next/link"
import SettingsPanel from "../../SettingsPanel"

export default function SubjectPage() {
  const params = useParams()
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--c-bg)", color: "var(--c-subtle)" }}>
        Loading...
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: "var(--c-bg)", color: "var(--c-subtle)" }}>
        <p className="text-lg">Subject not found.</p>
        <Link href="/dashboard" className="text-sm underline mt-2" style={{ color: "#3b82f6" }}>Go to dashboard</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--c-bg)" }}>
      <header style={{ background: "var(--c-card)", borderColor: "var(--c-border)" }} className="border-b">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3 header-content">
          <Link href="/dashboard" style={{ color: "var(--c-subtle)" }} className="hover:underline text-sm">&larr; Back</Link>
          <span className="text-2xl">{data.icon}</span>
          <div className="flex-1">
            <h1 className="text-xl font-bold" style={{ color: "var(--c-fg)" }}>{data.name}</h1>
            <p className="text-sm" style={{ color: "var(--c-muted)" }}>{data.description}</p>
          </div>
          <SettingsPanel />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-8">
        <section>
          <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--c-fg)" }}>Quizzes</h2>
          {data.quizzes.length === 0 && (
            <p className="text-sm" style={{ color: "var(--c-subtle)" }}>No quizzes yet.</p>
          )}
          <div className="space-y-2">
            {data.quizzes.map((quiz) => (
              <Link
                key={quiz.id}
                href={`/quiz/${quiz.id}`}
                className="block rounded-lg border p-4 subject-card"
                style={{ background: "var(--c-card)", borderColor: "var(--c-border)" }}
              >
                <h3 className="font-medium" style={{ color: "var(--c-fg)" }}>{quiz.title}</h3>
                <p className="text-xs mt-1" style={{ color: "var(--c-subtle)" }}>{quiz.questions.length} question{(quiz.questions.length !== 1) ? "s" : ""}</p>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--c-fg)" }}>Resources & Links</h2>
          {data.links.length === 0 && (
            <p className="text-sm" style={{ color: "var(--c-subtle)" }}>No links yet.</p>
          )}
          <div className="space-y-2">
            {data.links.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg border p-4 subject-card"
                style={{ background: "var(--c-card)", borderColor: "var(--c-border)" }}
              >
                <h3 className="font-medium underline" style={{ color: "#3b82f6" }}>{link.title}</h3>
                <p className="text-xs mt-1" style={{ color: "var(--c-subtle)" }}>{link.description}</p>
              </a>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}