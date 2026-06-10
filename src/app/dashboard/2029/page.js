"use client"

import { useState, useEffect } from "react"
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
  const [contentTab, setContentTab] = useState("quizzes")
  const [feedbackMsg, setFeedbackMsg] = useState("")
  const [feedbackSent, setFeedbackSent] = useState(false)
  const [requestMsg, setRequestMsg] = useState("")
  const [requestSent, setRequestSent] = useState(false)
  const [requestSubject, setRequestSubject] = useState("")
  const [requestAction, setRequestAction] = useState("edit")
  const [requestTarget, setRequestTarget] = useState("quiz")
  const [sidebarWidth] = useState(280)

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
                  <button onClick={() => { setFeedbackSent(false); setFeedbackMsg("") }} className="text-xs mt-2 underline" style={{ color: "var(--c-accent)" }}>Send another</button>
                </div>
              ) : (
                <div className="space-y-2">
                  <textarea value={feedbackMsg} onChange={e => setFeedbackMsg(e.target.value)} rows={4} className="w-full rounded-lg border text-sm p-2 resize-none" style={{ background: "var(--c-bg)", borderColor: "var(--c-border)", color: "var(--c-fg)" }} placeholder="Bugs, ideas..." />
                  <button onClick={sendFeedback} disabled={!feedbackMsg.trim()} className="w-full text-xs text-white px-3 py-1.5 rounded-lg font-medium disabled:opacity-50" style={{ background: "var(--c-accent)" }}>Send Feedback</button>
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

      <main className="flex-1 p-6 overflow-y-auto mobile-px pb-16 sm:pb-6" style={{ height: "100vh" }}>
        {!activeSubject ? (
          <div>
            <header className="flex items-center justify-between mb-6">
              <h1 className="text-xl font-bold" style={{ color: "var(--c-fg)" }}>Class of 2029</h1>
              <span className="text-xs" style={{ color: "var(--c-muted)" }}>{subjects.length} subject{(subjects.length !== 1) ? "s" : ""}</span>
            </header>
            {subjects.length === 0 ? (
              <div className="flex items-center justify-center h-64" style={{ color: "var(--c-subtle)" }}>
                <p>No subjects yet.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {subjects.map((subject) => (
                  <button
                    key={subject.id}
                    onClick={() => setActiveSubjectId(subject.id)}
                    className="rounded-xl border overflow-hidden text-left transition-all hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
                    style={{ background: "var(--c-card)", borderColor: "var(--c-border)" }}
                  >
                    <div className="h-20 flex items-end p-4" style={{ background: "linear-gradient(135deg, var(--c-accent), #7c3aed)" }}>
                      <span className="text-3xl">{subject.icon}</span>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-sm" style={{ color: "var(--c-fg)" }}>{subject.name}</h3>
                      <p className="text-xs mt-1 line-clamp-2" style={{ color: "var(--c-muted)" }}>{subject.description}</p>
                      <div className="flex gap-3 mt-3 text-xs" style={{ color: "var(--c-subtle)" }}>
                        <span>📝 {subject.quizzes.length}</span>
                        <span>🔗 {subject.links.length}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-3xl mx-auto">
            <button onClick={() => setActiveSubjectId(null)} className="text-sm flex items-center gap-1 mb-4" style={{ color: "var(--c-muted)" }}>
              &larr; All subjects
            </button>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl" style={{ background: "linear-gradient(135deg, var(--c-accent), #7c3aed)" }}>
                <span>{activeSubject.icon}</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold" style={{ color: "var(--c-fg)" }}>{activeSubject.name}</h2>
                <p className="text-sm" style={{ color: "var(--c-muted)" }}>{activeSubject.description}</p>
              </div>
            </div>

            <div className="flex gap-4 border-b pb-3 mb-6" style={{ borderColor: "var(--c-border)" }}>
              <button onClick={() => setContentTab("quizzes")} className="text-sm font-medium pb-1" style={{
                color: contentTab === "quizzes" ? "var(--c-fg)" : "var(--c-subtle)",
                borderBottom: contentTab === "quizzes" ? "2px solid #3b82f6" : "2px solid transparent",
              }}>📝 Quizzes</button>
              <button onClick={() => setContentTab("links")} className="text-sm font-medium pb-1" style={{
                color: contentTab === "links" ? "var(--c-fg)" : "var(--c-subtle)",
                borderBottom: contentTab === "links" ? "2px solid #3b82f6" : "2px solid transparent",
              }}>🔗 Resources & Links</button>
            </div>

            {contentTab === "quizzes" && (
              <section>
                {activeSubject.quizzes.length === 0 ? (
                  <p className="text-sm" style={{ color: "var(--c-subtle)" }}>No quizzes yet.</p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {activeSubject.quizzes.map((quiz) => (
                      <Link
                        key={quiz.id}
                        href={`/quiz/${quiz.id}`}
                        className="block rounded-xl border p-4 transition-all hover:shadow-sm hover:-translate-y-0.5"
                        style={{ background: "var(--c-card)", borderColor: "var(--c-border)" }}
                      >
                        <h4 className="font-medium text-sm" style={{ color: "var(--c-fg)" }}>{quiz.title}</h4>
                        <p className="text-xs mt-1" style={{ color: "var(--c-subtle)" }}>{quiz.questions.length} question{(quiz.questions.length !== 1) ? "s" : ""}</p>
                      </Link>
                    ))}
                  </div>
                )}
              </section>
            )}

            {contentTab === "links" && (
              <section>
                {activeSubject.links.length === 0 ? (
                  <p className="text-sm" style={{ color: "var(--c-subtle)" }}>No links yet.</p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {activeSubject.links.map((link, i) => (
                      <a
                        key={i}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block rounded-xl border p-4 transition-all hover:shadow-sm hover:-translate-y-0.5"
                        style={{ background: "var(--c-card)", borderColor: "var(--c-border)" }}
                      >
                        <h4 className="font-medium text-sm underline" style={{ color: "#3b82f6" }}>{link.title}</h4>
                        <p className="text-xs mt-1" style={{ color: "var(--c-subtle)" }}>{link.description}</p>
                      </a>
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
