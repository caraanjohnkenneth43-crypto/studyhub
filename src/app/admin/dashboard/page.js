"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import SettingsPanel from "../../SettingsPanel"
import { useAuth } from "../../AuthProvider"

export default function AdminDashboard() {
  const { user, loading, logOut } = useAuth()
  const router = useRouter()
  const [data, setData] = useState(null)
  const [activeSubject, setActiveSubject] = useState(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [viewFeedback, setViewFeedback] = useState(false)
  const [feedback, setFeedback] = useState([])
  const [viewRequests, setViewRequests] = useState(false)
  const [requests, setRequests] = useState([])
  const [editingInfo, setEditingInfo] = useState(false)
  const [infoSections, setInfoSections] = useState([])
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

  const defaultSubject = { id: "", name: "", icon: "📘", description: "", color: "#3b82f6", classroom: "2029", quizzes: [], links: [] }
  const defaultQuiz = { id: "", title: "", questions: [{ question: "", options: ["", "", "", ""], answer: "" }] }
  const defaultLink = { title: "", url: "", description: "" }

  useEffect(() => {
    fetch("/api/data").then((r) => r.json()).then((d) => {
      setData(d)
      setInfoSections(d.info || [])
    }).catch(() => setData({ subjects: [] }))
  }, [])

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
      setTimeout(() => router.back(), 300)
    } else {
      setMessage("Error saving.")
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

  const subject = activeSubject !== null ? data.subjects[activeSubject] : null

  return (
    <div className="min-h-screen admin-layout" style={{ background: "var(--c-bg)" }}>
      <header style={{ background: "var(--c-card)", borderColor: "var(--c-border)" }} className="border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between header-content">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold" style={{ color: "var(--c-fg)" }}>Admin Dashboard</h1>
            <a href="/chat" className="text-xs" style={{ color: "var(--c-subtle)" }}>Chat</a>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#dbeafe", color: "#1d4ed8" }}>Beta</span>
          </div>
          <div className="flex items-center gap-3">
            {message && <span className="text-xs" style={{ color: "#16a34a" }}>{message}</span>}
            <button onClick={() => save()} disabled={saving} className="px-4 py-1.5 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors" style={{ background: "#2563eb" }}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <span className="text-xs hidden sm:inline" style={{ color: "var(--c-subtle)" }}>{user.email}</span>
            <button onClick={logOut} className="text-xs px-2 py-1 rounded" style={{ color: "var(--c-subtle)" }}>Log out</button>
            <SettingsPanel />
            <a href="/dashboard" className="text-xs" style={{ color: "var(--c-subtle)" }}>&larr; Dashboard</a>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 flex gap-6 admin-layout">
        <aside className="w-64 shrink-0 admin-sidebar">
          <div style={{ background: "var(--c-card)", borderColor: "var(--c-border)" }} className="rounded-xl border p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold" style={{ color: "var(--c-fg)" }}>Subjects</h2>
              <button onClick={addSubject} className="text-xs" style={{ color: "#2563eb" }}>+ Add</button>
            </div>
            {data.subjects.length === 0 && <p className="text-xs" style={{ color: "var(--c-subtle)" }}>No subjects yet.</p>}
            <div className="space-y-1">
              {data.subjects.map((s, i) => (
                <div
                  key={i}
                  onClick={() => { setActiveSubject(i); setViewFeedback(false) }}
                  className="flex items-center justify-between card-pad rounded-lg text-sm cursor-pointer transition-colors"
                  style={{
                    background: activeSubject === i && !viewFeedback ? "#dbeafe" : "transparent",
                    color: activeSubject === i && !viewFeedback ? "#1d40ed" : "var(--c-fg)",
                  }}
                >
                  <span>{s.icon} {s.name || "New Subject"}</span>
                  <button onClick={(e) => { e.stopPropagation(); deleteSubject(i) }} className="text-xs ml-2" style={{ color: "var(--c-subtle)" }}>✕</button>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => { setViewFeedback(!viewFeedback); setActiveSubject(null); setViewRequests(false); if (!viewFeedback) fetch("/api/feedback").then(r => r.json()).then(setFeedback) }}
            className="w-full mt-2 text-left px-3 py-2 rounded-lg text-sm transition-colors"
            style={{
              background: viewFeedback ? "#dbeafe" : "var(--c-card)",
              borderColor: "var(--c-border)",
              color: viewFeedback ? "#1d40ed" : "var(--c-fg)",
            }}
          >
            💬 Feedback ({feedback.length || "..."})
          </button>

          <button
            onClick={() => { setViewRequests(!viewRequests); setActiveSubject(null); setViewFeedback(false); setEditingInfo(false); if (!viewRequests) fetch("/api/request").then(r => r.json()).then(setRequests) }}
            className="w-full mt-2 text-left px-3 py-2 rounded-lg text-sm transition-colors"
            style={{
              background: viewRequests ? "#ede9fe" : "var(--c-card)",
              borderColor: "var(--c-border)",
              color: viewRequests ? "#6d28d9" : "var(--c-fg)",
            }}
          >
            🚀 Requests ({requests.length || "..."})
          </button>

          <button
            onClick={() => { setEditingInfo(!editingInfo); setActiveSubject(null); setViewFeedback(false); setViewRequests(false) }}
            className="w-full mt-2 text-left px-3 py-2 rounded-lg text-sm transition-colors"
            style={{
              background: editingInfo ? "#dbeafe" : "var(--c-card)",
              borderColor: "var(--c-border)",
              color: editingInfo ? "#1d40ed" : "var(--c-fg)",
            }}
          >
            📋 Dashboard Info
          </button>
        </aside>

        <main className="flex-1">
          {editingInfo ? (
            <div style={{ background: "var(--c-card)", borderColor: "var(--c-border)" }} className="rounded-xl border p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold" style={{ color: "var(--c-fg)" }}>📋 Dashboard Info</h2>
                <button
                  onClick={() => setInfoSections([...infoSections, { title: "", content: "" }])}
                  className="text-xs" style={{ color: "#2563eb" }}
                >
                  + Add Section
                </button>
              </div>
              {infoSections.length === 0 ? (
                <p className="text-xs" style={{ color: "var(--c-subtle)" }}>No sections yet. Click "+ Add Section" to start.</p>
              ) : (
                <div className="space-y-4 max-h-[65vh] overflow-y-auto">
                  {infoSections.map((section, i) => (
                    <div key={i} className="border rounded-lg p-4" style={{ borderColor: "var(--c-border)" }}>
                      <div className="flex items-center justify-between mb-2">
                        <div
                          contentEditable
                          suppressContentEditableWarning
                          id={"info-title-" + i}
                          dangerouslySetInnerHTML={{ __html: section.title }}
                          onBlur={(e) => {
                            const u = [...infoSections]
                            u[i] = { ...u[i], title: e.currentTarget.innerHTML }
                            setInfoSections(u)
                          }}
                          className="text-sm font-medium flex-1 px-1 py-0.5 outline-none"
                          style={{ color: "var(--c-fg)" }}
                        />
                        <button
                          onClick={() => setInfoSections(infoSections.filter((_, idx) => idx !== i))}
                          className="text-xs ml-2 shrink-0" style={{ color: "#ef4444" }}
                        >
                          ✕
                        </button>
                      </div>
                      <div className="flex gap-1 mb-2 flex-wrap" style={{ color: "var(--c-fg)" }}>
                        <button onMouseDown={e => e.preventDefault()} onClick={() => document.execCommand("bold")} className="text-xs px-2 py-0.5 rounded border font-bold" style={{ background: "var(--c-bg)", borderColor: "var(--c-border)" }}>B</button>
                        <button onMouseDown={e => e.preventDefault()} onClick={() => document.execCommand("italic")} className="text-xs px-2 py-0.5 rounded border italic" style={{ background: "var(--c-bg)", borderColor: "var(--c-border)" }}>I</button>
                        <button onMouseDown={e => e.preventDefault()} onClick={() => document.execCommand("underline")} className="text-xs px-2 py-0.5 rounded border underline" style={{ background: "var(--c-bg)", borderColor: "var(--c-border)" }}>U</button>
                        <span className="text-xs" style={{ opacity: 0.4 }}>|</span>
                        <button onMouseDown={e => e.preventDefault()} onClick={() => document.execCommand("insertUnorderedList")} className="text-xs px-2 py-0.5 rounded border" style={{ background: "var(--c-bg)", borderColor: "var(--c-border)" }}>• list</button>
                        <button onMouseDown={e => e.preventDefault()} onClick={() => document.execCommand("insertOrderedList")} className="text-xs px-2 py-0.5 rounded border" style={{ background: "var(--c-bg)", borderColor: "var(--c-border)" }}>1. list</button>
                        <span className="text-xs" style={{ opacity: 0.4 }}>|</span>
                        <button onMouseDown={e => e.preventDefault()} onClick={() => document.execCommand("justifyCenter")} className="text-xs px-2 py-0.5 rounded border" style={{ background: "var(--c-bg)", borderColor: "var(--c-border)" }}>≡ center</button>
                        <span className="text-xs" style={{ opacity: 0.4 }}>|</span>
                        {headingOpen === i ? (
                          <span className="flex gap-0.5 items-center">
                            {[1,2,3,4,5,6].map(l => (
                              <button key={l} onMouseDown={e => e.preventDefault()} onClick={() => { document.execCommand("formatBlock", false, "h" + l); setHeadingOpen(null) }} className="text-xs px-1.5 py-0.5 rounded border" style={{ background: "var(--c-bg)", borderColor: "var(--c-border)", fontWeight: l <= 3 ? "bold" : "normal" }}>H{l}</button>
                            ))}
                            <button onMouseDown={e => e.preventDefault()} onClick={() => setHeadingOpen(null)} className="text-xs px-1.5 py-0.5 rounded border" style={{ background: "var(--c-bg)", borderColor: "var(--c-border)" }}>✕</button>
                          </span>
                        ) : (
                          <button onMouseDown={e => e.preventDefault()} onClick={() => setHeadingOpen(i)} className="text-xs px-2 py-0.5 rounded border" style={{ background: "var(--c-bg)", borderColor: "var(--c-border)" }}>H</button>
                        )}
                        {fontSizeOpen === i ? (
                          <span className="flex gap-0.5 items-center">
                            <button onMouseDown={e => e.preventDefault()} onClick={() => setFontSizeValue(v => { const n = Math.max(8, v - 1); const el = document.activeElement; if (el && el.isContentEditable) applyCustomFontSize(n); return n })} className="text-xs px-1.5 py-0.5 rounded border" style={{ background: "var(--c-bg)", borderColor: "var(--c-border)" }}>−</button>
                            <input
                              type="number"
                              min="8"
                              max="72"
                              value={fontSizeValue}
                              onMouseDown={e => e.preventDefault()}
                              onChange={e => {
                                const n = parseInt(e.target.value) || 16
                                setFontSizeValue(n)
                                const el = document.activeElement
                                if (el && el.isContentEditable) applyCustomFontSize(n)
                              }}
                              className="w-10 text-center text-xs rounded border px-1 py-0.5"
                              style={{ background: "var(--c-bg)", borderColor: "var(--c-border)", color: "var(--c-fg)" }}
                            />
                            <button onMouseDown={e => e.preventDefault()} onClick={() => setFontSizeValue(v => { const n = Math.min(72, v + 1); const el = document.activeElement; if (el && el.isContentEditable) applyCustomFontSize(n); return n })} className="text-xs px-1.5 py-0.5 rounded border" style={{ background: "var(--c-bg)", borderColor: "var(--c-border)" }}>+</button>
                            <button onMouseDown={e => e.preventDefault()} onClick={() => setFontSizeOpen(null)} className="text-xs px-1.5 py-0.5 rounded border" style={{ background: "var(--c-bg)", borderColor: "var(--c-border)" }}>✕</button>
                          </span>
                        ) : (
                          <button onMouseDown={e => e.preventDefault()} onClick={() => setFontSizeOpen(i)} className="text-xs px-2 py-0.5 rounded border" style={{ background: "var(--c-bg)", borderColor: "var(--c-border)" }}>T</button>
                        )}
                        {colorOpen === i ? (
                          <span className="flex gap-0.5 items-center">
                            {["red","orange","blue","green","purple","gray"].map(c => (
                              <button key={c} onMouseDown={e => e.preventDefault()} onClick={() => { document.execCommand("foreColor", false, c); setColorOpen(null) }} className="text-xs px-1.5 py-0.5 rounded border" style={{ background: c, borderColor: "var(--c-border)", color: "#fff" }}>{c[0]}</button>
                            ))}
                            <button onMouseDown={e => e.preventDefault()} onClick={() => setColorOpen(null)} className="text-xs px-1.5 py-0.5 rounded border" style={{ background: "var(--c-bg)", borderColor: "var(--c-border)" }}>✕</button>
                          </span>
                        ) : (
                          <button onMouseDown={e => e.preventDefault()} onClick={() => setColorOpen(i)} className="text-xs px-2 py-0.5 rounded border" style={{ background: "var(--c-bg)", borderColor: "var(--c-border)" }}>A</button>
                        )}
                      </div>
                      <div
                        contentEditable
                        suppressContentEditableWarning
                        id={"info-content-" + i}
                        dangerouslySetInnerHTML={{ __html: section.content }}
                        onBlur={(e) => {
                          const u = [...infoSections]
                          u[i] = { ...u[i], content: e.currentTarget.innerHTML }
                          setInfoSections(u)
                        }}
                        className="w-full min-h-[5rem] rounded-lg border p-2 text-xs outline-none"
                        style={{ background: "var(--c-bg)", borderColor: "var(--c-border)", color: "var(--c-fg)" }}
                      />
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={() => {
                  save({ ...data, info: infoSections })
                  setEditingInfo(false)
                }}
                className="mt-4 text-xs" style={{ color: "#2563eb" }}
              >
                Save Info
              </button>
            </div>
          ) : viewRequests ? (
            <div style={{ background: "var(--c-card)", borderColor: "var(--c-border)" }} className="rounded-xl border p-5">
              <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--c-fg)" }}>🚀 Feature Requests</h2>
              <button onClick={() => fetch("/api/request").then(r => r.json()).then(setRequests)} className="text-xs mb-3" style={{ color: "#7c3aed" }}>↻ Refresh</button>
              {requests.length === 0 && <p className="text-xs" style={{ color: "var(--c-subtle)" }}>No requests yet.</p>}
              <div className="space-y-2 max-h-[70vh] overflow-y-auto">
                {requests.map((r) => (
                  <div key={r.id} className="border rounded-lg p-3" style={{ borderColor: "var(--c-border)" }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium" style={{ color: "var(--c-fg)" }}>{r.name || "Anonymous"}</span>
                      <span className="text-xs" style={{ color: "var(--c-subtle)" }}>{new Date(r.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-sm" style={{ color: "var(--c-muted)" }}>{r.message}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : viewFeedback ? (
            <div style={{ background: "var(--c-card)", borderColor: "var(--c-border)" }} className="rounded-xl border p-5">
              <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--c-fg)" }}>💬 Feedback</h2>
              <button onClick={() => fetch("/api/feedback").then(r => r.json()).then(setFeedback)} className="text-xs mb-3" style={{ color: "#2563eb" }}>↻ Refresh</button>
              {feedback.length === 0 && <p className="text-xs" style={{ color: "var(--c-subtle)" }}>No feedback yet.</p>}
              <div className="space-y-2 max-h-[70vh] overflow-y-auto">
                {feedback.map((f) => (
                  <div key={f.id} className="border rounded-lg p-3" style={{ borderColor: "var(--c-border)" }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium" style={{ color: "var(--c-fg)" }}>{f.name || "Anonymous"}</span>
                      <span className="text-xs" style={{ color: "var(--c-subtle)" }}>{new Date(f.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-sm" style={{ color: "var(--c-muted)" }}>{f.message}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : !subject ? (
            <div className="rounded-xl border p-8 text-center" style={{ background: "var(--c-card)", borderColor: "var(--c-border)", color: "var(--c-subtle)" }}>
              <p>Select a subject from the sidebar to edit.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div style={{ background: "var(--c-card)", borderColor: "var(--c-border)" }} className="rounded-xl border p-5">
                <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--c-fg)" }}>Subject Details</h2>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs block mb-1" style={{ color: "var(--c-muted)" }}>Name</label>
                    <input value={subject.name} onChange={(e) => updateSubject(activeSubject, "name", e.target.value)} className="w-full px-2 py-1.5 rounded-lg text-sm border" style={{ background: "var(--c-bg)", borderColor: "var(--c-border)", color: "var(--c-fg)" }} />
                  </div>
                  <div>
                    <label className="text-xs block mb-1" style={{ color: "var(--c-muted)" }}>Icon (emoji)</label>
                    <input value={subject.icon} onChange={(e) => updateSubject(activeSubject, "icon", e.target.value)} className="w-full px-2 py-1.5 rounded-lg text-sm border" style={{ background: "var(--c-bg)", borderColor: "var(--c-border)", color: "var(--c-fg)" }} />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs block mb-1" style={{ color: "var(--c-muted)" }}>Description</label>
                    <input value={subject.description} onChange={(e) => updateSubject(activeSubject, "description", e.target.value)} className="w-full px-2 py-1.5 rounded-lg text-sm border" style={{ background: "var(--c-bg)", borderColor: "var(--c-border)", color: "var(--c-fg)" }} />
                  </div>
                  <div>
                    <label className="text-xs block mb-1" style={{ color: "var(--c-muted)" }}>Subject ID (used in URL)</label>
                    <input value={subject.id} onChange={(e) => updateSubject(activeSubject, "id", e.target.value)} className="w-full px-2 py-1.5 rounded-lg text-sm border font-mono" style={{ background: "var(--c-bg)", borderColor: "var(--c-border)", color: "var(--c-fg)" }} />
                  </div>
                  <div>
                    <label className="text-xs block mb-1" style={{ color: "var(--c-muted)" }}>Classroom</label>
                    <input value={subject.classroom || "2029"} onChange={(e) => updateSubject(activeSubject, "classroom", e.target.value)} className="w-full px-2 py-1.5 rounded-lg text-sm border" style={{ background: "var(--c-bg)", borderColor: "var(--c-border)", color: "var(--c-fg)" }} />
                  </div>
                </div>
              </div>

              <div style={{ background: "var(--c-card)", borderColor: "var(--c-border)" }} className="rounded-xl border p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold" style={{ color: "var(--c-fg)" }}>Quizzes</h2>
                  <button onClick={() => addQuiz(activeSubject)} className="text-xs" style={{ color: "#2563eb" }}>+ Add Quiz</button>
                </div>
                {subject.quizzes.length === 0 && <p className="text-xs" style={{ color: "var(--c-subtle)" }}>No quizzes yet.</p>}
                {subject.quizzes.map((quiz, qi) => (
                  <div key={qi} className="border rounded-lg p-4 mb-3" style={{ borderColor: "var(--c-border)" }}>
                    <div className="flex items-center justify-between mb-2">
                      <input value={quiz.title} onChange={(e) => updateQuiz(activeSubject, qi, "title", e.target.value)} placeholder="Quiz title" className="font-medium text-sm border-b bg-transparent px-1 py-0.5" style={{ borderColor: "transparent", color: "var(--c-fg)" }}
                        onFocus={(e) => e.target.style.borderColor = "var(--c-border)"}
                        onBlur={(e) => e.target.style.borderColor = "transparent"} />
                      <button onClick={() => deleteQuiz(activeSubject, qi)} className="text-xs" style={{ color: "#ef4444" }}>Delete Quiz</button>
                    </div>
                    <input value={quiz.id} onChange={(e) => updateQuiz(activeSubject, qi, "id", e.target.value)} placeholder="quiz-id (used in URL)" className="w-full text-xs font-mono border-b bg-transparent px-1 py-0.5 mb-3" style={{ borderColor: "transparent", color: "var(--c-subtle)" }} />
                    {quiz.questions.map((q, qn) => (
                      <div key={qn} className="rounded-lg p-3 mb-2" style={{ background: "var(--c-bg)" }}>
                        <div className="flex items-start justify-between mb-2">
                          <input value={q.question} onChange={(e) => updateQuestion(activeSubject, qi, qn, "question", e.target.value)} placeholder={`Question ${qn + 1}`} className="flex-1 text-sm bg-transparent border-b px-1 py-0.5" style={{ borderColor: "transparent", color: "var(--c-fg)" }} />
                          <button onClick={() => deleteQuestion(activeSubject, qi, qn)} className="text-xs ml-2" style={{ color: "#ef4444" }}>✕</button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {q.options.map((opt, oi) => (
                            <label key={oi} className="flex items-center gap-2 px-2 py-1 rounded text-xs cursor-pointer" style={{ background: q.answer === opt ? "#052e16" : "var(--c-card)", border: q.answer === opt ? "1px solid #22c55e" : "1px solid var(--c-border)", color: q.answer === opt ? "#bbf7d0" : "var(--c-fg)" }}>
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
                    <button onClick={() => addQuestion(activeSubject, qi)} className="text-xs mt-1" style={{ color: "#2563eb" }}>+ Add Question</button>
                  </div>
                ))}
              </div>

              <div style={{ background: "var(--c-card)", borderColor: "var(--c-border)" }} className="rounded-xl border p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold" style={{ color: "var(--c-fg)" }}>Links / Resources</h2>
                  <button onClick={() => addLink(activeSubject)} className="text-xs" style={{ color: "#2563eb" }}>+ Add Link</button>
                </div>
                {subject.links.length === 0 && <p className="text-xs" style={{ color: "var(--c-subtle)" }}>No links yet.</p>}
                {subject.links.map((link, li) => (
                  <div key={li} className="flex items-center gap-2 border rounded-lg p-3 mb-2" style={{ borderColor: "var(--c-border)" }}>
                    <input value={link.title} onChange={(e) => updateLink(activeSubject, li, "title", e.target.value)} placeholder="Link title" className="flex-1 text-sm bg-transparent border-b px-1 py-0.5" style={{ borderColor: "transparent", color: "var(--c-fg)" }} />
                    <input value={link.url} onChange={(e) => updateLink(activeSubject, li, "url", e.target.value)} placeholder="https://..." className="flex-1 text-xs font-mono bg-transparent border-b px-1 py-0.5" style={{ borderColor: "transparent", color: "var(--c-subtle)" }} />
                    <input value={link.description} onChange={(e) => updateLink(activeSubject, li, "description", e.target.value)} placeholder="Description" className="hidden sm:block flex-1 text-xs bg-transparent border-b px-1 py-0.5" style={{ borderColor: "transparent", color: "var(--c-subtle)" }} />
                    <button onClick={() => deleteLink(activeSubject, li)} className="text-xs" style={{ color: "#ef4444" }}>✕</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}