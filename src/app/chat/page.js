"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "../AuthProvider"
import SettingsPanel from "../SettingsPanel"
import { db } from "@/lib/firebase"
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, getDocs, limit, doc, setDoc } from "firebase/firestore"

export default function ChatPage() {
  const { user, loading, logOut, isAdmin } = useAuth()
  const router = useRouter()
  const [rooms, setRooms] = useState([])
  const [showCreate, setShowCreate] = useState(false)
  const [newRoom, setNewRoom] = useState({ name: "", description: "", topic: "", type: "public", password: "" })
  const [roomsLoaded, setRoomsLoaded] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.push("/login")
  }, [user, loading, router])

  useEffect(() => {
    const q = query(collection(db, "chatRooms"), orderBy("createdAt", "asc"))
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setRooms(list)
      setRoomsLoaded(true)
      if (list.length === 0) {
        const ref = doc(db, "chatRooms", "general")
        setDoc(ref, {
          name: "General",
          description: "Welcome everyone! This is the main lobby.",
          topic: "Anything",
          type: "public",
          createdBy: "system",
          createdByName: "StudyHub",
          createdAt: serverTimestamp(),
        })
      }
    })
    return unsub
  }, [])

  const createRoom = async (e) => {
    e.preventDefault()
    if (!newRoom.name.trim()) return
    await addDoc(collection(db, "chatRooms"), {
      name: newRoom.name.trim(),
      description: newRoom.description.trim(),
      topic: newRoom.topic.trim(),
      type: newRoom.type,
      password: newRoom.type === "private" ? newRoom.password.trim() : "",
      createdBy: user.uid,
      createdByName: user.email,
      createdAt: serverTimestamp(),
    })
    setNewRoom({ name: "", description: "", topic: "", type: "public", password: "" })
    setShowCreate(false)
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--c-bg)", color: "var(--c-subtle)" }}>
        Loading...
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--c-bg)" }}>
      <header style={{ background: "var(--c-card)", borderColor: "var(--c-border)" }} className="border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="text-sm px-2 py-1 rounded transition-colors hover:bg-black/5" style={{ color: "var(--c-muted)" }}>&larr;</button>
            <span className="text-lg font-bold" style={{ color: "var(--c-fg)" }}>Chat</span>
            <Link href="/dashboard" className="text-xs px-2 py-0.5 rounded" style={{ color: "var(--c-subtle)" }}>Dashboard</Link>
            {isAdmin && <Link href="/admin/dashboard" className="text-xs px-2 py-0.5 rounded" style={{ color: "var(--c-subtle)" }}>Admin</Link>}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs hidden sm:inline" style={{ color: "var(--c-subtle)" }}>{user.email}</span>
            <SettingsPanel />
            <button onClick={logOut} className="text-xs" style={{ color: "var(--c-subtle)" }}>Log out</button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex w-full mobile-stack">
        <aside
          className="w-1/4 min-w-[220px] max-w-[280px] border-r shrink-0 overflow-y-auto mobile-sidebar"
          style={{ background: "var(--c-card)", borderColor: "var(--c-border)", height: "calc(100vh - 49px)" }}
        >
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--c-muted)" }}>Rooms</h2>
              <button onClick={() => setShowCreate(true)} className="text-xs" style={{ color: "#2563eb" }}>+ New</button>
            </div>
            {rooms.length === 0 ? (
              <p className="text-xs" style={{ color: "var(--c-subtle)" }}>Loading...</p>
            ) : (
              <div className="space-y-1">
                {rooms.filter(room => !room.blocked?.includes(user.email)).map(room => (
                  <Link
                    key={room.id}
                    href={`/chat/${room.id}`}
                    className="block px-2 py-1.5 rounded-lg text-sm transition-colors"
                    style={{ color: "var(--c-fg)" }}
                  >
                    <span className="font-medium">{room.type === "private" ? "🔒 " : "# "}{room.name}</span>
                    {room.description && (
                      <p className="text-xs truncate" style={{ color: "var(--c-subtle)" }}>{room.description}</p>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </aside>

        <main className="flex-1 p-6 overflow-y-auto" style={{ height: "calc(100vh - 49px)" }}>
          {showCreate ? (
            <div style={{ background: "var(--c-card)", borderColor: "var(--c-border)" }} className="max-w-md mx-auto rounded-xl border p-6">
              <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--c-fg)" }}>Create a Room</h2>
              <form onSubmit={createRoom} className="space-y-3">
                <div>
                  <label className="text-xs block mb-1" style={{ color: "var(--c-muted)" }}>Name *</label>
                  <input value={newRoom.name} onChange={e => setNewRoom({ ...newRoom, name: e.target.value })} placeholder="Room name" required className="w-full px-2 py-1.5 rounded-lg text-sm border" style={{ background: "var(--c-bg)", borderColor: "var(--c-border)", color: "var(--c-fg)" }} />
                </div>
                <div>
                  <label className="text-xs block mb-1" style={{ color: "var(--c-muted)" }}>Description</label>
                  <input value={newRoom.description} onChange={e => setNewRoom({ ...newRoom, description: e.target.value })} placeholder="What's this room about?" className="w-full px-2 py-1.5 rounded-lg text-sm border" style={{ background: "var(--c-bg)", borderColor: "var(--c-border)", color: "var(--c-fg)" }} />
                </div>
                <div>
                  <label className="text-xs block mb-1" style={{ color: "var(--c-muted)" }}>Topic</label>
                  <input value={newRoom.topic} onChange={e => setNewRoom({ ...newRoom, topic: e.target.value })} placeholder="e.g. Science, Homework Help" className="w-full px-2 py-1.5 rounded-lg text-sm border" style={{ background: "var(--c-bg)", borderColor: "var(--c-border)", color: "var(--c-fg)" }} />
                </div>
                <div>
                  <label className="text-xs block mb-1" style={{ color: "var(--c-muted)" }}>Type</label>
                  <select value={newRoom.type} onChange={e => setNewRoom({ ...newRoom, type: e.target.value, password: "" })} className="w-full px-2 py-1.5 rounded-lg text-sm border" style={{ background: "var(--c-bg)", borderColor: "var(--c-border)", color: "var(--c-fg)" }}>
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </select>
                </div>
                {newRoom.type === "private" && (
                  <div>
                    <label className="text-xs block mb-1" style={{ color: "var(--c-muted)" }}>Temporary Password</label>
                    <input value={newRoom.password} onChange={e => setNewRoom({ ...newRoom, password: e.target.value })} type="password" placeholder="Set a room password" required className="w-full px-2 py-1.5 rounded-lg text-sm border" style={{ background: "var(--c-bg)", borderColor: "var(--c-border)", color: "var(--c-fg)" }} />
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <button type="submit" className="px-4 py-1.5 text-white rounded-lg text-sm font-medium" style={{ background: "#2563eb" }}>Create</button>
                  <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-1.5 rounded-lg text-sm" style={{ color: "var(--c-subtle)" }}>Cancel</button>
                </div>
              </form>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center" style={{ color: "var(--c-subtle)" }}>
                <p className="text-lg">Select a room</p>
                <p className="text-sm mt-1">Choose a room from the sidebar or create a new one.</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
