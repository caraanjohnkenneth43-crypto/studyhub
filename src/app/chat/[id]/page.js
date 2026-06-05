"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth, allowedAdmins } from "@/app/AuthProvider"
import SettingsPanel from "@/app/SettingsPanel"
import { useActiveRoom } from "@/app/ChatNotificationProvider"
import { db } from "@/lib/firebase"
import { censorMessage, containsProfanity } from "@/lib/profanity"
import { doc, getDoc, deleteDoc, updateDoc, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, limit } from "firebase/firestore"

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
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const [showBlockPanel, setShowBlockPanel] = useState(false)
  const [blockEmail, setBlockEmail] = useState("")
  const [contributors, setContributors] = useState([])
  const bottomRef = useRef(null)
  const messagesRef = useRef(null)
  const { setActiveRoom } = useActiveRoom()

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
            const stored = JSON.parse(localStorage.getItem("chat-passwords") || "{}")
            if (stored[id] === data.password) setVerified(true)
          } catch {}
        }
      }
      setRoomLoaded(true)
    })
  }, [id])

  useEffect(() => {
    setActiveRoom?.(verified ? id : null)
    return () => setActiveRoom?.(null)
  }, [verified, id, setActiveRoom])

  useEffect(() => {
    if (!verified) return
    const q = query(collection(db, "chatRooms", id, "messages"), orderBy("timestamp", "asc"), limit(200))
    const unsub = onSnapshot(q, (snap) => {
      const clean = []
      snap.docs.forEach(d => {
        if (containsProfanity(d.data().text || "")) {
          deleteDoc(doc(db, "chatRooms", id, "messages", d.id))
        } else {
          clean.push({ id: d.id, ...d.data() })
        }
      })
      setMessages(clean)
    })
    return unsub
  }, [id, verified])

  useEffect(() => {
    fetch("/api/data").then(r => r.json()).then(d => setContributors(d.contributors || [])).catch(() => {})
  }, [])

  const checkPassword = () => {
    if (password === room.password) {
      setVerified(true)
      setPasswordError(false)
      try {
        const stored = JSON.parse(localStorage.getItem("chat-passwords") || "{}")
        stored[id] = password
        localStorage.setItem("chat-passwords", JSON.stringify(stored))
      } catch {}
    } else {
      setPasswordError(true)
    }
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    const el = messagesRef.current
    if (!el) return
    const onScroll = () => {
      const { scrollHeight, scrollTop, clientHeight } = el
      setShowScrollBtn(scrollHeight - scrollTop - clientHeight >= 100)
    }
    el.addEventListener("scroll", onScroll)
    return () => el.removeEventListener("scroll", onScroll)
  }, [])

  const send = async (e) => {
    e.preventDefault()
    if (!text.trim()) return
    await addDoc(collection(db, "chatRooms", id, "messages"), {
      userId: user.uid,
      userName: user.email.split("@")[0],
      userEmail: user.email,
      text: censorMessage(text.trim()),
      timestamp: serverTimestamp(),
    })
    setText("")
  }

  const deleteRoom = async () => {
    await deleteDoc(doc(db, "chatRooms", id))
    router.push("/chat")
  }

  const blockUser = async () => {
    if (!blockEmail.trim()) return
    await updateDoc(doc(db, "chatRooms", id), { blocked: [...(room.blocked || []), blockEmail.trim()] })
    setRoom(prev => ({ ...prev, blocked: [...(prev.blocked || []), blockEmail.trim()] }))
    setBlockEmail("")
  }

  const unblockUser = async (email) => {
    await updateDoc(doc(db, "chatRooms", id), { blocked: (room.blocked || []).filter(e => e !== email) })
    setRoom(prev => ({ ...prev, blocked: (prev.blocked || []).filter(e => e !== email) }))
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

  if (room && room.blocked?.includes(user.email)) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--c-bg)" }}>
        <div className="rounded-xl border shadow-xl p-6 w-full max-w-sm mx-4 text-center" style={{ background: "var(--c-card)", borderColor: "var(--c-border)" }}>
          <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--c-fg)" }}>🔒 Access Revoked</h2>
          <p className="text-sm mb-4" style={{ color: "var(--c-muted)" }}>You've been removed from this room by the owner.</p>
          <Link href="/chat" className="text-sm underline" style={{ color: "#3b82f6" }}>Back to chat</Link>
        </div>
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
            autoComplete="new-password"
            data-1p-ignore
            data-lpignore="true"
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
      <header style={{ background: "var(--c-card)", borderColor: "var(--c-border)" }} className="border-b sticky top-0 z-10">
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
            {room && room.createdBy === user.uid && room.type === "private" && (
              <button onClick={() => setShowBlockPanel(!showBlockPanel)} className="text-xs" style={{ color: "var(--c-subtle)" }}>Manage</button>
            )}
            <SettingsPanel />
            <button onClick={logOut} className="text-xs" style={{ color: "var(--c-subtle)" }}>Log out</button>
          </div>
        </div>
      </header>

      {showBlockPanel && room && room.createdBy === user.uid && room.type === "private" && (
        <div className="relative z-10 max-w-6xl mx-auto w-full px-4">
          <div className="rounded-xl border shadow-xl p-4 w-full max-w-sm" style={{ background: "var(--c-card)", borderColor: "var(--c-border)" }}>
            <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--c-fg)" }}>Blocked Users</h3>
            {(room.blocked || []).length === 0 ? (
              <p className="text-xs mb-3" style={{ color: "var(--c-subtle)" }}>No blocked users.</p>
            ) : (
              <div className="space-y-1 mb-3">
                {(room.blocked || []).map(email => (
                  <div key={email} className="flex items-center justify-between gap-2">
                    <span className="text-xs truncate" style={{ color: "var(--c-muted)" }}>{email}</span>
                    <button onClick={() => unblockUser(email)} className="text-xs shrink-0" style={{ color: "#3b82f6" }}>Unblock</button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                value={blockEmail}
                onChange={e => setBlockEmail(e.target.value)}
                placeholder="Email to block"
                className="flex-1 px-2 py-1 rounded text-xs border"
                style={{ background: "var(--c-bg)", borderColor: "var(--c-border)", color: "var(--c-fg)" }}
              />
              <button onClick={blockUser} disabled={!blockEmail.trim()} className="px-2 py-1 text-white rounded text-xs font-medium disabled:opacity-50" style={{ background: "#ef4444" }}>Block</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full sm:px-4 px-2 relative" style={{ height: "calc(100vh - 49px)" }}>
        <div ref={messagesRef} className="flex-1 overflow-y-auto py-4 space-y-2">
          {messages.length === 0 && room && (
            <div className="text-center py-12" style={{ color: "var(--c-subtle)" }}>
              <p className="text-sm">No messages yet. Start the conversation!</p>
            </div>
          )}
          {messages.map(msg => (
            <div key={msg.id} className="flex gap-2 px-2 min-w-0">
              <span className={`text-xs font-medium shrink-0 mt-0.5 ${(() => {
                const email = msg.userEmail
                if (msg.userId === user.uid) return ""
                if (email && allowedAdmins.includes(email)) return "font-bold bg-gradient-to-r from-gray-700 via-gray-300 to-white bg-clip-text text-transparent"
                if (email && contributors.includes(email)) return "bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent"
                return ""
              })()}`} style={{ color: (() => {
                const email = msg.userEmail
                if (msg.userId === user.uid) return "#3b82f6"
                if (email && (allowedAdmins.includes(email) || contributors.includes(email))) return undefined
                return "var(--c-fg)"
              })() }}>
                {msg.userName || "Anonymous"}:
              </span>
              <span className="text-xs break-words" style={{ color: "var(--c-muted)", overflowWrap: "anywhere", wordBreak: "break-word" }}>{msg.text}</span>
              {msg.timestamp && (
                <span className="text-[10px] shrink-0 ml-auto" style={{ color: "var(--c-subtle)" }}>
                  {new Date(msg.timestamp.seconds * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {showScrollBtn && (
          <button
            onClick={() => messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: "smooth" })}
            className="absolute bottom-20 right-6 w-10 h-10 rounded-full shadow-lg flex items-center justify-center text-white text-lg"
            style={{ background: "#2563eb" }}
          >
            ↓
          </button>
        )}

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
