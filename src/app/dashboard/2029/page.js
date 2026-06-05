"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/app/AuthProvider"
import SettingsPanel, { SettingsContent, settingsDefaults, loadSettings, applySettings } from "@/app/SettingsPanel"
import { db } from "@/lib/firebase"
import { doc, setDoc, deleteDoc, collection, query, onSnapshot, serverTimestamp } from "firebase/firestore"

function useActiveCount(user) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!user) return

    const uid = user.uid
    const ref = doc(db, "presence", uid)
    let lastInteraction = Date.now()

    const touch = () => { lastInteraction = Date.now() }

    const heartbeat = async () => {
      if (Date.now() - lastInteraction < 5 * 60 * 1000) {
        try { await setDoc(ref, { lastActive: serverTimestamp() }) } catch {}
      }
    }

    heartbeat()
    window.addEventListener("mousemove", touch)
    window.addEventListener("click", touch)
    window.addEventListener("keydown", touch)
    const hb = setInterval(heartbeat, 30000)

    const q = query(collection(db, "presence"))
    const unsub = onSnapshot(q, (snap) => {
      const cutoff = Date.now() - 5 * 60 * 1000
      let active = 0
      snap.forEach((d) => {
        const t = d.data().lastActive
        if (t && typeof t.toMillis === "function" && t.toMillis() >= cutoff) active++
      })
      setCount(active)
    })

    return () => {
      window.removeEventListener("mousemove", touch)
      window.removeEventListener("click", touch)
      window.removeEventListener("keydown", touch)
      clearInterval(hb)
      unsub()
      deleteDoc(ref).catch(() => {})
    }
  }, [user])

  return count
}

