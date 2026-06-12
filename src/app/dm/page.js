"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "../AuthProvider"
import SettingsPanel, { loadSettings } from "../SettingsPanel"
import { UserNameTag } from "@/app/UserTag"
import { db } from "@/lib/firebase"
import { collection, query, where, orderBy, onSnapshot, doc as fsDoc } from "firebase/firestore"
import { COLORS } from "@/lib/constants"

function formatTime(ts) {
  if (!ts) return ""
  const d = ts?.seconds ? new Date(ts.seconds * 1000) : new Date(ts)
  return isNaN(d.getTime()) ? "" : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

export default function DMPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [conversations, setConversations] = useState([])
  const [activeConv, setActiveConv] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState("")
  const [users, setUsers] = useState([])
  const [showNewDM, setShowNewDM] = useState(false)
  const [search, setSearch] = useState("")
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [chatSettings, setChatSettings] = useState(() => {
    const s = typeof window !== "undefined" ? loadSettings() : { messageTextSize: 14, userTagSize: 12 }
    return { messageTextSize: s.messageTextSize, userTagSize: s.userTagSize }
  })
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (!loading && !user) router.push("/login")
  }, [user, loading, router])

  useEffect(() => {
    const s = loadSettings()
    setChatSettings({ messageTextSize: s.messageTextSize, userTagSize: s.userTagSize })
    const handler = (e) => setChatSettings({
      messageTextSize: e.detail.messageTextSize,
      userTagSize: e.detail.userTagSize,
    })
    window.addEventListener("studyhub-settings-changed", handler)
    return () => window.removeEventListener("studyhub-settings-changed", handler)
  }, [])

  useEffect(() => {
    if (!user) return
    const q = query(collection(db, "conversations"), where("participants", "array-contains", user.uid))
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(c => !c.deleted)
        .sort((a, b) => new Date(b.lastTimestamp || 0) - new Date(a.lastTimestamp || 0))
      setConversations(list)
    })
    return unsub
  }, [user])

  useEffect(() => {
    if (!activeConv) { setMessages([]); return }
    const q = query(collection(db, "conversations", activeConv, "messages"), orderBy("timestamp", "asc"))
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [activeConv])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (!showNewDM) return
    fetch("/api/users").then(r => r.json()).then(data => {
      setUsers(data.users || [])
    })
  }, [showNewDM])

  const startConversation = async (otherUid) => {
    const participants = [user.uid, otherUid].sort()
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participants }),
    })
    const data = await res.json()
    setShowNewDM(false)
    setActiveConv(data.id)
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!input.trim() || !activeConv) return
    const text = input.trim()
    setInput("")
    await fetch(`/api/conversations/${activeConv}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        senderId: user.uid,
        senderName: user.displayName || user.email.split("@")[0],
        text,
      }),
    })
  }

  const deleteConversation = async (convId) => {
    await fetch(`/api/conversations/${convId}`, { method: "DELETE" })
    if (activeConv === convId) setActiveConv(null)
    setConfirmDelete(null)
  }

  const activeConvData = conversations.find(c => c.id === activeConv)

  const otherParticipants = (conv) => {
    const otherIds = conv.participants.filter(p => p !== user.uid)
    return otherIds.map(id => {
      const u = users.find(u => u.uid === id)
      return u?.displayName || u?.email || id.slice(0, 8)
    }).join(", ") || "Unknown"
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--c-bg)", color: "var(--c-subtle)" }}>
        Loading...
      </div>
    )
  }

  return (
    <div className="min-h-screen flex" style={{ background: "var(--c-bg)" }}>
      <div className="w-80 shrink-0 border-r flex flex-col" style={{ borderColor: "var(--c-border)", background: "var(--c-card)" }}>
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--c-border)" }}>
          <h1 className="text-base font-bold" style={{ color: "var(--c-fg)" }}>Direct Messages</h1>
          <button onClick={() => setShowNewDM(true)} className="text-lg leading-none px-2 py-1 rounded" style={{ color: "var(--c-accent)" }}>+</button>
        </div>

        {showNewDM && (
          <div className="p-3 border-b" style={{ borderColor: "var(--c-border)" }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..." className="w-full px-3 py-2 rounded-lg border text-sm mb-2" style={{ background: "var(--c-bg)", borderColor: "var(--c-border)", color: "var(--c-fg)" }} />
            <div className="max-h-60 overflow-y-auto space-y-1">
              {users
                .filter(u => u.uid !== user.uid && (!search || u.email?.includes(search) || u.displayName?.includes(search)))
                .map(u => (
                  <button key={u.uid} onClick={() => startConversation(u.uid)} className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors hover:bg-black/5" style={{ color: "var(--c-fg)" }}>
                    {u.displayName || u.email}
                  </button>
                ))}
              {users.filter(u => u.uid !== user.uid).length === 0 && (
                <p className="text-xs" style={{ color: "var(--c-subtle)" }}>Loading users...</p>
              )}
            </div>
            <button onClick={() => setShowNewDM(false)} className="text-xs mt-2" style={{ color: "var(--c-subtle)" }}>Cancel</button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 && (
            <p className="text-sm p-4 text-center" style={{ color: "var(--c-subtle)" }}>
              No conversations yet. Click + to start one.
            </p>
          )}
          {conversations.map(conv => (
            <div key={conv.id} className="group relative">
              <button
                onClick={() => setActiveConv(conv.id)}
                className="w-full text-left px-4 py-3 border-b transition-colors"
                style={{
                  borderColor: "var(--c-border)",
                  background: activeConv === conv.id ? "var(--c-bg)" : "transparent",
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium truncate" style={{ color: "var(--c-fg)" }}>{otherParticipants(conv)}</span>
                  {conv.lastTimestamp && (
                    <span className="text-[10px] shrink-0 ml-2" style={{ color: "var(--c-subtle)" }}>
                      {formatTime(conv.lastTimestamp)}
                    </span>
                  )}
                </div>
                <div className="text-xs truncate mt-0.5" style={{ color: "var(--c-subtle)" }}>{conv.lastMessage || "No messages yet"}</div>
              </button>
              {activeConv === conv.id && (
                <button
                  onClick={() => setConfirmDelete(conv.id)}
                  className="absolute top-1 right-1 text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: COLORS.RED }}
                  title="Delete conversation"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {!activeConv ? (
          <div className="flex-1 flex items-center justify-center">
            <p style={{ color: "var(--c-subtle)" }}>Select a conversation or start a new one</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-4 py-2 border-b shrink-0" style={{ background: "var(--c-card)", borderColor: "var(--c-border)" }}>
              <div className="flex items-center gap-3">
                <button onClick={() => setActiveConv(null)} className="text-sm px-2 py-1 rounded transition-colors hover:bg-black/5" style={{ color: "var(--c-muted)" }}>
                  &larr;
                </button>
                <span className="text-base font-semibold" style={{ color: "var(--c-fg)" }}>{activeConvData ? otherParticipants(activeConvData) : "..."}</span>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/dashboard" className="text-xs px-2 py-0.5 rounded" style={{ color: "var(--c-subtle)" }}>Dashboard</Link>
                <SettingsPanel />
              </div>
            </div>

            {confirmDelete === activeConv && (
              <div className="relative z-10 max-w-6xl mx-auto w-full px-4">
                <div className="rounded-xl border shadow-xl p-4 w-full max-w-sm" style={{ background: "var(--c-card)", borderColor: "var(--c-border)" }}>
                  <p className="text-sm mb-3" style={{ color: "var(--c-fg)" }}>Delete this conversation?</p>
                  <div className="flex gap-2">
                    <button onClick={() => deleteConversation(activeConv)} className="px-3 py-1.5 text-white rounded-lg text-xs font-medium" style={{ background: COLORS.RED }}>Delete</button>
                    <button onClick={() => setConfirmDelete(null)} className="px-3 py-1.5 rounded-lg text-xs" style={{ color: "var(--c-subtle)" }}>Cancel</button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto py-4 px-4 space-y-2">
              {messages.length === 0 && (
                <div className="text-center py-12" style={{ color: "var(--c-subtle)" }}>
                  <p className="text-sm">No messages yet. Start the conversation!</p>
                </div>
              )}
              {messages.map(msg => (
                <div key={msg.id} className="flex items-start gap-2 px-2 min-w-0">
                  <UserNameTag
                    email={msg.senderId}
                    name={msg.senderName}
                    userTagSize={chatSettings.userTagSize}
                  />
                  {msg.text && (
                    <span className="break-words flex-1" style={{ color: "var(--c-muted)", overflowWrap: "anywhere", wordBreak: "break-word", fontSize: chatSettings.messageTextSize + "px" }}>
                      {msg.text}
                    </span>
                  )}
                  {msg.timestamp && (
                    <span className="text-[10px] shrink-0 mt-1" style={{ color: "var(--c-subtle)" }}>
                      {formatTime(msg.timestamp)}
                    </span>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendMessage} className="flex items-center gap-2 px-4 py-3 border-t" style={{ borderColor: "var(--c-border)" }}>
              <input value={input} onChange={e => setInput(e.target.value)} placeholder="Type a message..." className="flex-1 px-4 py-2.5 rounded-xl border text-sm" style={{ background: "var(--c-card)", borderColor: "var(--c-border)", color: "var(--c-fg)" }} />
              <button type="submit" className="px-4 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-50" style={{ background: "var(--c-accent)" }} disabled={!input.trim()}>
                Send
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
