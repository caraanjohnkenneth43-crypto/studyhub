"use client"

import { createContext, useContext, useState, useEffect, useRef } from "react"
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "./AuthProvider"

const NotifContext = createContext(null)

const LS_KEY = "studyhub-notif-timestamps"

export function useActiveRoom() {
  const ctx = useContext(NotifContext)
  return ctx || { activeRoom: null, setActiveRoom: () => {} }
}

function loadTimestamps() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "{}")
  } catch {
    return {}
  }
}

function saveTimestamps(timestamps) {
  localStorage.setItem(LS_KEY, JSON.stringify(timestamps))
}

export function ChatNotificationProvider({ children }) {
  const { user } = useAuth()
  const [activeRoom, setActiveRoom] = useState(null)
  const activeRoomRef = useRef(null)
  const timestampsRef = useRef(loadTimestamps())
  const userEmailRef = useRef(null)

  useEffect(() => { activeRoomRef.current = activeRoom }, [activeRoom])

  const playSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.setValueAtTime(660, ctx.currentTime)
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1)
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.3)
    } catch {}
  }

  const showPopup = (roomName, userName, text) => {
    if (!("Notification" in window)) return
    if (Notification.permission === "granted") {
      new Notification(`#${roomName}`, { body: `${userName}: ${text}`, icon: "/icons/192.svg" })
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission()
    }
  }

  useEffect(() => {
    const ls = localStorage.getItem("studyhub-settings")
    if (ls) {
      try {
        const parsed = JSON.parse(ls)
        userEmailRef.current = parsed._userEmail
      } catch {}
    }
  }, [])

  useEffect(() => {
    if (!user) return
    const msgUnsubs = {}

    const roomsQuery = query(collection(db, "chatRooms"))
    const unsubRooms = onSnapshot(roomsQuery, roomsSnap => {
      const storedPasswords = JSON.parse(localStorage.getItem("chat-passwords") || "{}")
      const accessibleRoomIds = new Set(roomsSnap.docs.filter(d => {
        if (d.data().type === "public") return true
        return d.data().type === "private" && storedPasswords[d.id]
      }).map(d => d.id))

      Object.keys(msgUnsubs).forEach(id => {
        if (!accessibleRoomIds.has(id)) {
          msgUnsubs[id]()
          delete msgUnsubs[id]
        }
      })

      accessibleRoomIds.forEach(roomId => {
        if (msgUnsubs[roomId]) return
        const roomDoc = roomsSnap.docs.find(d => d.id === roomId)
        const roomName = roomDoc?.data()?.name || roomId
        const msgQuery = query(
          collection(db, "chatRooms", roomId, "messages"),
          orderBy("timestamp", "desc"),
          limit(1)
        )
        msgUnsubs[roomId] = onSnapshot(msgQuery, msgSnap => {
          if (msgSnap.empty) return

          const settingsRaw = localStorage.getItem("studyhub-settings")
          if (!settingsRaw) return
          let settings
          try { settings = JSON.parse(settingsRaw) } catch { return }
          const notif = settings.notifications || { enabled: false, sound: true, popup: true, rooms: [] }
          if (!notif.enabled) return

          const msg = msgSnap.docs[0].data()
          if (!msg.timestamp) return
          const msgTime = msg.timestamp.seconds || (msg.timestamp.toMillis ? Math.floor(msg.timestamp.toMillis() / 1000) : 0)
          if (!msgTime) return

          if (activeRoomRef.current === roomId) return
          if (notif.rooms && notif.rooms.length > 0 && !notif.rooms.includes(roomId)) return

          const lastSeen = timestampsRef.current[roomId] || 0
          if (msgTime <= lastSeen) return

          timestampsRef.current[roomId] = msgTime
          saveTimestamps(timestampsRef.current)

          if (notif.sound) playSound()
          if (notif.popup) showPopup(roomName, msg.userName || "Someone", msg.text || "")
        })
      })
    })

    return () => {
      unsubRooms()
      Object.values(msgUnsubs).forEach(u => u())
    }
  }, [user, activeRoom])

  return (
    <NotifContext.Provider value={{ activeRoom, setActiveRoom }}>
      {children}
    </NotifContext.Provider>
  )
}
