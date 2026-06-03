"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "../AuthProvider"
import SettingsPanel from "../SettingsPanel"

export default function Dashboard() {
  const { user, loading, logOut } = useAuth()
  const router = useRouter()
  const [data, setData] = useState(null)
  const [classrooms, setClassrooms] = useState([{ id: "2029", name: "Class of 2029", grade: "9th" }])
  const [activeClassroom, setActiveClassroom] = useState("2029")
  const [showNewClassroom, setShowNewClassroom] = useState(false)
  const [newName, setNewName] = useState("")

  useEffect(() => {
    if (!loading && !user) router.push("/login")
  }, [user, loading, router])

  useEffect(() => {
    fetch("/api/data").then(r => r.json()).then(setData).catch(() => setData({ subjects: [] }))
  }, [])

  useEffect(() => {
    try {
      const saved = localStorage.getItem("studyhub-classrooms")
      if (saved) setClassrooms(JSON.parse(saved))
    } catch {}
  }, [])

  const saveClassrooms = (newList) => {
    setClassrooms(newList)
    localStorage.setItem("studyhub-classrooms", JSON.stringify(newList))
  }

  const addClassroom = () => {
    if (!newName.trim()) return
    const id = newName.toLowerCase().replace(/\s+/g, "-")
    saveClassrooms([...classrooms, { id, name: newName.trim(), grade: "" }])
    setNewName("")
    setShowNewClassroom(false)
    setActiveClassroom(id)
  }

  if (loading || !user || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--c-bg)", color: "var(--c-subtle)" }}>
        Loading...
      </div>
    )
  }

  const subjects = data.subjects || []

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--c-bg)" }}>
      <header style={{ background: "var(--c-card)", borderColor: "var(--c-border)" }} className="border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold" style={{ color: "var(--c-fg)" }}>StudyHub</span>
            <Link href="/admin/dashboard" className="text-xs px-2 py-0.5 rounded" style={{ color: "var(--c-subtle)" }}>Admin</Link>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs hidden sm:inline" style={{ color: "var(--c-subtle)" }}>{user.email}</span>
            <SettingsPanel />
            <button onClick={logOut} className="text-xs" style={{ color: "var(--c-subtle)" }}>Log out</button>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-6xl mx-auto px-4 py-6 flex gap-6 w-full">
        <aside className="w-56 shrink-0">
          <div style={{ background: "var(--c-card)", borderColor: "var(--c-border)" }} className="rounded-xl border p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--c-muted)" }}>Classrooms</h2>
            <div className="space-y-1">
              {classrooms.map(c => (
                <button
                  key={c.id}
                  onClick={() => setActiveClassroom(c.id)}
                  className="w-full text-left px-2 py-1.5 rounded-lg text-sm transition-colors"
                  style={{
                    background: activeClassroom === c.id ? "#dbeafe" : "transparent",
                    color: activeClassroom === c.id ? "#1d4ed8" : "var(--c-fg)",
                  }}
                >
                  {c.name}
                </button>
              ))}
            </div>
            {showNewClassroom ? (
              <div className="mt-3 space-y-2">
                <input
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Class name..."
                  className="w-full px-2 py-1 text-xs rounded border"
                  style={{ background: "var(--c-bg)", borderColor: "var(--c-border)", color: "var(--c-fg)" }}
                  onKeyDown={e => e.key === "Enter" && addClassroom()}
                />
                <div className="flex gap-2">
                  <button onClick={addClassroom} className="text-xs" style={{ color: "#2563eb" }}>Add</button>
                  <button onClick={() => setShowNewClassroom(false)} className="text-xs" style={{ color: "var(--c-subtle)" }}>Cancel</button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowNewClassroom(true)}
                className="w-full text-left mt-2 px-2 py-1.5 rounded-lg text-xs"
                style={{ color: "var(--c-subtle)" }}
              >
                + New Classroom
              </button>
            )}
          </div>
        </aside>

        <main className="flex-1 min-w-0">
          <div className="mb-6">
            <h2 className="text-xl font-bold" style={{ color: "var(--c-fg)" }}>{classroom?.name || "Class of " + activeClassroom}</h2>
            <p className="text-sm mt-1" style={{ color: "var(--c-muted)" }}>{subjects.length} subject{(subjects.length !== 1) ? "s" : ""}</p>
          </div>

          {subjects.length === 0 ? (
            <div className="text-center py-20" style={{ color: "var(--c-subtle)" }}>
              <p className="text-lg">No subjects yet.</p>
              <p className="text-sm mt-1">Check back later or ask your admin to add them.</p>
            </div>
          ) : (
            <div className="grid gap-4 subject-grid sm:grid-cols-2 lg:grid-cols-3">
              {subjects.map((subject) => (
                <Link
                  key={subject.id}
                  href={`/subjects/${subject.id}`}
                  className="block rounded-xl border p-5 subject-card"
                  style={{ background: "var(--c-card)", borderColor: "var(--c-border)" }}
                >
                  <div className="text-3xl mb-3">{subject.icon}</div>
                  <h3 className="text-lg font-semibold" style={{ color: "var(--c-fg)" }}>{subject.name}</h3>
                  <p className="text-sm mt-1" style={{ color: "var(--c-muted)" }}>{subject.description}</p>
                  <div className="flex gap-3 mt-3 text-xs" style={{ color: "var(--c-subtle)" }}>
                    <span>{subject.quizzes.length} quiz{(subject.quizzes.length !== 1) ? "zes" : ""}</span>
                    <span>{subject.links.length} link{(subject.links.length !== 1) ? "s" : ""}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
