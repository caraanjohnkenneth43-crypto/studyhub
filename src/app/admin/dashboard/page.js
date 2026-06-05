"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import SettingsPanel from "../../SettingsPanel"
import { useAuth, allowedAdmins } from "../../AuthProvider"
import { COLORS, GRADIENTS, ADMIN_GRADIENTS, getAdminGradientClass } from "@/lib/constants"

const TABS = [
  { key: "subjects", label: "📚 Subjects" },
  { key: "contributors", label: "👥 Contributors" },
  { key: "users", label: "👤 Users" },
  { key: "feedback", label: "💬 Feedback" },
  { key: "requests", label: "🚀 Requests" },
  { key: "info", label: "📋 Dashboard Info" },
]

export default function AdminDashboard() {
  const { user, loading, logOut, isAdmin } = useAuth()
  const router = useRouter()
  const [data, setData] = useState(null)
  const [activeSubject, setActiveSubject] = useState(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [tab, setTab] = useState("subjects")
  const [feedback, setFeedback] = useState([])
  const [requests, setRequests] = useState([])
  const [infoSections, setInfoSections] = useState([])
  const [contributorInput, setContributorInput] = useState("")
  const [users, setUsers] = useState([])
  const [debugInfo, setDebugInfo] = useState(null)
  const [fontSizeOpen, setFontSizeOpen] = useState(null)
  const [fontSizeValue, setFontSizeValue] = useState(16)
  const [headingOpen, setHeadingOpen] = useState(null)
  const [colorOpen, setColorOpen] = useState(null)

  useEffect(() => {
    if (!loading && !user) router.push("/login")
  }, [user, loading, router])

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--c-bg)", color: "var(--c-subtle)" }}>
        Loading...
      </div>
    )
  }

  useEffect(() => {
    if (!loading && user && data) {
      const contributorEmails = data.contributors || []
      if (!isAdmin && !contributorEmails.includes(user.email)) {
        router.push("/dashboard")
      }
    }
  }, [user, loading, router, isAdmin, data])

  const defaultSubject = { id: "", name: "", icon: "📘", description: "", color: "#3b82f6", classroom: "2029", quizzes: [], links: [] }
  const defaultQuiz = { id: "", title: "", questions: [{ question: "", options: ["", "", "", ""], answer: "" }] }
  const defaultLink = { title: "", url: "", description: "" }

  useEffect(() => {
    fetch("/api/data").then((r) => r.json()).then((d) => {
      setData(d)
      setInfoSections(d.info || [])
    }).catch(() => setData({ subjects: [], contributors: [] }))
  }, [])

  useEffect(() => {
    if (tab === "feedback") fetch("/api/feedback").then(r => r.json()).then(setFeedback)
    if (tab === "requests") fetch("/api/request").then(r => r.json()).then(setRequests)
    if (tab === "users") fetch("/api/users").then(r => r.json()).then(data => { setUsers(data.users || data); setDebugInfo(data._debug || null) })
  }, [tab])

  const save = async (newData) => {
    setSaving(true)
    setMessage("")
    const res = await fetch("/api/data", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newData || data),
    })
    const result = await res.json()
    setSaving(false)
    if (result.success) {
      setMessage("Saved!")
      setTimeout(() => setMessage(""), 2000)
    } else {
      setMessage(result.error || "Error saving.")
      setTimeout(() => setMessage(""), 5000)
    }
  }

  const addSubject = () => {
    const newData = { ...data, subjects: [...data.subjects, { ...defaultSubject, id: "new-" + Date.now() }] }
    setData(newData)
    setActiveSubject(newData.subjects.length - 1)
  }

  const deleteSubject = (i) => {
    const newData = { ...data, subjects: data.subjects.filter((_, idx) => idx !== i) }
    setData(newData)
    if (activeSubject === i) setActiveSubject(null)
    else if (activeSubject > i) setActiveSubject(activeSubject - 1)
  }

  const updateSubject = (i, field, value) => {
    const subs = [...data.subjects]
    subs[i] = { ...subs[i], [field]: value }
    setData({ ...data, subjects: subs })
  }

  const addQuiz = (si) => {
    const subs = [...data.subjects]
    subs[si] = { ...subs[si], quizzes: [...subs[si].quizzes, { ...defaultQuiz, id: "q-" + Date.now() }] }
    setData({ ...data, subjects: subs })
  }

  const updateQuiz = (si, qi, field, value) => {
    const subs = [...data.subjects]
    const quizzes = [...subs[si].quizzes]
    quizzes[qi] = { ...quizzes[qi], [field]: value }
    subs[si] = { ...subs[si], quizzes }
    setData({ ...data, subjects: subs })
  }

  const updateQuestion = (si, qi, qn, field, value) => {
    const subs = [...data.subjects]
    const quizzes = [...subs[si].quizzes]
    const questions = [...quizzes[qi].questions]
    questions[qn] = { ...questions[qn], [field]: value }
    quizzes[qi] = { ...quizzes[qi], questions }
    subs[si] = { ...subs[si], quizzes }
    setData({ ...data, subjects: subs })
  }

  const deleteQuiz = (si, qi) => {
    const subs = [...data.subjects]
    subs[si] = { ...subs[si], quizzes: subs[si].quizzes.filter((_, i) => i !== qi) }
    setData({ ...data, subjects: subs })
  }

  const addLink = (si) => {
    const subs = [...data.subjects]
    subs[si] = { ...subs[si], links: [...subs[si].links, { ...defaultLink }] }
    setData({ ...data, subjects: subs })
  }

  const updateLink = (si, li, field, value) => {
    const subs = [...data.subjects]
    const links = [...subs[si].links]
    links[li] = { ...links[li], [field]: value }
    subs[si] = { ...subs[si], links }
    setData({ ...data, subjects: subs })
  }

  const deleteLink = (si, li) => {
    const subs = [...data.subjects]
    subs[si] = { ...subs[si], links: subs[si].links.filter((_, i) => i !== li) }
    setData({ ...data, subjects: subs })
  }

  const addQuestion = (si, qi) => {
    updateQuiz(si, qi, "questions", [...data.subjects[si].quizzes[qi].questions, { question: "", options: ["", "", "", ""], answer: "" }])
  }

  const deleteQuestion = (si, qi, qn) => {
    const subs = [...data.subjects]
    const quizzes = [...subs[si].quizzes]
    quizzes[qi] = { ...quizzes[qi], questions: quizzes[qi].questions.filter((_, i) => i !== qn) }
    subs[si] = { ...subs[si], quizzes }
    setData({ ...data, subjects: subs })
  }

  const addContributor = () => {
    const email = contributorInput.trim().toLowerCase()
    if (!email || !email.includes("@")) return
    const current = data.contributors || []
    if (current.includes(email)) return
    setData({ ...data, contributors: [...current, email] })
    setContributorInput("")
  }

  const removeContributor = (email) => {
    setData({ ...data, contributors: (data.contributors || []).filter(e => e !== email) })
  }

  function applyCustomFontSize(px) {
    const sel = window.getSelection()
    if (!sel.rangeCount) return
    const range = sel.getRangeAt(0)
    if (range.collapsed) return
    const span = document.createElement("span")
    span.style.fontSize = px + "px"
    try {
      range.surroundContents(span)
    } catch {
      const frag = range.extractContents()
      span.appendChild(frag)
      range.insertNode(span)
    }
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--c-bg)", color: "var(--c-subtle)" }}>
        Loading...
      </div>
    )
  }

  const visibleTabs = TABS.filter(t => isAdmin || t.key !== "contributors")

  const subject = activeSubject !== null ? data.subjects[activeSubject] : null
  const contributors = data.contributors || []

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--c-bg)" }}>
      <header style={{ background: "var(--c-card)", borderColor: "var(--c-border)" }} className="border-b">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold" style={{ color: "var(--c-fg)" }}>Admin Dashboard</h1>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#dbeafe", color: "#1d4ed8" }}>Beta</span>
          </div>
          <div className="flex items-center gap-4">
            {message && <span className="text-sm font-medium" style={{ color: message === "Saved!" ? "#16a34a" : "#ef4444" }}>{message}</span>}
            <button onClick={() => save()} disabled={saving} className="px-5 py-2 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors" style={{ background: "#2563eb" }}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <span className="text-sm hidden sm:inline" style={{ color: "var(--c-subtle)" }}>{user.email}</span>
            <SettingsPanel />
            <button onClick={logOut} className="text-sm px-2 py-1 rounded" style={{ color: "var(--c-subtle)" }}>Log out</button>
            <button onClick={() => router.back()} className="text-sm" style={{ color: "var(--c-subtle)" }}>&larr; Back</button>
          </div>
        </div>
      </header>

      <nav className="flex gap-1 px-6 pt-4 border-b admin-tabs" style={{ borderColor: "var(--c-border)" }}>
        {visibleTabs.map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setActiveSubject(null) }} className="px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors" style={{
            background: tab === t.key ? "var(--c-card)" : "transparent",
            color: tab === t.key ? "var(--c-fg)" : "var(--c-muted)",
            border: tab === t.key ? "1px solid var(--c-border)" : "none",
            borderBottom: tab === t.key ? "2px solid var(--c-card)" : "none",
          }}>
            {t.label}
          </button>
        ))}
      </nav>

      <div className="flex-1 flex px-6 pb-6" style={{ background: "var(--c-card)" }}>
        {tab === "subjects" && (
          <>
            <aside className="w-72 shrink-0 border-r p-4 overflow-y-auto" style={{ borderColor: "var(--c-border)", height: "calc(100vh - 140px)" }}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold" style={{ color: "var(--c-fg)" }}>Subjects</h2>
                <button onClick={addSubject} className="text-sm" style={{ color: "#2563eb" }}>+ Add</button>
              </div>
              {data.subjects.length === 0 && <p className="text-sm" style={{ color: "var(--c-subtle)" }}>No subjects yet.</p>}
              <div className="space-y-1.5">
                {data.subjects.map((s, i) => (
                  <div
                    key={i}
                    onClick={() => setActiveSubject(i)}
                    className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm cursor-pointer transition-colors min-w-0"
                    style={{
                      background: activeSubject === i ? "#dbeafe" : "transparent",
                      color: activeSubject === i ? "#1d40ed" : "var(--c-fg)",
                    }}
                  >
                    <span className="font-medium truncate min-w-0">{s.icon} {s.name || "New Subject"}</span>
                    <button onClick={(e) => { e.stopPropagation(); deleteSubject(i) }} className="text-xs ml-2 shrink-0" style={{ color: "var(--c-subtle)" }}>✕</button>
                  </div>
                ))}
              </div>
            </aside>

            <main className="flex-1 p-6 overflow-y-auto" style={{ height: "calc(100vh - 140px)" }}>
              {!subject ? (
                <div className="flex items-center justify-center h-full">
                  <p style={{ color: "var(--c-subtle)" }}>Select a subject from the sidebar to edit.</p>
                </div>
              ) : (
                <div className="space-y-6 max-w-3xl">
                  <div style={{ background: "var(--c-bg)", borderColor: "var(--c-border)" }} className="rounded-xl border p-6">
                    <h2 className="text-base font-semibold mb-4" style={{ color: "var(--c-fg)" }}>Subject Details</h2>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm block mb-1.5" style={{ color: "var(--c-muted)" }}>Name</label>
                        <input value={subject.name} onChange={(e) => updateSubject(activeSubject, "name", e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ background: "var(--c-card)", borderColor: "var(--c-border)", color: "var(--c-fg)" }} />
                      </div>
                      <div>
                        <label className="text-sm block mb-1.5" style={{ color: "var(--c-muted)" }}>Icon (emoji)</label>
                        <input value={subject.icon} onChange={(e) => updateSubject(activeSubject, "icon", e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ background: "var(--c-card)", borderColor: "var(--c-border)", color: "var(--c-fg)" }} />
                      </div>
                      <div className="col-span-2">
                        <label className="text-sm block mb-1.5" style={{ color: "var(--c-muted)" }}>Description</label>
                        <input value={subject.description} onChange={(e) => updateSubject(activeSubject, "description", e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ background: "var(--c-card)", borderColor: "var(--c-border)", color: "var(--c-fg)" }} />
                      </div>
                      <div>
                        <label className="text-sm block mb-1.5" style={{ color: "var(--c-muted)" }}>Subject ID</label>
                        <input value={subject.id} onChange={(e) => updateSubject(activeSubject, "id", e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm font-mono" style={{ background: "var(--c-card)", borderColor: "var(--c-border)", color: "var(--c-fg)" }} />
                      </div>
                      <div>
                        <label className="text-sm block mb-1.5" style={{ color: "var(--c-muted)" }}>Classroom</label>
                        <input value={subject.classroom || "2029"} onChange={(e) => updateSubject(activeSubject, "classroom", e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ background: "var(--c-card)", borderColor: "var(--c-border)", color: "var(--c-fg)" }} />
                      </div>
                    </div>
                  </div>

                  <div style={{ background: "var(--c-bg)", borderColor: "var(--c-border)" }} className="rounded-xl border p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-base font-semibold" style={{ color: "var(--c-fg)" }}>Quizzes</h2>
                      <button onClick={() => addQuiz(activeSubject)} className="text-sm" style={{ color: "#2563eb" }}>+ Add Quiz</button>
                    </div>
                    {subject.quizzes.length === 0 && <p className="text-sm" style={{ color: "var(--c-subtle)" }}>No quizzes yet.</p>}
                    {subject.quizzes.map((quiz, qi) => (
                      <div key={qi} className="border rounded-lg p-5 mb-4" style={{ borderColor: "var(--c-border)" }}>
                        <div className="flex items-center justify-between mb-3">
                          <input value={quiz.title} onChange={(e) => updateQuiz(activeSubject, qi, "title", e.target.value)} placeholder="Quiz title" className="text-base font-medium bg-transparent border-b px-1 py-0.5" style={{ borderColor: "transparent", color: "var(--c-fg)" }}
                            onFocus={(e) => e.target.style.borderColor = "var(--c-border)"}
                            onBlur={(e) => e.target.style.borderColor = "transparent"} />
                          <button onClick={() => deleteQuiz(activeSubject, qi)} className="text-sm" style={{ color: "#ef4444" }}>Delete Quiz</button>
                        </div>
                        <input value={quiz.id} onChange={(e) => updateQuiz(activeSubject, qi, "id", e.target.value)} placeholder="quiz-id" className="w-full text-xs font-mono bg-transparent border-b px-1 py-0.5 mb-4" style={{ borderColor: "transparent", color: "var(--c-subtle)" }} />
                        {quiz.questions.map((q, qn) => (
                          <div key={qn} className="rounded-lg p-4 mb-3" style={{ background: "var(--c-card)" }}>
                            <div className="flex items-start justify-between mb-3">
                              <input value={q.question} onChange={(e) => updateQuestion(activeSubject, qi, qn, "question", e.target.value)} placeholder={`Question ${qn + 1}`} className="flex-1 text-sm bg-transparent border-b px-1 py-0.5" style={{ borderColor: "transparent", color: "var(--c-fg)" }} />
                              <button onClick={() => deleteQuestion(activeSubject, qi, qn)} className="text-xs ml-2" style={{ color: "#ef4444" }}>✕</button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              {q.options.map((opt, oi) => (
                                <label key={oi} className="flex items-center gap-2 px-3 py-2 rounded text-sm cursor-pointer" style={{ background: q.answer === opt ? "#052e16" : "var(--c-bg)", border: q.answer === opt ? "1px solid #22c55e" : "1px solid var(--c-border)", color: q.answer === opt ? "#bbf7d0" : "var(--c-fg)" }}>
                                  <input type="radio" name={`q-${qi}-${qn}`} checked={q.answer === opt} onChange={() => updateQuestion(activeSubject, qi, qn, "answer", opt)} />
                                  <input value={opt} onChange={(e) => {
                                    const opts = [...q.options]
                                    opts[oi] = e.target.value
                                    updateQuestion(activeSubject, qi, qn, "options", opts)
                                  }} className="bg-transparent border-b px-1 py-0.5 w-full" style={{ borderColor: "transparent", color: "var(--c-fg)" }} />
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                        <button onClick={() => addQuestion(activeSubject, qi)} className="text-sm mt-1" style={{ color: "#2563eb" }}>+ Add Question</button>
                      </div>
                    ))}
                  </div>

                  <div style={{ background: "var(--c-bg)", borderColor: "var(--c-border)" }} className="rounded-xl border p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-base font-semibold" style={{ color: "var(--c-fg)" }}>Links / Resources</h2>
                      <button onClick={() => addLink(activeSubject)} className="text-sm" style={{ color: "#2563eb" }}>+ Add Link</button>
                    </div>
                    {subject.links.length === 0 && <p className="text-sm" style={{ color: "var(--c-subtle)" }}>No links yet.</p>}
                    {subject.links.map((link, li) => (
                      <div key={li} className="flex items-center gap-3 border rounded-lg p-4 mb-3" style={{ borderColor: "var(--c-border)" }}>
                        <input value={link.title} onChange={(e) => updateLink(activeSubject, li, "title", e.target.value)} placeholder="Link title" className="flex-1 text-sm bg-transparent border-b px-1 py-0.5" style={{ borderColor: "transparent", color: "var(--c-fg)" }} />
                        <input value={link.url} onChange={(e) => updateLink(activeSubject, li, "url", e.target.value)} placeholder="https://..." className="flex-1 text-xs font-mono bg-transparent border-b px-1 py-0.5" style={{ borderColor: "transparent", color: "var(--c-subtle)" }} />
                        <input value={link.description} onChange={(e) => updateLink(activeSubject, li, "description", e.target.value)} placeholder="Description" className="hidden sm:block flex-1 text-sm bg-transparent border-b px-1 py-0.5" style={{ borderColor: "transparent", color: "var(--c-subtle)" }} />
                        <button onClick={() => deleteLink(activeSubject, li)} className="text-sm" style={{ color: "#ef4444" }}>✕</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </main>
          </>
        )}

        {tab === "contributors" && isAdmin && (
          <div className="flex-1 p-6 max-w-2xl">
            <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--c-fg)" }}>👥 Contributors</h2>
            <p className="text-sm mb-4" style={{ color: "var(--c-muted)" }}>Contributors can review and act on student requests.</p>
            <div className="flex gap-2 mb-4">
              <input value={contributorInput} onChange={e => setContributorInput(e.target.value)} placeholder="Email address..." onKeyDown={e => e.key === "Enter" && addContributor()} className="flex-1 px-4 py-2.5 rounded-lg border text-sm" style={{ background: "var(--c-card)", borderColor: "var(--c-border)", color: "var(--c-fg)" }} />
              <button onClick={addContributor} className="px-4 py-2.5 text-white rounded-lg text-sm font-medium" style={{ background: "#2563eb" }}>Add</button>
            </div>
            <div className="space-y-1.5">
              {contributors.length === 0 && <p className="text-sm" style={{ color: "var(--c-subtle)" }}>No contributors added yet.</p>}
              {contributors.map(email => (
                <div key={email} className="flex items-center justify-between px-4 py-3 rounded-lg border" style={{ background: "var(--c-card)", borderColor: "var(--c-border)" }}>
                  <span className="text-sm font-medium" style={{ color: "var(--c-fg)" }}>{email}</span>
                  <button onClick={() => removeContributor(email)} className="text-xs" style={{ color: "#ef4444" }}>Remove</button>
                </div>
              ))}
            </div>
            <button onClick={() => save()} disabled={saving} className="mt-6 px-5 py-2.5 text-white rounded-lg text-sm font-medium disabled:opacity-50" style={{ background: "#2563eb" }}>
              {saving ? "Saving..." : "Save Contributors"}
            </button>
          </div>
        )}

        {tab === "users" && (
          <div className="flex-1 p-6 max-w-2xl">
            <h2 className="text-lg font-semibold mb-1" style={{ color: "var(--c-fg)" }}>👤 All Users</h2>
            <p className="text-sm mb-4" style={{ color: "var(--c-muted)" }}>Every registered Firebase Auth user.</p>
            <div className="flex items-center gap-3 mb-4">
              <button onClick={() => fetch("/api/users").then(r => r.json()).then(data => { setUsers(data.users || data); setDebugInfo(data._debug || null) })} className="text-sm" style={{ color: "#2563eb" }}>↻ Refresh</button>
              {debugInfo && (
                <span className="text-xs" style={{ color: debugInfo.usedAdmin ? "#16a34a" : "#d97706" }}>
                  {debugInfo.usedAdmin ? "✓ Admin SDK" : debugInfo.adminInitError ? `✗ Admin SDK error: ${debugInfo.adminInitError}` : "○ Fallback (no Admin SDK env vars)"}
                </span>
              )}
            </div>
            {users.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--c-subtle)" }}>No users found.</p>
            ) : (
              <div className="space-y-1">
                {users.map(u => {
                  const isContributor = (data.contributors || []).includes(u.email)
                  const isAdmin = allowedAdmins.includes(u.email)
                  return (
                    <div key={u.uid || u.id || u.email} className="flex items-center justify-between px-4 py-3 rounded-lg border" style={{ background: "var(--c-card)", borderColor: "var(--c-border)" }}>
                      <span
                        className={`text-sm font-medium ${getAdminGradientClass(u.email, allowedAdmins, data.contributors || [])}`}
                        style={{ color: (!isAdmin && !isContributor) ? "var(--c-fg)" : undefined }}
                      >
                        {u.email}
                      </span>
                      <div className="flex gap-2">
                        {isAdmin && <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: "#e5e7eb", color: "#111827" }}>Admin</span>}
                        {isContributor && !isAdmin && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#ede9fe", color: "#6d28d9" }}>Contributor</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {tab === "feedback" && (
          <div className="flex-1 p-6 max-w-3xl">
            <h2 className="text-lg font-semibold mb-1" style={{ color: "var(--c-fg)" }}>💬 Feedback</h2>
            <p className="text-sm mb-4" style={{ color: "var(--c-muted)" }}>What students are saying about StudyHub.</p>
            <button onClick={() => fetch("/api/feedback").then(r => r.json()).then(setFeedback)} className="text-sm mb-4" style={{ color: "#2563eb" }}>↻ Refresh</button>
            {feedback.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--c-subtle)" }}>No feedback yet.</p>
            ) : (
              <div className="space-y-3">
                {feedback.map(f => (
                  <div key={f.id} className="border rounded-xl p-5" style={{ borderColor: "var(--c-border)" }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold" style={{ color: "var(--c-fg)" }}>{f.name || "Anonymous"}</span>
                      <span className="text-xs" style={{ color: "var(--c-subtle)" }}>{new Date(f.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-sm" style={{ color: "var(--c-muted)" }}>{f.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "requests" && (
          <div className="flex-1 p-6 max-w-4xl">
            <h2 className="text-lg font-semibold mb-1" style={{ color: "var(--c-fg)" }}>🚀 Student Requests</h2>
            <p className="text-sm mb-4" style={{ color: "var(--c-muted)" }}>Students request changes to classroom content. Resolve them here.</p>
            <button onClick={() => fetch("/api/request").then(r => r.json()).then(setRequests)} className="text-sm mb-4" style={{ color: "#7c3aed" }}>↻ Refresh</button>
            {requests.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--c-subtle)" }}>No requests yet.</p>
            ) : (
              <div className="space-y-3">
                {requests.map(r => (
                  <div key={r.id} className="border rounded-xl p-5" style={{ borderColor: "var(--c-border)" }}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <span className="text-sm font-semibold" style={{ color: "var(--c-fg)" }}>{r.name || "Anonymous"}</span>
                        {r.subjectName && <span className="text-xs ml-2 px-2 py-0.5 rounded-full" style={{ background: "#ede9fe", color: "#6d28d9" }}>{r.subjectName}</span>}
                      </div>
                      <span className="text-xs" style={{ color: "var(--c-subtle)" }}>{new Date(r.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="flex gap-2 mb-3">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium capitalize" style={{
                        background: r.actionType === "add" ? "#dcfce7" : r.actionType === "remove" ? "#fee2e2" : "#fef9c3",
                        color: r.actionType === "add" ? "#166534" : r.actionType === "remove" ? "#991b1b" : "#854d0e",
                      }}>{r.actionType}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full capitalize" style={{ background: "#e0f2fe", color: "#075985" }}>{r.targetType}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full capitalize" style={{
                        background: r.status === "open" ? "#fef3c7" : "#dcfce7",
                        color: r.status === "open" ? "#92400e" : "#166534",
                      }}>{r.status}</span>
                    </div>
                    <p className="text-sm" style={{ color: "var(--c-muted)" }}>{r.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "info" && (
          <div className="flex-1 p-6 max-w-3xl">
            <div style={{ background: "var(--c-bg)", borderColor: "var(--c-border)" }} className="rounded-xl border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold" style={{ color: "var(--c-fg)" }}>📋 Dashboard Info</h2>
                <button onClick={() => setInfoSections([...infoSections, { title: "", content: "" }])} className="text-sm" style={{ color: "#2563eb" }}>+ Add Section</button>
              </div>
              {infoSections.length === 0 ? (
                <p className="text-sm" style={{ color: "var(--c-subtle)" }}>No sections yet.</p>
              ) : (
                <div className="space-y-6">
                  {infoSections.map((section, i) => (
                    <div key={i} className="border rounded-lg p-5" style={{ borderColor: "var(--c-border)" }}>
                      <div className="flex items-center justify-between mb-3">
                        <div
                          contentEditable
                          suppressContentEditableWarning
                          dangerouslySetInnerHTML={{ __html: section.title }}
                          onBlur={(e) => {
                            const u = [...infoSections]
                            u[i] = { ...u[i], title: e.currentTarget.innerHTML }
                            setInfoSections(u)
                          }}
                          className="text-base font-medium flex-1 px-1 py-0.5 outline-none"
                          style={{ color: "var(--c-fg)" }}
                        />
                        <button onClick={() => setInfoSections(infoSections.filter((_, idx) => idx !== i))} className="text-sm ml-2 shrink-0" style={{ color: "#ef4444" }}>✕</button>
                      </div>
                      <div className="flex gap-1 mb-3 flex-wrap" style={{ color: "var(--c-fg)" }}>
                        <button onMouseDown={e => e.preventDefault()} onClick={() => document.execCommand("bold")} className="text-sm px-2 py-0.5 rounded border font-bold" style={{ background: "var(--c-card)", borderColor: "var(--c-border)" }}>B</button>
                        <button onMouseDown={e => e.preventDefault()} onClick={() => document.execCommand("italic")} className="text-sm px-2 py-0.5 rounded border italic" style={{ background: "var(--c-card)", borderColor: "var(--c-border)" }}>I</button>
                        <button onMouseDown={e => e.preventDefault()} onClick={() => document.execCommand("underline")} className="text-sm px-2 py-0.5 rounded border underline" style={{ background: "var(--c-card)", borderColor: "var(--c-border)" }}>U</button>
                        <span className="text-sm" style={{ opacity: 0.4 }}>|</span>
                        <button onMouseDown={e => e.preventDefault()} onClick={() => document.execCommand("insertUnorderedList")} className="text-sm px-2 py-0.5 rounded border" style={{ background: "var(--c-card)", borderColor: "var(--c-border)" }}>• list</button>
                        <button onMouseDown={e => e.preventDefault()} onClick={() => document.execCommand("insertOrderedList")} className="text-sm px-2 py-0.5 rounded border" style={{ background: "var(--c-card)", borderColor: "var(--c-border)" }}>1. list</button>
                        <span className="text-sm" style={{ opacity: 0.4 }}>|</span>
                        {headingOpen === i ? (
                          <span className="flex gap-0.5 items-center">
                            {[1,2,3,4,5,6].map(l => (
                              <button key={l} onMouseDown={e => e.preventDefault()} onClick={() => { document.execCommand("formatBlock", false, "h" + l); setHeadingOpen(null) }} className="text-sm px-2 py-0.5 rounded border" style={{ background: "var(--c-card)", borderColor: "var(--c-border)", fontWeight: l <= 3 ? "bold" : "normal" }}>H{l}</button>
                            ))}
                            <button onMouseDown={e => e.preventDefault()} onClick={() => setHeadingOpen(null)} className="text-sm px-2 py-0.5 rounded border" style={{ background: "var(--c-card)", borderColor: "var(--c-border)" }}>✕</button>
                          </span>
                        ) : (
                          <button onMouseDown={e => e.preventDefault()} onClick={() => setHeadingOpen(i)} className="text-sm px-2 py-0.5 rounded border" style={{ background: "var(--c-card)", borderColor: "var(--c-border)" }}>H</button>
                        )}
                        {fontSizeOpen === i ? (
                          <span className="flex gap-0.5 items-center">
                            <button onMouseDown={e => e.preventDefault()} onClick={() => setFontSizeValue(v => { const n = Math.max(8, v - 1); const el = document.activeElement; if (el && el.isContentEditable) applyCustomFontSize(n); return n })} className="text-sm px-2 py-0.5 rounded border" style={{ background: "var(--c-card)", borderColor: "var(--c-border)" }}>−</button>
                            <input type="number" min="8" max="72" value={fontSizeValue} onMouseDown={e => e.preventDefault()} onChange={e => { const n = parseInt(e.target.value) || 16; setFontSizeValue(n); const el = document.activeElement; if (el && el.isContentEditable) applyCustomFontSize(n) }} className="w-12 text-center text-sm rounded border px-1 py-0.5" style={{ background: "var(--c-card)", borderColor: "var(--c-border)", color: "var(--c-fg)" }} />
                            <button onMouseDown={e => e.preventDefault()} onClick={() => setFontSizeValue(v => { const n = Math.min(72, v + 1); const el = document.activeElement; if (el && el.isContentEditable) applyCustomFontSize(n); return n })} className="text-sm px-2 py-0.5 rounded border" style={{ background: "var(--c-card)", borderColor: "var(--c-border)" }}>+</button>
                            <button onMouseDown={e => e.preventDefault()} onClick={() => setFontSizeOpen(null)} className="text-sm px-2 py-0.5 rounded border" style={{ background: "var(--c-card)", borderColor: "var(--c-border)" }}>✕</button>
                          </span>
                        ) : (
                          <button onMouseDown={e => e.preventDefault()} onClick={() => setFontSizeOpen(i)} className="text-sm px-2 py-0.5 rounded border" style={{ background: "var(--c-card)", borderColor: "var(--c-border)" }}>T</button>
                        )}
                        {colorOpen === i ? (
                          <span className="flex gap-0.5 items-center">
                            {["red","orange","blue","green","purple","gray"].map(c => (
                              <button key={c} onMouseDown={e => e.preventDefault()} onClick={() => { document.execCommand("foreColor", false, c); setColorOpen(null) }} className="text-sm px-2 py-0.5 rounded border" style={{ background: c, borderColor: "var(--c-border)", color: "#fff" }}>{c[0]}</button>
                            ))}
                            <button onMouseDown={e => e.preventDefault()} onClick={() => setColorOpen(null)} className="text-sm px-2 py-0.5 rounded border" style={{ background: "var(--c-card)", borderColor: "var(--c-border)" }}>✕</button>
                          </span>
                        ) : (
                          <button onMouseDown={e => e.preventDefault()} onClick={() => setColorOpen(i)} className="text-sm px-2 py-0.5 rounded border" style={{ background: "var(--c-card)", borderColor: "var(--c-border)" }}>A</button>
                        )}
                      </div>
                      <div
                        contentEditable
                        suppressContentEditableWarning
                        dangerouslySetInnerHTML={{ __html: section.content }}
                        onBlur={(e) => {
                          const u = [...infoSections]
                          u[i] = { ...u[i], content: e.currentTarget.innerHTML }
                          setInfoSections(u)
                        }}
                        className="w-full min-h-[6rem] rounded-lg border p-3 text-sm outline-none"
                        style={{ background: "var(--c-card)", borderColor: "var(--c-border)", color: "var(--c-fg)" }}
                      />
                    </div>
                  ))}
                </div>
              )}
              <button onClick={() => save({ ...data, info: infoSections })} className="mt-6 px-5 py-2.5 text-white rounded-lg text-sm font-medium" style={{ background: "#2563eb" }}>Save Info</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
