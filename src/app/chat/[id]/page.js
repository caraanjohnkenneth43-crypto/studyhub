"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth, allowedAdmins } from "@/app/AuthProvider"
import SettingsPanel from "@/app/SettingsPanel"
import { useActiveRoom } from "@/app/ChatNotificationProvider"
import { COLORS } from "@/lib/constants"
import Navbar from "@/app/Navbar"
import { useRoom, useMessages, useUserMap, useAutoScroll, useScrollDetection, useSendTextMessage, useSendImageMessage, useSendStickerMessage, useStickers, useRoomMembers, useDeleteRoom, useBlockUser } from "@/lib/chat/hooks"
import { resolveMessageEmail, getMessageNameStyle } from "@/lib/chat/gradients"
import { UserNameTag } from "@/app/UserTag"
import { savePassword } from "@/lib/chat/password"
import { isBlocked } from "@/lib/chat/moderation"

const EMOJIS = [
  "😀","😃","😄","😁","😆","😅","😂","🤣","😊","😇",
  "🙂","🙃","😉","😌","😍","🥰","😘","😗","😙","😚",
  "😋","😛","😜","🤪","😝","🤑","🤗","🤭","🤫","🤔",
  "🤐","🤨","😐","😑","😶","😏","😒","🙄","😬","🤥",
  "😌","😔","😪","🤤","😴","😷","🤒","🤕","🤢","🤮",
  "🤧","😇","🤠","🤡","🤥","🤔","🤭","🤫","🤐","😑",
  "❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔",
  "👍","👎","👌","✌️","🤞","🤟","🤘","🤙","👈","👉",
  "👆","🖕","👇","☝️","👏","🙌","👐","🤲","🤝","🙏",
  "🎉","🎊","🎈","🎁","🎂","🎄","🎃","🎅","🎆","🎇",
  "✨","🌟","⭐","💫","🌈","☀️","⛅","🌤️","🌥️","🌦️",
  "🌧️","🌨️","❄️","☃️","🌙","🌚","🌝","🌞","🪐","⭐",
  "🍎","🍌","🍕","🍔","🍦","🍪","☕","🍻","🍹","🥤",
  "🎮","🎲","🎸","🎺","🎻","🥁","🎤","🎧","🎬","🏀",
  "⚽","🏈","⚾","🎾","🏐","🏓","🏸","🥅","⛳","🏹",
  "🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯",
  "🦁","🐮","🐷","🐸","🐵","🐣","🐧","🐦","🐤","🦆"
]

const EMOJI_CATEGORIES = [
  { name: "Smileys", emojis: EMOJIS.slice(0, 40) },
  { name: "Hearts", emojis: EMOJIS.slice(40, 50) },
  { name: "Gestures", emojis: EMOJIS.slice(50, 60) },
  { name: "Celebration", emojis: EMOJIS.slice(60, 70) },
  { name: "Stars/Weather", emojis: EMOJIS.slice(70, 90) },
  { name: "Food", emojis: EMOJIS.slice(90, 100) },
  { name: "Activities", emojis: EMOJIS.slice(100, 110) },
  { name: "Animals", emojis: EMOJIS.slice(110, 120) },
]

const AVATAR_COLORS = [
  "#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6",
  "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1",
]

