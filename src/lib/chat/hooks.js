/**
 * Chat React hooks — extracted from page.js for modularity.
 * @checkTypes
 */

import { useState, useEffect, useRef, useCallback } from "react"
import { doc, getDoc, deleteDoc, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc, limit, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { containsProfanity, censorMessage } from "@/lib/profanity"
import { buildUidToEmailMap } from "@/lib/chat/gradients"

/**
 * Load room document.
 */
export function useRoom(id) {
  const [room, setRoom] = useState(null)
  const [roomLoaded, setRoomLoaded] = useState(false)

  useEffect(() => {
    const ref = doc(db, "chatRooms", id)
    getDoc(ref).then(snap => {
      if (snap.exists()) setRoom({ id: snap.id, ...snap.data() })
      setRoomLoaded(true)
    })
  }, [id])

  return { room, setRoom, verified: true, roomLoaded }
}

/**
 * Subscribe to real-time messages for a room, deleting profane ones.
 */
export function useMessages(id, verified) {
  const [messages, setMessages] = useState([])

  useEffect(() => {
    if (!verified) return
    const q = query(collection(db, "chatRooms", id, "messages"), orderBy("timestamp", "asc"), limit(200))
    const unsub = onSnapshot(q, snap => {
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

  return messages
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
 * Send a message to the current room.
 */
export function useSendMessage(id, user, text, setText) {
  return useCallback(async (e) => {
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
  }, [id, user, text, setText])
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
