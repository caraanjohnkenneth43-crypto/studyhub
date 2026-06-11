"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "../AuthProvider"

export default function NotesPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [notes, setNotes] = useState([])
  const [subjects, setSubjects] = useState([])
  const [filterSubject, setFilterSubject] = useState("")
  const [activeNote, setActiveNote] = useState(null)
  const [editorContent, setEditorContent] = useState("")
  const [editorTitle, setEditorTitle] = useState("")
  const [preview, setPreview] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.push("/login")
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return
    fetch("/api/data").then(r => r.json()).then(d => setSubjects(d.subjects || []))
    fetchNotes()
  }, [user])

  const fetchNotes = () => {
    if (!user) return
    fetch(`/api/notes?userId=${user.uid}`).then(r => r.json()).then(d => setNotes(d.notes || []))
  }

  const selectNote = (note) => {
    setActiveNote(note.id)
    setEditorTitle(note.title)
    setEditorContent(note.content)
    setPreview(false)
  }

  const newNote = () => {
    setActiveNote("new")
    setEditorTitle("")
    setEditorContent("")
    setPreview(false)
  }

  const saveNote = async () => {
    if (!user || !editorContent.trim()) return
    setSaving(true)
    if (activeNote === "new") {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid, subjectId: filterSubject, title: editorTitle, content: editorContent }),
      })
      const data = await res.json()
      if (data.id) {
        setActiveNote(data.id)
        fetchNotes()
      }
    } else {
      await fetch("/api/notes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: activeNote, title: editorTitle, content: editorContent }),
      })
      fetchNotes()
    }
    setSaving(false)
  }

  const deleteNote = async () => {
    if (!activeNote || activeNote === "new") return
    await fetch("/api/notes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: activeNote }),
    })
    setActiveNote(null)
    setEditorContent("")
    setEditorTitle("")
    fetchNotes()
  }

  const filtered = filterSubject ? notes.filter(n => n.subjectId === filterSubject) : notes

  const renderMarkdown = (text) => {
    return text
      .replace(/### (.+)/g, "<h3 class='font-semibold mt-3 mb-1'>$1</h3>")
      .replace(/## (.+)/g, "<h2 class='font-bold text-lg mt-4 mb-1'>$1</h2>")
      .replace(/# (.+)/g, "<h1 class='font-bold text-xl mt-4 mb-2'>$1</h1>")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/^- (.+)/gm, "<li class='ml-4 list-disc'>$1</li>")
      .replace(/\n\n/g, "</p><p class='mt-2'>")
      .replace(/\n/g, "<br>")
  }

  if (loading || !user) return null

  return (
    <div className="flex h-[calc(100vh-48px)]" style={{ color: "var(--c-fg)" }}>
      <div className="w-72 shrink-0 border-r flex flex-col" style={{ borderColor: "var(--c-border)", background: "var(--c-card)" }}>
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--c-border)" }}>
          <h1 className="text-base font-bold">Notes</h1>
          <button onClick={newNote} className="text-lg leading-none px-2 py-1 rounded" style={{ color: "var(--c-accent)" }}>+</button>
        </div>
        <div className="p-3 border-b" style={{ borderColor: "var(--c-border)" }}>
          <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)} className="w-full px-2 py-1.5 rounded-lg border text-xs" style={{ background: "var(--c-bg)", borderColor: "var(--c-border)", color: "var(--c-fg)" }}>
            <option value="">All subjects</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
          </select>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 && <p className="text-xs p-4 text-center" style={{ color: "var(--c-subtle)" }}>No notes yet</p>}
          {filtered.map(n => (
            <button key={n.id} onClick={() => selectNote(n)} className="w-full text-left px-4 py-3 border-b text-sm" style={{ borderColor: "var(--c-border)", background: activeNote === n.id ? "var(--c-bg)" : "transparent" }}>
              <div className="font-medium truncate">{n.title}</div>
              <div className="text-xs mt-0.5" style={{ color: "var(--c-subtle)" }}>{new Date(n.updatedAt).toLocaleDateString()}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {!activeNote ? (
          <div className="flex-1 flex items-center justify-center text-sm" style={{ color: "var(--c-subtle)" }}>
            Select or create a note
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: "var(--c-border)" }}>
              <input value={editorTitle} onChange={e => setEditorTitle(e.target.value)} placeholder="Note title..." className="bg-transparent text-base font-semibold outline-none flex-1" />
              <div className="flex items-center gap-2">
                <button onClick={() => setPreview(!preview)} className="text-xs px-2.5 py-1.5 rounded-lg" style={{ background: "var(--c-bg)", color: preview ? "var(--c-accent)" : "var(--c-subtle)" }}>
                  {preview ? "Edit" : "Preview"}
                </button>
                <button onClick={saveNote} disabled={saving} className="text-xs px-3 py-1.5 rounded-lg text-white" style={{ background: "var(--c-accent)" }}>
                  {saving ? "Saving..." : "Save"}
                </button>
                {activeNote !== "new" && <button onClick={deleteNote} className="text-xs px-2 py-1 rounded" style={{ color: "#ef4444" }}>Delete</button>}
              </div>
            </div>
            {preview ? (
              <div className="flex-1 p-6 overflow-y-auto text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: renderMarkdown(editorContent) }} />
            ) : (
              <textarea
                value={editorContent}
                onChange={e => setEditorContent(e.target.value)}
                placeholder="Write your notes here... (Markdown supported: # headings, **bold**, *italic*, - lists)"
                className="flex-1 p-6 text-sm leading-relaxed resize-none outline-none font-mono"
                style={{ background: "var(--c-bg)", color: "var(--c-fg)" }}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}
