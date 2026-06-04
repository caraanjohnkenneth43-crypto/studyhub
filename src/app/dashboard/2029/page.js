"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/app/AuthProvider"
import SettingsPanel from "@/app/SettingsPanel"

export default function ClassroomView() {
  const { user, loading, logOut } = useAuth()
  const router = useRouter()
  const [data, setData] = useState(null)
  const [activeSubjectId, setActiveSubjectId] = useState(null)

  useEffect(() => {
    if (!loading && !user) router.push("/login")
  }, [user, loading, router])

  useEffect(() => {
    fetch("/api/data").then(r => r.json()).then(setData).catch(() => setData({ subjects: [] }))
  }, [])

  if (loading || !user || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--c-bg)", color: "var(--c-subtle)" }}>
        Loading...
      </div>
    )
  }

  const subjects = data.subjects || []
  const activeSubject = subjects.find(s => s.id === activeSubjectId)

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--c-bg)" }}>
      <header style={{ background: "var(--c-card)", borderColor: "var(--c-border)" }} className="border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-sm px-2 py-1 rounded transition-colors hover:bg-black/5" style={{ color: "var(--c-muted)" }}>
              &larr;
            </Link>
            <span className="text-lg font-bold" style={{ color: "var(--c-fg)" }}>StudyHub</span>
            <Link href="/chat" className="text-xs px-2 py-0.5 rounded" style={{ color: "var(--c-subtle)" }}>Chat</Link>
            <Link href="/admin/dashboard" className="text-xs px-2 py-0.5 rounded" style={{ color: "var(--c-subtle)" }}>Admin</Link>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs hidden sm:inline" style={{ color: "var(--c-subtle)" }}>{user.email}</span>
            <SettingsPanel />
            <button onClick={logOut} className="text-xs" style={{ color: "var(--c-subtle)" }}>Log out</button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex w-full">
        <aside
          className="w-1/4 min-w-[220px] max-w-[280px] sticky top-0 self-start border-r shrink-0 overflow-y-auto"
          style={{ background: "var(--c-card)", borderColor: "var(--c-border)", height: "calc(100vh - 49px)" }}
        >
          <div className="p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--c-muted)" }}>Subjects</h2>
            {subjects.length === 0 ? (
              <p className="text-xs" style={{ color: "var(--c-subtle)" }}>No subjects yet.</p>
            ) : (
              <div className="gap-default flex flex-col">
                {subjects.map((subject) => (
                  <button
                    key={subject.id}
                    onClick={() => setActiveSubjectId(subject.id)}
                    className="w-full text-left rounded-lg border card-pad transition-colors"
                    style={{
                      background: activeSubjectId === subject.id ? "#dbeafe" : "var(--c-bg)",
                      borderColor: activeSubjectId === subject.id ? "#93c5fd" : "var(--c-border)",
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{subject.icon}</span>
                      <span className="text-sm font-semibold" style={{ color: "var(--c-fg)" }}>{subject.name}</span>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: "var(--c-muted)" }}>{subject.description}</p>
                    <div className="flex gap-2 mt-2 text-xs" style={{ color: "var(--c-subtle)" }}>
                      <span>{subject.quizzes.length} quiz{(subject.quizzes.length !== 1) ? "zes" : ""}</span>
                      <span>{subject.links.length} link{(subject.links.length !== 1) ? "s" : ""}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        <main className="flex-1 p-6 overflow-y-auto" style={{ height: "calc(100vh - 49px)" }}>
          {!activeSubject ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center" style={{ color: "var(--c-subtle)" }}>
                <p className="text-lg">Select a subject</p>
                <p className="text-sm mt-1">Choose a subject from the left sidebar.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6 max-w-3xl">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-3xl">{activeSubject.icon}</span>
                  <div>
                    <h2 className="text-2xl font-bold" style={{ color: "var(--c-fg)" }}>{activeSubject.name}</h2>
                    <p className="text-sm" style={{ color: "var(--c-muted)" }}>{activeSubject.description}</p>
                  </div>
                </div>
              </div>

              <section>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2" style={{ color: "var(--c-fg)" }}>
                  <span className="text-xl">📝</span> Quizzes
                </h3>
                {activeSubject.quizzes.length === 0 ? (
                  <p className="text-sm" style={{ color: "var(--c-subtle)" }}>No quizzes yet.</p>
                ) : (
                  <div className="gap-default flex flex-col">
                    {activeSubject.quizzes.map((quiz) => (
                      <Link
                        key={quiz.id}
                        href={`/quiz/${quiz.id}`}
                        className="block rounded-lg border-l-4 card-pad subject-card"
                        style={{ background: "var(--c-card)", borderColor: "var(--c-border)", borderLeftColor: "#3b82f6" }}
                      >
                        <h4 className="font-medium" style={{ color: "var(--c-fg)" }}>{quiz.title}</h4>
                        <p className="text-xs mt-1" style={{ color: "var(--c-subtle)" }}>{quiz.questions.length} question{(quiz.questions.length !== 1) ? "s" : ""}</p>
                      </Link>
                    ))}
                  </div>
                )}
              </section>

              <hr className="border-t" style={{ borderColor: "var(--c-border)" }} />

              <section>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2" style={{ color: "var(--c-fg)" }}>
                  <span className="text-xl">🔗</span> Resources & Links
                </h3>
                {activeSubject.links.length === 0 ? (
                  <p className="text-sm" style={{ color: "var(--c-subtle)" }}>No links yet.</p>
                ) : (
                  <div className="gap-default flex flex-col">
                    {activeSubject.links.map((link, i) => (
                      <a
                        key={i}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block rounded-lg border-l-4 card-pad subject-card"
                        style={{ background: "var(--c-card)", borderColor: "var(--c-border)", borderLeftColor: "#16a34a" }}
                      >
                        <h4 className="font-medium underline" style={{ color: "#3b82f6" }}>{link.title}</h4>
                        <p className="text-xs mt-1" style={{ color: "var(--c-subtle)" }}>{link.description}</p>
                      </a>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
