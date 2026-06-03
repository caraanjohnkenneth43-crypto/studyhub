"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function AdminDashboard() {
  const router = useRouter()
  const [data, setData] = useState(null)
  const [activeSubject, setActiveSubject] = useState(null)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  const defaultSubject = { id: "", name: "", icon: "📘", description: "", color: "#3b82f6", quizzes: [], links: [] }
  const defaultQuiz = { id: "", title: "", questions: [{ question: "", options: ["", "", "", ""], answer: "" }] }
  const defaultLink = { title: "", url: "", description: "" }

  useEffect(() => {
    fetch("/api/data").then((r) => r.json()).then(setData)
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
      setTimeout(() => setMessage(""), 2000)
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

  if (!data) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading...</div>
  }

  const subject = activeSubject !== null ? data.subjects[activeSubject] : null

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-slate-900">Admin Dashboard</h1>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Beta</span>
          </div>
          <div className="flex items-center gap-3">
            {message && <span className="text-xs text-green-600">{message}</span>}
            <button onClick={() => save()} disabled={saving} className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <a href="/" className="text-xs text-slate-400 hover:text-slate-600">&larr; View Site</a>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 flex gap-6">
        <aside className="w-64 shrink-0">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-700">Subjects</h2>
              <button onClick={addSubject} className="text-xs text-blue-600 hover:underline">+ Add</button>
            </div>
            {data.subjects.length === 0 && <p className="text-xs text-slate-400">No subjects yet.</p>}
            <div className="space-y-1">
              {data.subjects.map((s, i) => (
                <div
                  key={i}
                  onClick={() => setActiveSubject(i)}
                  className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-sm cursor-pointer transition-colors ${
                    activeSubject === i ? "bg-blue-50 text-blue-700" : "hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <span>{s.icon} {s.name || "New Subject"}</span>
                  <button onClick={(e) => { e.stopPropagation(); deleteSubject(i) }} className="text-slate-300 hover:text-red-500 text-xs ml-2">✕</button>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <main className="flex-1">
          {!subject ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
              <p>Select a subject from the sidebar to edit.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h2 className="text-sm font-semibold text-slate-700 mb-3">Subject Details</h2>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Name</label>
                    <input value={subject.name} onChange={(e) => updateSubject(activeSubject, "name", e.target.value)} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Icon (emoji)</label>
                    <input value={subject.icon} onChange={(e) => updateSubject(activeSubject, "icon", e.target.value)} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-sm" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-slate-500 block mb-1">Description</label>
                    <input value={subject.description} onChange={(e) => updateSubject(activeSubject, "description", e.target.value)} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Subject ID (used in URL)</label>
                    <input value={subject.id} onChange={(e) => updateSubject(activeSubject, "id", e.target.value)} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-sm font-mono" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-slate-700">Quizzes</h2>
                  <button onClick={() => addQuiz(activeSubject)} className="text-xs text-blue-600 hover:underline">+ Add Quiz</button>
                </div>
                {subject.quizzes.length === 0 && <p className="text-xs text-slate-400">No quizzes yet.</p>}
                {subject.quizzes.map((quiz, qi) => (
                  <div key={qi} className="border border-slate-200 rounded-lg p-4 mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <input value={quiz.title} onChange={(e) => updateQuiz(activeSubject, qi, "title", e.target.value)} placeholder="Quiz title" className="font-medium text-sm border-b border-transparent focus:border-slate-300 px-1 py-0.5" />
                      <div className="flex gap-2">
                        <button onClick={() => deleteQuiz(activeSubject, qi)} className="text-xs text-red-400 hover:text-red-600">Delete Quiz</button>
                      </div>
                    </div>
                    <input value={quiz.id} onChange={(e) => updateQuiz(activeSubject, qi, "id", e.target.value)} placeholder="quiz-id (used in URL)" className="w-full text-xs font-mono text-slate-400 border-b border-transparent focus:border-slate-300 px-1 py-0.5 mb-3" />
                    {quiz.questions.map((q, qn) => (
                      <div key={qn} className="bg-slate-50 rounded-lg p-3 mb-2">
                        <div className="flex items-start justify-between mb-2">
                          <input value={q.question} onChange={(e) => updateQuestion(activeSubject, qi, qn, "question", e.target.value)} placeholder={`Question ${qn + 1}`} className="flex-1 text-sm bg-transparent border-b border-transparent focus:border-slate-300 px-1 py-0.5" />
                          <button onClick={() => deleteQuestion(activeSubject, qi, qn)} className="text-xs text-red-400 hover:text-red-600 ml-2">✕</button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {q.options.map((opt, oi) => (
                            <label key={oi} className={`flex items-center gap-2 px-2 py-1 rounded text-xs cursor-pointer ${q.answer === opt ? "bg-green-100" : "bg-white"}`}>
                              <input type="radio" name={`q-${qi}-${qn}`} checked={q.answer === opt} onChange={() => updateQuestion(activeSubject, qi, qn, "answer", opt)} />
                              <input value={opt} onChange={(e) => {
                                const opts = [...q.options]
                                opts[oi] = e.target.value
                                updateQuestion(activeSubject, qi, qn, "options", opts)
                              }} className="bg-transparent border-b border-transparent focus:border-slate-300 px-1 py-0.5 w-full" />
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                    <button onClick={() => addQuestion(activeSubject, qi)} className="text-xs text-blue-600 hover:underline mt-1">+ Add Question</button>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-slate-700">Links / Resources</h2>
                  <button onClick={() => addLink(activeSubject)} className="text-xs text-blue-600 hover:underline">+ Add Link</button>
                </div>
                {subject.links.length === 0 && <p className="text-xs text-slate-400">No links yet.</p>}
                {subject.links.map((link, li) => (
                  <div key={li} className="flex items-center gap-2 border border-slate-200 rounded-lg p-3 mb-2">
                    <input value={link.title} onChange={(e) => updateLink(activeSubject, li, "title", e.target.value)} placeholder="Link title" className="flex-1 text-sm border-b border-transparent focus:border-slate-300 px-1 py-0.5" />
                    <input value={link.url} onChange={(e) => updateLink(activeSubject, li, "url", e.target.value)} placeholder="https://..." className="flex-1 text-xs text-slate-500 font-mono border-b border-transparent focus:border-slate-300 px-1 py-0.5" />
                    <input value={link.description} onChange={(e) => updateLink(activeSubject, li, "description", e.target.value)} placeholder="Description" className="hidden sm:block flex-1 text-xs text-slate-400 border-b border-transparent focus:border-slate-300 px-1 py-0.5" />
                    <button onClick={() => deleteLink(activeSubject, li)} className="text-xs text-red-400 hover:text-red-600">✕</button>
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