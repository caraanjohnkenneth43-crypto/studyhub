/**
 * Chat React hooks — extracted from page.js for modularity.
 * @checkTypes
 */

import { useState, useEffect, useRef, useCallback } from "react"
import { doc, getDoc, deleteDoc, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc, limit, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"

import { buildUidToEmailMap } from "@/lib/chat/gradients"
import { hasStoredPassword } from "@/lib/chat/password"

/**
 * Load room document and determine if user is verified (public or has password).
 */
export function useRoom(id) {
  const [room, setRoom] = useState(null)
  const [verified, setVerified] = useState(false)
  const [roomLoaded, setRoomLoaded] = useState(false)

  useEffect(() => {
    const ref = doc(db, "chatRooms", id)
    getDoc(ref).then(snap => {
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() }
        setRoom(data)
        if (data.type === "public") {
          setVerified(true)
        } else {
          const stored = hasStoredPassword(id)
          if (stored === data.password) setVerified(true)
        }
      }
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
      let apiUsers = []
      let fsSnap = null
      try {
        const r = await fetch("/api/users")
        const d = await r.json()
        apiUsers = d.users || []
      } catch {}
      try {
        fsSnap = await getDocs(collection(db, "users"))
      } catch {}
      setUidToEmail(buildUidToEmailMap(apiUsers, fsSnap))
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
  if (type === "text") messageData.type = "text"
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
