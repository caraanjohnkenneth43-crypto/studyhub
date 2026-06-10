'use client'

import { useParams, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import Link from "next/link"
import SettingsPanel from "../../SettingsPanel"

export default function SubjectPage() {
  const params = useParams()
  const router = useRouter()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState("quizzes")

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
        <button onClick={() => router.back()} className="text-sm underline mt-2" style={{ color: "var(--c-link)" }}>Go back</button>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--c-bg)" }}>
      <header style={{ background: "var(--c-card)", borderColor: "var(--c-border)" }} className="border-b">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3 header-content">
          <button onClick={() => router.back()} style={{ color: "var(--c-subtle)" }} className="hover:underline text-sm">&larr; Back</button>
          <span className="text-2xl">{data.icon}</span>
          <div className="flex-1">
            <h1 className="text-xl font-bold" style={{ color: "var(--c-fg)" }}>{data.name}</h1>
            <p className="text-sm" style={{ color: "var(--c-muted)" }}>{data.description}</p>
          </div>
          <SettingsPanel />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex gap-4 border-b pb-3 mb-6" style={{ borderColor: "var(--c-border)" }}>
          <button onClick={() => setTab("quizzes")} className="text-sm font-medium pb-1" style={{
            color: tab === "quizzes" ? "var(--c-fg)" : "var(--c-subtle)",
            borderBottom: tab === "quizzes" ? "2px solid var(--c-link)" : "2px solid transparent",
          }}>Quizzes</button>
          <button onClick={() => setTab("links")} className="text-sm font-medium pb-1" style={{
            color: tab === "links" ? "var(--c-fg)" : "var(--c-subtle)",
            borderBottom: tab === "links" ? "2px solid var(--c-link)" : "2px solid transparent",
          }}>Resources & Links</button>
        </div>

        {tab === "quizzes" && (
          <section>
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
        )}

        {tab === "links" && (
          <section>
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
                  <h3 className="font-medium underline" style={{ color: "var(--c-link)" }}>{link.title}</h3>
                  <p className="text-xs mt-1" style={{ color: "var(--c-subtle)" }}>{link.description}</p>
                </a>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}