export default function ClassroomView() {
  const { user, loading, logOut, isAdmin } = useAuth()
  const router = useRouter()
  const [data, setData] = useState(null)
  const [activeSubjectId, setActiveSubjectId] = useState(null)
  const [sidebarView, setSidebarView] = useState("subjects")
  const [settings, setSettings] = useState(settingsDefaults)
  const [feedbackMsg, setFeedbackMsg] = useState("")
  const [feedbackSent, setFeedbackSent] = useState(false)
  const [requestMsg, setRequestMsg] = useState("")
  const [requestSent, setRequestSent] = useState(false)
  const [requestSubject, setRequestSubject] = useState("")
  const [requestAction, setRequestAction] = useState("edit")
  const [requestTarget, setRequestTarget] = useState("quiz")
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    try { return Number(localStorage.getItem("studyhub-sidebar-width")) || 280 } catch { return 280 }
  })
  const dragRef = useRef(false)
  const startXRef = useRef(0)
  const startWidthRef = useRef(0)
  const widthRef = useRef(sidebarWidth)

  useEffect(() => {
    if (!loading && !user) router.push("/login")
  }, [user, loading, router])

  useEffect(() => {
    setSettings(loadSettings())
  }, [])

  const activeCount = useActiveCount(user)

  useEffect(() => {
    fetch("/api/data").then(r => r.json()).then(setData).catch(() => setData({ subjects: [] }))
  }, [])

  const updateSetting = (key, value) => {
    const next = { ...settings, [key]: value }
    setSettings(next)
    applySettings(next)
  }

  const onDragStart = useCallback((e) => {
    dragRef.current = true
    startXRef.current = e.clientX
    startWidthRef.current = sidebarWidth
    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"
  }, [sidebarWidth])

  useEffect(() => {
    const onMove = (e) => {
      if (!dragRef.current) return
      const delta = e.clientX - startXRef.current
      const newWidth = Math.max(200, Math.min(500, startWidthRef.current + delta))
      widthRef.current = newWidth
      setSidebarWidth(newWidth)
    }
    const onUp = () => {
      if (!dragRef.current) return
      dragRef.current = false
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
      try { localStorage.setItem("studyhub-sidebar-width", String(widthRef.current)) } catch {}
    }
    document.addEventListener("mousemove", onMove)
    document.addEventListener("mouseup", onUp)
    return () => {
      document.removeEventListener("mousemove", onMove)
      document.removeEventListener("mouseup", onUp)
    }
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
    const subj = subjects.find(s => s.id === requestSubject)
    await fetch("/api/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: requestMsg.trim(),
        subjectId: requestSubject,
        subjectName: subj?.name || "",
        actionType: requestAction,
        targetType: requestTarget,
      }),
    })
    setRequestSent(true)
  }

  const resetRequest = () => {
    setRequestOpen(false)
    setRequestSent(false)
    setRequestMsg("")
    setRequestSubject("")
    setRequestAction("edit")
    setRequestTarget("quiz")
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
      <nav className="w-12 shrink-0 flex flex-col items-center gap-4 py-4 border-r icon-bar-hide" style={{ background: "var(--c-card)", borderColor: "var(--c-border)" }}>
        <Link href="/dashboard" className="text-lg p-1.5 rounded-lg transition-colors hover:bg-black/5" title="Classrooms" style={{ color: "var(--c-subtle)" }}>🏠</Link>
        <Link href="/chat" className="text-lg p-1.5 rounded-lg transition-colors hover:bg-black/5" title="Chat" style={{ color: "var(--c-subtle)" }}>💬</Link>
        <button onClick={() => setSidebarView(sidebarView === "request" ? "subjects" : "request")} className="text-lg p-1.5 rounded-lg transition-colors hover:bg-black/5" title="Request a feature" style={{ color: "var(--c-subtle)" }}>💡</button>
        <button onClick={() => setSidebarView(sidebarView === "feedback" ? "subjects" : "feedback")} className="text-lg p-1.5 rounded-lg transition-colors hover:bg-black/5" title="Send feedback" style={{ color: "var(--c-subtle)" }}>📬</button>
        <SettingsPanel noPopup onOpen={() => setSidebarView("settings")} />
        <div className="mt-auto mb-3 flex flex-col items-center gap-0.5" title={`${activeCount} active student${activeCount !== 1 ? "s" : ""}`}>
          <span className={`w-2 h-2 rounded-full ${activeCount > 0 ? "bg-green-500" : "bg-gray-400"}`} />
          <span className="text-[10px] font-medium" style={{ color: "var(--c-subtle)" }}>{activeCount}</span>
        </div>
      </nav>

      <nav className="mobile-only fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around py-2 border-t" style={{ background: "var(--c-card)", borderColor: "var(--c-border)" }}>
        <Link href="/dashboard" className="text-lg p-2" title="Classrooms" style={{ color: "var(--c-subtle)" }}>🏠</Link>
        <Link href="/chat" className="text-lg p-2" title="Chat" style={{ color: "var(--c-subtle)" }}>💬</Link>
        <button onClick={() => setSidebarView(sidebarView === "request" ? "subjects" : "request")} className="text-lg p-2" title="Request" style={{ color: "var(--c-subtle)" }}>💡</button>
        <button onClick={() => setSidebarView(sidebarView === "feedback" ? "subjects" : "feedback")} className="text-lg p-2" title="Feedback" style={{ color: "var(--c-subtle)" }}>📬</button>
        <SettingsPanel noPopup onOpen={() => setSidebarView("settings")} />
      </nav>

      {sidebarView !== "subjects" && (
        <aside className="sticky top-0 self-start border-r shrink-0 overflow-y-auto mobile-sidebar" style={{ background: "var(--c-card)", borderColor: "var(--c-border)", height: "100vh", width: sidebarWidth }}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--c-muted)" }}>
                {sidebarView === "settings" ? "⚙️ Settings" : sidebarView === "feedback" ? "📬 Feedback" : "💡 Request"}
              </h2>
              <button onClick={() => setSidebarView("subjects")} className="text-xs" style={{ color: "var(--c-subtle)" }}>✕</button>
            </div>
            {sidebarView === "request" && (
              requestSent ? (
                <div className="text-center py-4">
                  <p className="text-sm font-medium">Sent! 🚀</p>
                  <p className="text-xs mt-1" style={{ color: "var(--c-muted)" }}>A contributor will review it.</p>
                  <button onClick={() => { setRequestSent(false); setRequestMsg("") }} className="text-xs mt-2 underline" style={{ color: "#7c3aed" }}>New request</button>
                </div>
              ) : (
                <div className="space-y-2">
                  <select value={requestSubject} onChange={e => setRequestSubject(e.target.value)} className="w-full rounded-lg border text-sm p-2" style={{ background: "var(--c-bg)", borderColor: "var(--c-border)", color: "var(--c-fg)" }}>
                    <option value="">Select subject...</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
                  </select>
                  <div className="flex gap-1">
                    {["add", "edit", "remove"].map(a => (
                      <button key={a} onClick={() => setRequestAction(a)} className="flex-1 text-xs py-1.5 rounded-lg border capitalize" style={{
                        background: requestAction === a ? "#7c3aed" : "transparent",
                        borderColor: requestAction === a ? "#7c3aed" : "var(--c-border)",
                        color: requestAction === a ? "white" : "var(--c-fg)",
                      }}>{a}</button>
                    ))}
                  </div>
                  <div className="flex gap-1">
                    {[{k:"quiz",l:"Quiz"},{k:"link",l:"Link"},{k:"subject",l:"Subject"},{k:"info",l:"Info"}].map(t => (
                      <button key={t.k} onClick={() => setRequestTarget(t.k)} className="flex-1 text-xs py-1.5 rounded-lg border" style={{
                        background: requestTarget === t.k ? "#7c3aed" : "transparent",
                        borderColor: requestTarget === t.k ? "#7c3aed" : "var(--c-border)",
                        color: requestTarget === t.k ? "white" : "var(--c-fg)",
                      }}>{t.l}</button>
                    ))}
                  </div>
                  <textarea value={requestMsg} onChange={e => setRequestMsg(e.target.value)} rows={3} className="w-full rounded-lg border text-sm p-2 resize-none" style={{ background: "var(--c-bg)", borderColor: "var(--c-border)", color: "var(--c-fg)" }} placeholder="Describe the change..." />
                  <button onClick={sendRequest} disabled={!requestMsg.trim() || !requestSubject} className="w-full text-xs text-white px-3 py-1.5 rounded-lg font-medium disabled:opacity-50" style={{ background: "#7c3aed" }}>Send Request</button>
                </div>
              )
            )}
            {sidebarView === "feedback" && (
              feedbackSent ? (
                <div className="text-center py-4">
                  <p className="text-sm font-medium">Sent! ✅</p>
                  <button onClick={() => { setFeedbackSent(false); setFeedbackMsg("") }} className="text-xs mt-2 underline" style={{ color: "#2563eb" }}>Send another</button>
                </div>
              ) : (
                <div className="space-y-2">
                  <textarea value={feedbackMsg} onChange={e => setFeedbackMsg(e.target.value)} rows={4} className="w-full rounded-lg border text-sm p-2 resize-none" style={{ background: "var(--c-bg)", borderColor: "var(--c-border)", color: "var(--c-fg)" }} placeholder="Bugs, ideas..." />
                  <button onClick={sendFeedback} disabled={!feedbackMsg.trim()} className="w-full text-xs text-white px-3 py-1.5 rounded-lg font-medium disabled:opacity-50" style={{ background: "#2563eb" }}>Send Feedback</button>
                </div>
              )
            )}
            {sidebarView === "settings" && (
              <div className="space-y-3">
                <SettingsContent settings={settings} onUpdate={updateSetting} user={user} />
                <hr className="border-t" style={{ borderColor: "var(--c-border)" }} />
                {isAdmin && <Link href="/admin/dashboard" className="block w-full text-sm px-3 py-2 rounded-lg transition-colors hover:bg-black/5" style={{ color: "var(--c-subtle)" }} onClick={() => setSidebarView("subjects")}>Admin</Link>}
                <button onClick={() => { logOut(); setSidebarView("subjects") }} className="w-full text-left text-sm px-3 py-2 rounded-lg transition-colors hover:bg-black/5" style={{ color: "var(--c-subtle)" }}>Log out</button>
              </div>
            )}
        </div>
      </aside>
      )}

      {sidebarView === "subjects" && (
      <aside
        className={`sticky top-0 self-start border-r shrink-0 overflow-y-auto mobile-sidebar ${activeSubject ? "hidden sm:block" : ""}`}
        style={{ background: "var(--c-card)", borderColor: "var(--c-border)", height: "100vh", width: sidebarWidth }}
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
      )}

      <div className="w-1 shrink-0 cursor-col-resize hidden sm:block hover:bg-blue-400/30" onMouseDown={onDragStart} />

      <main className="flex-1 p-6 overflow-y-auto mobile-px pb-16 sm:pb-6" style={{ height: "100vh" }}>
          {!activeSubject ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center" style={{ color: "var(--c-subtle)" }}>
                <p className="text-lg">Select a subject</p>
                <p className="text-sm mt-1">Choose a subject from the left sidebar.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6 max-w-3xl">
              <div className="sm:hidden mb-2">
                <button onClick={() => setActiveSubjectId(null)} className="text-sm flex items-center gap-1" style={{ color: "var(--c-muted)" }}>
                  &larr; All subjects
                </button>
              </div>
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
