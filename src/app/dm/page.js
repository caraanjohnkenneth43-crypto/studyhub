"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "../AuthProvider"

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
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (!loading && !user) router.push("/login")
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return
    const fetch = async () => {
      const res = await fetch(`/api/conversations?uid=${user.uid}`)
      const data = await res.json()
      setConversations(data.conversations || [])
    }
    fetch()
    const interval = setInterval(fetch, 5000)
    return () => clearInterval(interval)
  }, [user])

  useEffect(() => {
    if (!activeConv) return
    const fetch = async () => {
      const res = await fetch(`/api/conversations/${activeConv}/messages`)
      const data = await res.json()
      setMessages(data.messages || [])
    }
    fetch()
    const interval = setInterval(fetch, 3000)
    return () => clearInterval(interval)
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
    setConversations(prev => {
      if (prev.find(c => c.id === data.id)) return prev
      return [data, ...prev]
    })
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!input.trim() || !activeConv) return
    const res = await fetch(`/api/conversations/${activeConv}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        senderId: user.uid,
        senderName: user.displayName || user.email.split("@")[0],
        text: input.trim(),
      }),
    })
    const msg = await res.json()
    setMessages(prev => [...prev, msg])
    setConversations(prev => prev.map(c =>
      c.id === activeConv ? { ...c, lastMessage: input.trim(), lastTimestamp: msg.timestamp } : c
    ))
    setInput("")
  }

  const getOtherName = (conv) => {
    const otherId = conv.participants.find(p => p !== user.uid)
    const otherUser = users.find(u => u.uid === otherId)
    return otherUser?.displayName || otherUser?.email || otherId?.slice(0, 8) || "Unknown"
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
            <button
              key={conv.id}
              onClick={() => setActiveConv(conv.id)}
              className="w-full text-left px-4 py-3 border-b transition-colors"
              style={{
                borderColor: "var(--c-border)",
                background: activeConv === conv.id ? "var(--c-bg)" : "transparent",
              }}
            >
              <div className="text-sm font-medium truncate" style={{ color: "var(--c-fg)" }}>{getOtherName(conv)}</div>
              <div className="text-xs truncate mt-0.5" style={{ color: "var(--c-subtle)" }}>{conv.lastMessage || "No messages yet"}</div>
            </button>
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
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map(msg => {
                const isOwn = msg.senderId === user.uid
                return (
                  <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-md px-4 py-2.5 rounded-2xl text-sm ${isOwn ? "rounded-br-md" : "rounded-bl-md"}`} style={{
                      background: isOwn ? "var(--c-accent)" : "var(--c-card)",
                      color: isOwn ? "#fff" : "var(--c-fg)",
                    }}>
                      {!isOwn && <div className="text-xs font-medium mb-1" style={{ color: "var(--c-subtle)" }}>{msg.senderName}</div>}
                      <div>{msg.text}</div>
                    </div>
                  </div>
                )
              })}
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
