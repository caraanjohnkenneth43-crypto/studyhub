"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/app/AuthProvider"
import SettingsPanel from "@/app/SettingsPanel"
import { db } from "@/lib/firebase"
import { doc, getDoc, deleteDoc, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, limit } from "firebase/firestore"

export default function ChatRoom() {
  const { id } = useParams()
  const { user, loading, logOut } = useAuth()
  const router = useRouter()
  const [room, setRoom] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState("")
  const [password, setPassword] = useState("")
  const [passwordError, setPasswordError] = useState(false)
  const [verified, setVerified] = useState(false)
  const [roomLoaded, setRoomLoaded] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    if (!loading && !user) router.push("/login")
  }, [user, loading, router])

  useEffect(() => {
    const ref = doc(db, "chatRooms", id)
    getDoc(ref).then(snap => {
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() }
        setRoom(data)
        if (data.type === "public") {
          setVerified(true)
        } else {
          try {
            const stored = JSON.parse(sessionStorage.getItem("chat-passwords") || "{}")
            if (stored[id] === data.password) setVerified(true)
          } catch {}
        }
      }
      setRoomLoaded(true)
    })
  }, [id])

  useEffect(() => {
    if (!verified) return
    const q = query(collection(db, "chatRooms", id, "messages"), orderBy("timestamp", "asc"), limit(200))
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [id, verified])

  const checkPassword = () => {
    if (password === room.password) {
      setVerified(true)
      setPasswordError(false)
      try {
        const stored = JSON.parse(sessionStorage.getItem("chat-passwords") || "{}")
        stored[id] = password
        sessionStorage.setItem("chat-passwords", JSON.stringify(stored))
      } catch {}
    } else {
      setPasswordError(true)
    }
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const blockedWords = ["fuck", "shit", "cunt", "bitch", "asshole", "dick", "bastard"]

  const censor = (msg) => {
    let censored = msg
    for (const word of blockedWords) {
      const re = new RegExp("\\b" + word + "\\b", "gi")
      censored = censored.replace(re, "*".repeat(word.length))
    }
    return censored
  }

  const send = async (e) => {
    e.preventDefault()
    if (!text.trim()) return
    await addDoc(collection(db, "chatRooms", id, "messages"), {
      userId: user.uid,
      userName: user.email.split("@")[0],
      text: censor(text.trim()),
      timestamp: serverTimestamp(),
    })
    setText("")
  }

  const deleteRoom = async () => {
    await deleteDoc(doc(db, "chatRooms", id))
    router.push("/chat")
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--c-bg)", color: "var(--c-subtle)" }}>
        Loading...
      </div>
    )
  }

  if (roomLoaded && !room) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: "var(--c-bg)", color: "var(--c-subtle)" }}>
        <p className="text-lg">Room not found.</p>
        <Link href="/chat" className="text-sm underline mt-2" style={{ color: "#3b82f6" }}>Back to chat</Link>
      </div>
    )
  }

  if (room && room.type === "private" && !verified) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--c-bg)" }}>
        <div className="rounded-xl border shadow-xl p-6 w-full max-w-sm mx-4" style={{ background: "var(--c-card)", borderColor: "var(--c-border)" }}>
          <h2 className="text-lg font-semibold mb-1" style={{ color: "var(--c-fg)" }}>🔒 Private Room</h2>
          <p className="text-sm mb-4" style={{ color: "var(--c-muted)" }}>Enter the room password to join.</p>
          <input
            value={password}
            onChange={e => { setPassword(e.target.value); setPasswordError(false) }}
            type="password"
            placeholder="Room password"
            onKeyDown={e => e.key === "Enter" && checkPassword()}
            className="w-full px-3 py-2 rounded-lg text-sm border mb-2"
            style={{ background: "var(--c-bg)", borderColor: passwordError ? "#ef4444" : "var(--c-border)", color: "var(--c-fg)" }}
          />
          {passwordError && <p className="text-xs mb-2" style={{ color: "#ef4444" }}>Incorrect password.</p>}
          <button onClick={checkPassword} disabled={!password.trim()} className="w-full py-2 text-white rounded-lg text-sm font-medium disabled:opacity-50" style={{ background: "#2563eb" }}>Join Room</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--c-bg)" }}>
      <header style={{ background: "var(--c-card)", borderColor: "var(--c-border)" }} className="border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="text-sm px-2 py-1 rounded transition-colors hover:bg-black/5" style={{ color: "var(--c-muted)" }}>&larr;</button>
            <span className="text-lg font-bold" style={{ color: "var(--c-fg)" }}># {room?.name || "..."}</span>
            <Link href="/dashboard" className="text-xs px-2 py-0.5 rounded" style={{ color: "var(--c-subtle)" }}>Dashboard</Link>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs hidden sm:inline" style={{ color: "var(--c-subtle)" }}>{user.email}</span>
            {room && room.createdBy === user.uid && !confirmDelete && (
              <button onClick={() => setConfirmDelete(true)} className="text-xs" style={{ color: "#ef4444" }}>Delete room</button>
            )}
            {room && room.createdBy === user.uid && confirmDelete && (
              <span className="flex items-center gap-2">
                <button onClick={deleteRoom} className="text-xs font-semibold" style={{ color: "#ef4444" }}>Confirm</button>
                <button onClick={() => setConfirmDelete(false)} className="text-xs" style={{ color: "var(--c-subtle)" }}>Cancel</button>
              </span>
            )}
            <SettingsPanel />
            <button onClick={logOut} className="text-xs" style={{ color: "var(--c-subtle)" }}>Log out</button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full sm:px-4 px-2" style={{ height: "calc(100vh - 49px)" }}>
        <div className="flex-1 overflow-y-auto py-4 space-y-2">
          {messages.length === 0 && room && (
            <div className="text-center py-12" style={{ color: "var(--c-subtle)" }}>
              <p className="text-sm">No messages yet. Start the conversation!</p>
            </div>
          )}
          {messages.map(msg => (
            <div key={msg.id} className="flex gap-2 px-2">
              <span className="text-xs font-medium shrink-0 mt-0.5" style={{ color: msg.userId === user.uid ? "#3b82f6" : "var(--c-fg)" }}>
                {msg.userName || "Anonymous"}:
              </span>
              <span className="text-xs" style={{ color: "var(--c-muted)" }}>{msg.text}</span>
              {msg.timestamp && (
                <span className="text-[10px] shrink-0 ml-auto" style={{ color: "var(--c-subtle)" }}>
                  {new Date(msg.timestamp.seconds * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={send} className="pb-4 pt-2">
          <div className="flex gap-2">
            <input
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-3 py-2 rounded-lg text-sm border"
              style={{ background: "var(--c-bg)", borderColor: "var(--c-border)", color: "var(--c-fg)" }}
            />
            <button
              type="submit"
              disabled={!text.trim()}
              className="px-4 py-2 text-white rounded-lg text-sm font-medium disabled:opacity-50"
              style={{ background: "#2563eb" }}
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
