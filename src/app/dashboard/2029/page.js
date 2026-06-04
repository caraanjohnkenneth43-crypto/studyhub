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
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [requestOpen, setRequestOpen] = useState(false)
  const [feedbackMsg, setFeedbackMsg] = useState("")
  const [requestMsg, setRequestMsg] = useState("")
  const [feedbackSent, setFeedbackSent] = useState(false)
  const [requestSent, setRequestSent] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.push("/login")
  }, [user, loading, router])

  useEffect(() => {
    fetch("/api/data").then(r => r.json()).then(setData).catch(() => setData({ subjects: [] }))
  }, [])

  const sendFeedback = async () => {
    if (!feedbackMsg.trim()) return
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: feedbackMsg }),
    })
    setFeedbackSent(true)
  }

  const sendRequest = async () => {
    if (!requestMsg.trim()) return
    await fetch("/api/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: requestMsg }),
    })
    setRequestSent(true)
  }

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
    <div className="min-h-screen flex" style={{ background: "var(--c-bg)" }}>
      <nav className="w-12 shrink-0 flex flex-col items-center gap-4 py-4 border-r" style={{ background: "var(--c-card)", borderColor: "var(--c-border)" }}>
        <Link href="/dashboard" className="text-lg p-1.5 rounded-lg transition-colors hover:bg-black/5" title="Classrooms" style={{ color: "var(--c-subtle)" }}>🏠</Link>
        <Link href="/chat" className="text-lg p-1.5 rounded-lg transition-colors hover:bg-black/5" title="Chat" style={{ color: "var(--c-subtle)" }}>💬</Link>
        <button onClick={() => { setRequestOpen(!requestOpen); setFeedbackOpen(false) }} className="text-lg p-1.5 rounded-lg transition-colors hover:bg-black/5" title="Request a feature" style={{ color: "var(--c-subtle)" }}>💡</button>
        <button onClick={() => { setFeedbackOpen(!feedbackOpen); setRequestOpen(false) }} className="text-lg p-1.5 rounded-lg transition-colors hover:bg-black/5" title="Send feedback" style={{ color: "var(--c-subtle)" }}>📬</button>
        <SettingsPanel />
      </nav>

      {(requestOpen || feedbackOpen) && (
        <div className="fixed left-14 top-4 z-50 w-72 rounded-xl border shadow-lg p-4" style={{ background: "var(--c-card)", borderColor: "var(--c-border)", color: "var(--c-fg)" }}>
          {requestOpen && (
            requestSent ? (
              <div className="text-center py-2">
                <p className="text-sm font-medium">Sent! 🚀</p>
                <button onClick={() => { setRequestOpen(false); setRequestSent(false); setRequestMsg("") }} className="text-xs mt-2 underline" style={{ color: "#7c3aed" }}>Close</button>
              </div>
            ) : (
              <>
                <h4 className="text-xs font-semibold mb-2">Request a Feature</h4>
                <textarea value={requestMsg} onChange={e => setRequestMsg(e.target.value)} rows={3} className="w-full rounded-lg border text-sm p-2 resize-none" style={{ background: "var(--c-bg)", borderColor: "var(--c-border)", color: "var(--c-fg)" }} placeholder="What feature?" />
                <button onClick={sendRequest} disabled={!requestMsg.trim()} className="mt-2 text-xs text-white px-3 py-1.5 rounded-lg font-medium disabled:opacity-50" style={{ background: "#7c3aed" }}>Send</button>
              </>
            )
          )}
          {feedbackOpen && (
            feedbackSent ? (
              <div className="text-center py-2">
                <p className="text-sm font-medium">Sent! ✅</p>
                <button onClick={() => { setFeedbackOpen(false); setFeedbackSent(false); setFeedbackMsg("") }} className="text-xs mt-2 underline" style={{ color: "#2563eb" }}>Close</button>
              </div>
            ) : (
              <>
                <h4 className="text-xs font-semibold mb-2">Send Feedback</h4>
                <textarea value={feedbackMsg} onChange={e => setFeedbackMsg(e.target.value)} rows={3} className="w-full rounded-lg border text-sm p-2 resize-none" style={{ background: "var(--c-bg)", borderColor: "var(--c-border)", color: "var(--c-fg)" }} placeholder="Bugs, ideas..." />
                <button onClick={sendFeedback} disabled={!feedbackMsg.trim()} className="mt-2 text-xs text-white px-3 py-1.5 rounded-lg font-medium disabled:opacity-50" style={{ background: "#2563eb" }}>Send</button>
              </>
            )
          )}
        </div>
      )}

      <aside
        className="w-1/4 min-w-[220px] max-w-[280px] sticky top-0 self-start border-r shrink-0 overflow-y-auto"
        style={{ background: "var(--c-card)", borderColor: "var(--c-border)", height: "100vh" }}
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

      <main className="flex-1 p-6 overflow-y-auto" style={{ height: "100vh" }}>
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
  )
}