function getAvatarColor(email) {
  if (!email) return AVATAR_COLORS[0]
  let hash = 0
  for (let i = 0; i < email.length; i++) hash = email.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function formatLastActive(ts) {
  const diff = Date.now() - ts
  if (diff < 60000) return "Just now"
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return `${Math.floor(diff / 86400000)}d ago`
}

export default function ChatRoom() {
  const { id } = useParams()
  const { user, loading, logOut } = useAuth()
  const router = useRouter()
  const [text, setText] = useState("")
  const [password, setPassword] = useState("")
  const [passwordError, setPasswordError] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showBlockPanel, setShowBlockPanel] = useState(false)
  const [blockEmail, setBlockEmail] = useState("")
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showStickerPanel, setShowStickerPanel] = useState(false)
  const [showMembersPanel, setShowMembersPanel] = useState(false)
  const [imagePreview, setImagePreview] = useState(null)
  const [activeEmojiCategory, setActiveEmojiCategory] = useState(0)
  const bottomRef = useRef(null)
  const messagesRef = useRef(null)
  const emojiPickerRef = useRef(null)
  const { setActiveRoom } = useActiveRoom()

  const { room, setRoom, verified, setVerified, roomLoaded } = useRoom(id)
  const { messages, error: messagesError } = useMessages(id, verified)
  const { contributors, uidToEmail } = useUserMap()
  const { stickers, addSticker } = useStickers(user?.uid)
  const members = useRoomMembers(id, room, verified)
  useAutoScroll(messages, bottomRef)
  const showScrollBtn = useScrollDetection(messagesRef)
  const sendText = useSendTextMessage(id, user, text, setText)
  const sendImage = useSendImageMessage(id, user)
  const sendSticker = useSendStickerMessage(id, user)
  const deleteRoom = useDeleteRoom(id, router)
  const { blockUser, unblockUser } = useBlockUser(room, setRoom)

  useEffect(() => {
    if (!loading && !user) router.push("/login")
  }, [user, loading, router])

  useEffect(() => {
    setActiveRoom?.(verified ? id : null)
    return () => setActiveRoom?.(null)
  }, [verified, id, setActiveRoom])

  const checkPassword = () => {
    if (password === room.password) {
      setVerified(true)
      setPasswordError(false)
      savePassword(id, password)
    } else {
      setPasswordError(true)
    }
  }

  const handleImageUpload = async (file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const base64 = e.target.result
      setImagePreview(base64)
      sendImage(base64, "")
      addSticker(base64)
    }
    reader.readAsDataURL(file)
  }

  const handleEmojiClick = (emoji) => {
    setText(prev => prev + emoji)
    setShowEmojiPicker(false)
  }

  const handleStickerClick = (sticker) => {
    sendSticker(sticker.imageUrl, sticker.id, "")
    setShowStickerPanel(false)
  }

  const removeImagePreview = () => {
    setImagePreview(null)
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: "var(--c-bg)", color: "var(--c-subtle)" }}>
        Loading...
      </div>
    )
  }

  if (roomLoaded && !room) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: "var(--c-bg)", color: "var(--c-subtle)" }}>
        <p className="text-lg">Room not found.</p>
        <Link href="/chat" className="text-sm underline mt-2" style={{ color: "var(--c-link)" }}>Back to chat</Link>
      </div>
    )
  }

  if (isBlocked(room, user.email)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: "var(--c-bg)", color: "var(--c-subtle)" }}>
        <div className="rounded-xl border shadow-xl p-6 w-full max-w-sm mx-4 text-center" style={{ background: "var(--c-card)", borderColor: "var(--c-border)" }}>
          <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--c-fg)" }}>🔒 Access Revoked</h2>
          <p className="text-sm mb-4" style={{ color: "var(--c-muted)" }}>You&apos;ve been removed from this room by the owner.</p>
          <Link href="/chat" className="text-sm underline" style={{ color: "var(--c-link)" }}>Back to chat</Link>
        </div>
      </div>
    )
  }

  if (room && room.type === "private" && !verified) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: "var(--c-bg)", color: "var(--c-subtle)" }}>
        <div className="rounded-xl border shadow-xl p-6 w-full max-w-sm mx-4" style={{ background: "var(--c-card)", borderColor: "var(--c-border)" }}>
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-semibold" style={{ color: "var(--c-fg)" }}>🔒 Private Room</h2>
            <button onClick={() => router.back()} className="text-sm px-2 py-1 rounded hover:bg-black/5" style={{ color: "var(--c-muted)" }}>&larr; Back</button>
          </div>
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
            style={{ background: "var(--c-bg)", borderColor: passwordError ? COLORS.RED : "var(--c-border)", color: "var(--c-fg)" }}
          />
          {passwordError && <p className="text-xs mb-2" style={{ color: COLORS.RED }}>Incorrect password.</p>}
          <button onClick={checkPassword} disabled={!password.trim()} className="w-full py-2 text-white rounded-lg text-sm font-medium disabled:opacity-50" style={{ background: "var(--c-accent)" }}>Join Room</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--c-bg)" }}>
      <Navbar
        room={room}
        onBack={() => router.back()}
        onMembersToggle={() => setShowMembersPanel(!showMembersPanel)}
        showMembersPanel={showMembersPanel}
        membersCount={members.length}
      />

      {messagesError && (
        <div className="max-w-6xl mx-auto px-4 py-1">
          <span className="text-xs px-2 py-0.5 rounded" style={{ background: "#ef4444", color: "white" }}>
            Sync error: {messagesError}
          </span>
        </div>
      )}

      {showBlockPanel && room && room.createdBy === user.uid && (
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
                    <button onClick={() => unblockUser(email)} className="text-xs shrink-0" style={{ color: "var(--c-link)" }}>Unblock</button>
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
              <button onClick={() => { blockUser(blockEmail); setBlockEmail("") }} disabled={!blockEmail.trim()} className="px-2 py-1 text-white rounded text-xs font-medium disabled:opacity-50" style={{ background: COLORS.RED }}>Block</button>
            </div>
          </div>
        </div>
      )}

      {showMembersPanel && room && verified && (
        <div className="relative z-10 max-w-6xl mx-auto w-full px-4">
          <div className="rounded-xl border shadow-xl p-4 w-full max-w-sm" style={{ background: "var(--c-card)", borderColor: "var(--c-border)" }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold" style={{ color: "var(--c-fg)" }}>Room Members ({members.length})</h3>
              <button onClick={() => setShowMembersPanel(false)} className="text-xs px-2 py-1 rounded hover:bg-black/5" style={{ color: "var(--c-subtle)" }}>Close</button>
            </div>
            {members.length === 0 ? (
              <p className="text-xs text-center py-4" style={{ color: "var(--c-subtle)" }}>No members yet.</p>
            ) : (
              <div className="space-y-1.5 max-h-80 overflow-y-auto">
                {members.map(member => (
                  <div key={member.uid} className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-black/5 transition-colors">
                    <div className="relative w-8 h-8 shrink-0">
                      <div className="w-full h-full rounded-full flex items-center justify-center text-xs font-medium text-white" style={{ background: getAvatarColor(member.email) }}>
                        {member.displayName.charAt(0).toUpperCase()}
                      </div>
                      <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[var(--c-card)]
                        ${member.status === "active" ? "bg-green-500" : member.status === "idle" ? "bg-yellow-500" : "bg-gray-500"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-sm font-medium truncate" style={{ color: "var(--c-fg)" }}>{member.displayName}</span>
                        {member.uid === user.uid && <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "var(--c-accent)", color: "white" }}>You</span>}
                      </div>
                      <div className="text-[10px] truncate" style={{ color: "var(--c-subtle)" }}>
                        {member.email}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <span className={`w-2 h-2 rounded-full ${member.status === "active" ? "bg-green-500" : member.status === "idle" ? "bg-yellow-500" : "bg-gray-500"}`} />
                      </div>
                      <div className="text-[10px] mt-0.5" style={{ color: "var(--c-subtle)" }}>
                        {member.lastActive ? formatLastActive(member.lastActive) : "Never"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
          {messages.map(msg => {
            const email = resolveMessageEmail(msg, uidToEmail)
            const isOwn = msg.userId === user.uid
            return (
            <div key={msg.id} className="flex items-start gap-2 px-2 min-w-0">
              <UserNameTag
                email={email}
                name={msg.userName}
                admins={allowedAdmins}
                contributors={contributors}
              />
              {(msg.type === "image" || msg.type === "sticker") && msg.imageUrl && (
                <img
                  src={msg.imageUrl}
                  alt={msg.type === "sticker" ? "sticker" : "image"}
                  className="max-w-xs rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                  style={{ maxHeight: "300px", objectFit: "contain" }}
                />
              )}
              {msg.text && (
                <span className="text-xs break-words flex-1" style={{ color: "var(--c-muted)", overflowWrap: "anywhere", wordBreak: "break-word" }}>{msg.text}</span>
              )}
              {msg.timestamp && (
                <span className="text-[10px] shrink-0 mt-1" style={{ color: "var(--c-subtle)" }}>
                  {new Date(msg.timestamp.seconds * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
            </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        {showScrollBtn && (
          <button
            onClick={() => messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: "smooth" })}
            className="absolute bottom-28 right-6 w-10 h-10 rounded-full shadow-lg flex items-center justify-center text-white text-lg"
            style={{ background: "var(--c-accent)" }}
          >
            ↓
          </button>
        )}

        {/* Panels overlay */}
        <div className="absolute bottom-16 left-2 right-2 sm:right-4 max-w-4xl mx-auto flex justify-between items-end gap-2">
          {/* Emoji Picker */}
          {showEmojiPicker && (
            <div
              ref={emojiPickerRef}
              className="absolute bottom-12 left-0 w-64 sm:w-80 max-h-64 overflow-y-auto rounded-xl border shadow-xl p-3"
              style={{ background: "var(--c-card)", borderColor: "var(--c-border)" }}
            >
              <div className="flex items-center gap-1 mb-2 border-b pb-2" style={{ borderColor: "var(--c-border)" }}>
                {EMOJI_CATEGORIES.map((cat, i) => (
                  <button
                    key={cat.name}
                    onClick={() => setActiveEmojiCategory(i)}
                    className={`text-xs px-2 py-1 rounded transition-colors ${i === activeEmojiCategory ? "font-semibold" : ""}`}
                    style={{
                      background: i === activeEmojiCategory ? "var(--c-accent)" : "transparent",
                      color: i === activeEmojiCategory ? "white" : "var(--c-fg)",
                      borderColor: "var(--c-border)",
                    }}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-8 gap-1">
                {EMOJI_CATEGORIES[activeEmojiCategory].emojis.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => handleEmojiClick(emoji)}
                    className="text-xl py-1 hover:scale-125 transition-transform"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sticker Panel */}
          {showStickerPanel && (
            <div className="absolute bottom-12 right-0 w-64 max-h-64 overflow-y-auto rounded-xl border shadow-xl p-3" style={{ background: "var(--c-card)", borderColor: "var(--c-border)" }}>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold" style={{ color: "var(--c-fg)" }}>Stickers</h4>
              </div>
              {stickers.length === 0 ? (
                <p className="text-xs text-center py-4" style={{ color: "var(--c-subtle)" }}>No stickers yet. Send an image to save it!</p>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {stickers.map(sticker => (
                    <button
                      key={sticker.id}
                      onClick={() => handleStickerClick(sticker)}
                      className="aspect-square rounded-lg overflow-hidden hover:scale-105 transition-transform border"
                      style={{ borderColor: "var(--c-border)" }}
                    >
                      <img src={sticker.imageUrl} alt="sticker" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Image Preview */}
          {imagePreview && (
            <div className="absolute bottom-12 left-0 right-0 sm:left-0 sm:right-4 sm:w-auto max-w-4xl mx-auto flex justify-center">
              <div className="relative rounded-xl overflow-hidden border shadow-xl" style={{ borderColor: "var(--c-border)" }}>
                <img src={imagePreview} alt="preview" className="max-w-xs max-h-64 rounded-lg" />
                <button
                  onClick={removeImagePreview}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center text-white text-sm"
                  style={{ background: "rgba(0,0,0,0.7)" }}
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={sendText} className="pb-4 pt-2 relative">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="px-3 py-2 rounded-lg text-lg hover:bg-black/5 transition-colors shrink-0"
              style={{ color: "var(--c-fg)" }}
            >
              😀
            </button>
            <button
              type="button"
              onClick={() => setShowStickerPanel(!showStickerPanel)}
              className="px-3 py-2 rounded-lg text-lg hover:bg-black/5 transition-colors shrink-0"
              style={{ color: "var(--c-fg)" }}
            >
              🎨
            </button>
            <input
              type="file"
              accept="image/*"
              onChange={e => e.target.files[0] && handleImageUpload(e.target.files[0])}
              className="hidden"
              id="image-upload"
            />
            <label
              htmlFor="image-upload"
              className="px-3 py-2 rounded-lg text-lg hover:bg-black/5 transition-colors shrink-0 cursor-pointer"
              style={{ color: "var(--c-fg)" }}
            >
              📷
            </label>
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
              className="px-4 py-2 text-white rounded-lg text-sm font-medium disabled:opacity-50 shrink-0"
              style={{ background: "var(--c-accent)" }}
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}