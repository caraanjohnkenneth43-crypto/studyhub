/**
 * Chat React hooks — extracted from page.js for modularity.
 * @checkTypes
 */

import { useState, useEffect, useRef, useCallback } from "react"
import { doc, getDoc, deleteDoc, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc, limit, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"


import { hasStoredPassword } from "@/lib/chat/password"

/**
 * Load room document and determine if user is verified (public or has password).
 * Uses the API route instead of direct Firestore to avoid leaking the password field.
 * The password field is stripped server-side; verification is done via hasPassword
 * boolean and client-side stored password comparison.
 */
export function useRoom(id) {
  const [room, setRoom] = useState(null)
  const [verified, setVerified] = useState(false)
  const [roomLoaded, setRoomLoaded] = useState(false)

  useEffect(() => {
    if (!id) return
    fetch(`/api/chat/rooms/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          setRoom(null)
          setRoomLoaded(true)
          return
        }
        setRoom(data)
        if (data.type === "public") {
          setVerified(true)
        } else {
          const stored = hasStoredPassword(id)
          if (stored) setVerified(true)
        }
        setRoomLoaded(true)
      })
      .catch(() => {
        setRoomLoaded(true)
      })
  }, [id])

  return { room, setRoom, verified, setVerified, roomLoaded }
}

/**
 * Subscribe to real-time messages for a room.
 */
export function useMessages(id, verified) {
  const [messages, setMessages] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!verified) return
    const q = query(collection(db, "chatRooms", id, "messages"), orderBy("timestamp", "asc"), limit(200))
    const unsub = onSnapshot(q, 
      snap => {
        setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        setError(null)
      },
      err => {
        console.error("Messages listener error:", err)
        setError(err.message)
      }
    )
    return unsub
  }, [id, verified])

  return { messages, error }
}

/**
 * Fetch contributors and build uid→email map.
 */
export function useUserMap() {
  const [contributors, setContributors] = useState([])
  const [uidToEmail, setUidToEmail] = useState({})

  useEffect(() => {
    fetch("/api/data").then(r => r.json()).then(d => {
      setContributors(d.contributors || [])
    }).catch(() => {})

    const load = async () => {
      try {
        const r = await fetch("/api/users?resolve=true")
        const d = await r.json()
        if (d.map) setUidToEmail(d.map)
      } catch {}
    }
    load()
  }, [])

  return { contributors, uidToEmail }
}

/**
 * Auto-scroll to bottom when new messages arrive.
 */
export function useAutoScroll(messages, bottomRef) {
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])
}

/**
 * Detect when user has scrolled up from the bottom.
 */
export function useScrollDetection(messagesRef) {
  const [showScrollBtn, setShowScrollBtn] = useState(false)

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

  return showScrollBtn
}

/**
 * Send a message to the current room. Supports text, image (base64), and sticker re-send.
 * type: "text" | "image" | "sticker"
 */
export function useSendMessage(id, user) {
  return useCallback(async (e) => {
    e.preventDefault()
    // This version expects an object: { type, content, imageUrl, stickerId }
    // We'll handle this differently in the component
    // Keeping backward compatibility with simple text for now
  }, [id, user])
}

export function sendMessageHelper(id, user, { type, content, imageUrl, stickerId }) {
  if (type === "text" && !content?.trim()) return
  const displayName = user.displayName || user.email.split("@")[0]
  const messageData = {
    userId: user.uid,
    userName: displayName,
    userEmail: user.email,
    timestamp: serverTimestamp(),
  }
  if (type === "text") {
    messageData.type = "text"
    messageData.text = content
  }
  if (type === "image") {
    messageData.type = "image"
    messageData.text = content || ""
    messageData.imageUrl = imageUrl
  }
  if (type === "sticker") {
    messageData.type = "sticker"
    messageData.text = content || ""
    messageData.imageUrl = imageUrl
    messageData.stickerId = stickerId
  }
  return addDoc(collection(db, "chatRooms", id, "messages"), messageData)
}

/**
 * Send a text message.
 */
export function useSendTextMessage(id, user, text, setText) {
  return useCallback(async (e) => {
    e.preventDefault()
    if (!text.trim()) return
    try {
      await sendMessageHelper(id, user, { type: "text", content: text.trim() })
      setText("")
    } catch (err) {
      console.error("Failed to send message:", err)
      alert("Failed to send message: " + err.message)
    }
  }, [id, user, text, setText])
}

/**
 * Send an image message.
 */
export function useSendImageMessage(id, user) {
  return useCallback(async (imageUrl, content = "") => {
    try {
      await sendMessageHelper(id, user, { type: "image", content, imageUrl })
    } catch (err) {
      console.error("Failed to send image:", err)
      alert("Failed to send image: " + err.message)
    }
  }, [id, user])
}

/**
 * Send a sticker message.
 */
export function useSendStickerMessage(id, user) {
  return useCallback(async (imageUrl, stickerId, content = "") => {
    try {
      await sendMessageHelper(id, user, { type: "sticker", content, imageUrl, stickerId })
    } catch (err) {
      console.error("Failed to send sticker:", err)
      alert("Failed to send sticker: " + err.message)
    }
  }, [id, user])
}

/**
 * Delete a room document.
 */
export function useDeleteRoom(id, router) {
  return useCallback(async () => {
    await deleteDoc(doc(db, "chatRooms", id))
    router.push("/chat")
  }, [id, router])
}

/**
 * Block/unblock users.
 */
export function useBlockUser(room, setRoom) {
  const blockUser = useCallback(async (email) => {
    if (!email.trim()) return
    await updateDoc(doc(db, "chatRooms", room.id), {
      blocked: [...(room.blocked || []), email.trim()],
    })
    setRoom(prev => ({ ...prev, blocked: [...(prev.blocked || []), email.trim()] }))
  }, [room, setRoom])

  const unblockUser = useCallback(async (email) => {
    await updateDoc(doc(db, "chatRooms", room.id), {
      blocked: (room.blocked || []).filter(e => e !== email),
    })
    setRoom(prev => ({ ...prev, blocked: (prev.blocked || []).filter(e => e !== email) }))
  }, [room, setRoom])

  return { blockUser, unblockUser }
}

/**
 * Fetch stickers (images) from user's messages for the sticker panel.
 */
export function useStickers(userId) {
  const [stickers, setStickers] = useState([])

  useEffect(() => {
    if (!userId) return
    const q = query(
      collection(db, "chatRooms"),
      // We need to search across all rooms - this is a simplification
      // In practice, you'd query a dedicated stickers collection or scan rooms
    )
    // For now, we'll fetch from localStorage or a user-specific stickers collection
    const stored = localStorage.getItem("studyhub-stickers")
    if (stored) {
      try {
        setStickers(JSON.parse(stored))
      } catch {}
    }
  }, [userId])

  const addSticker = useCallback((imageUrl) => {
    const newSticker = { id: Date.now().toString(), imageUrl, createdAt: new Date().toISOString() }
    const updated = [newSticker, ...stickers].slice(0, 50)
    setStickers(updated)
    localStorage.setItem("studyhub-stickers", JSON.stringify(updated))
  }, [stickers])

  return { stickers, addSticker }
}

/**
 * Fetch room members with presence status.
 * For public rooms: all authenticated users who have sent messages or are in presence.
 * For private rooms: users with password (minus blocked) from messages + presence.
 * @param {object} uidToEmail - Optional map of uid→email to resolve emails for messages that lack userEmail.
 */
export function useRoomMembers(roomId, room, verified, uidToEmail = {}) {
  const [members, setMembers] = useState([])

  useEffect(() => {
    if (!verified || !room) return
    
    // Get users who have sent messages in this room
    const messagesQuery = query(
      collection(db, "chatRooms", roomId, "messages"),
      orderBy("timestamp", "desc"),
      limit(500)
    )
    
    // Get presence data for all users
    const presenceQuery = query(collection(db, "presence"))
    
    let messagesUnsub = null
    let presenceUnsub = null
    let messageUsers = new Map()
    let presenceData = new Map()
    
    // Subscribe to room messages to find participating users
    messagesUnsub = onSnapshot(messagesQuery, snap => {
      const users = new Map()
      snap.docs.forEach(d => {
        const data = d.data()
        if (data.userId) {
          const existing = users.get(data.userId)
          if (!existing || (data.timestamp && data.timestamp.seconds > existing.lastMessageTime)) {
            const email = data.userEmail || uidToEmail[data.userId] || ""
            users.set(data.userId, {
              uid: data.userId,
              email,
              displayName: data.userName || email.split("@")[0] || "Unknown",
              lastMessageTime: data.timestamp ? data.timestamp.seconds * 1000 : 0,
            })
          }
        }
      })
      messageUsers = users
      updateMembers()
    })
    
    // Subscribe to presence
    // Presence docs use doc ID = uid, with { lastActive: Timestamp }
    presenceUnsub = onSnapshot(presenceQuery, snap => {
      const presence = new Map()
      const now = Date.now()
      snap.docs.forEach(d => {
        const data = d.data()
        const lastActive = data.lastActive
        if (lastActive) {
          const lastActiveMs = typeof lastActive.toMillis === "function" ? lastActive.toMillis() : now
          const isActive = (now - lastActiveMs) < 5 * 60 * 1000
          presence.set(d.id, {
            isActive,
            lastSeen: lastActiveMs,
            displayName: data.displayName || data.email?.split("@")[0] || "Unknown",
            email: data.email || "",
          })
        }
      })
      presenceData = presence
      updateMembers()
    })
    
    const updateMembers = () => {
      const allUserIds = new Set([...messageUsers.keys(), ...presenceData.keys()])
      const memberList = []
      const now = Date.now()
      
      for (const uid of allUserIds) {
        const msgData = messageUsers.get(uid)
        const presData = presenceData.get(uid)
        
        // Skip if blocked
        if (room.blocked?.includes(msgData?.email) || room.blocked?.includes(presData?.email)) {
          continue
        }
        
        const email = msgData?.email || presData?.email || ""
        const displayName = msgData?.displayName || presData?.displayName || (email ? email.split("@")[0] : "User")
        const lastMessageTime = msgData?.lastMessageTime || 0
        const presenceTime = presData?.lastSeen || 0
        const lastActive = Math.max(lastMessageTime, presenceTime)
        
        let status = "offline"
        if (lastActive > 0 && (now - lastActive) < 5 * 60 * 1000) {
          status = "active"
        } else if (lastActive > 0 && (now - lastActive) < 30 * 60 * 1000) {
          status = "idle"
        }
        
        memberList.push({
          uid,
          email,
          displayName,
          status,
          lastActive,
        })
      }
      
      memberList.sort((a, b) => {
        const statusOrder = { active: 0, idle: 1, offline: 2 }
        if (statusOrder[a.status] !== statusOrder[b.status]) {
          return statusOrder[a.status] - statusOrder[b.status]
        }
        return b.lastActive - a.lastActive
      })
      
      setMembers(memberList)
    }
    
    return () => {
      messagesUnsub?.()
      presenceUnsub?.()
    }
  }, [roomId, room, verified, uidToEmail])
  
  return members
}
