"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "./AuthProvider"
import { updateProfile } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { collection, query, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"

const SETTINGS_KEY = "studyhub-settings"

const defaults = {
  dark: false,
  fontSize: 16,
  theme: "blue",
}

const THEMES = [
  { id: "blue", label: "Blue", color: "#2563eb" },
  { id: "green", label: "Green", color: "#16a34a" },
  { id: "purple", label: "Purple", color: "#7c3aed" },
  { id: "orange", label: "Orange", color: "#ea580c" },
  { id: "pink", label: "Pink", color: "#db2777" },
  { id: "teal", label: "Teal", color: "#0d9488" },
]

const legacyFontMap = { small: 14, medium: 16, large: 18 }

function load() {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY)
    const parsed = saved ? { ...defaults, ...JSON.parse(saved) } : defaults
    if (typeof parsed.fontSize === "string") {
      parsed.fontSize = legacyFontMap[parsed.fontSize] || 16
    }
    delete parsed.density
    return parsed
  } catch {
    return defaults
  }
}

function apply(settings) {
  const root = document.documentElement
  root.classList.toggle("dark", settings.dark)
  root.style.fontSize = settings.fontSize + "px"
  root.setAttribute("data-theme", settings.theme || "blue")
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

export { defaults as settingsDefaults, load as loadSettings, apply as applySettings }

function playNotificationSound() {
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

function showNotification(title, body) {
  if (!("Notification" in window)) return
  if (Notification.permission === "granted") {
    new Notification(title, { body, icon: "/icons/192.svg" })
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then(p => {
      if (p === "granted") new Notification(title, { body, icon: "/icons/192.svg" })
    })
  }
}

function formatDuration(seconds) {
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const parts = []
  if (d > 0) parts.push(d + "d")
  if (h > 0) parts.push(h + "h")
  if (m > 0) parts.push(m + "m")
  return parts.join(" ") || "<1m"
}

export function SettingsContent({ settings, onUpdate, user }) {
  const [now, setNow] = useState(new Date())
  const [rooms, setRooms] = useState([])
  const [accountAge, setAccountAge] = useState("Unknown")
  const [displayName, setDisplayName] = useState(user?.displayName || "")
  const [displayNameSaving, setDisplayNameSaving] = useState(false)
  const notifSettings = settings.notifications || { enabled: false, sound: true, popup: true, rooms: [] }

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!user?.metadata?.creationTime) return
    const id = setInterval(() => {
      setAccountAge(formatDuration((Date.now() - new Date(user.metadata.creationTime).getTime()) / 1000))
    }, 1000)
    return () => clearInterval(id)
  }, [user?.metadata?.creationTime])

  useEffect(() => {
    const q = query(collection(db, "chatRooms"))
    const unsub = onSnapshot(q, snap => {
      const storedPasswords = JSON.parse(localStorage.getItem("chat-passwords") || "{}")
      setRooms(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(r => {
        if (r.type === "public") return true
        return r.type === "private" && storedPasswords[r.id]
      }))
    })
    return unsub
  }, [])

  const updateNotif = (key, value) => {
    onUpdate("notifications", { ...notifSettings, [key]: value })
  }

  const toggleRoom = (roomId) => {
    const current = notifSettings.rooms || []
    const next = current.includes(roomId) ? current.filter(id => id !== roomId) : [...current, roomId]
    updateNotif("rooms", next)
  }

  const today = now.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })
  const time = now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" })

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--c-muted)" }}>
        Preferences
      </h3>

      <label className="flex items-center justify-between text-sm">
        <span style={{ color: "var(--c-fg)" }}>Dark Mode</span>
        <button onClick={() => onUpdate("dark", !settings.dark)} className="text-base">
          {settings.dark ? "☀️" : "🌙"}
        </button>
      </label>

      <div>
        <span className="text-sm block mb-1" style={{ color: "var(--c-fg)" }}>Font Size — {settings.fontSize}px</span>
        <input
          type="range"
          min="12"
          max="24"
          step="1"
          value={settings.fontSize}
          onChange={e => onUpdate("fontSize", Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div>
        <span className="text-sm block mb-1" style={{ color: "var(--c-fg)" }}>Theme</span>
        <div className="flex gap-2 flex-wrap">
          {THEMES.map(t => (
            <button key={t.id} onClick={() => onUpdate("theme", t.id)}
              className="w-6 h-6 rounded-full border-2 transition-transform"
              style={{
                background: t.color,
                borderColor: settings.theme === t.id ? "var(--c-fg)" : "transparent",
                transform: settings.theme === t.id ? "scale(1.2)" : "scale(1)",
              }}
              title={t.label}
            />
          ))}
        </div>
      </div>

      <hr className="border-t" style={{ borderColor: "var(--c-border)" }} />

      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--c-muted)" }}>
          Account Status
        </h4>
        <div className="space-y-1 text-sm" style={{ color: "var(--c-muted)" }}>
          <div className="flex items-center gap-2">
            <span className="font-medium shrink-0" style={{ color: "var(--c-fg)" }}>Name:</span>
            <input value={displayName} onChange={e => setDisplayName(e.target.value)}
              className="flex-1 px-2 py-0.5 rounded text-sm border min-w-0"
              style={{ background: "var(--c-bg)", borderColor: "var(--c-border)", color: "var(--c-fg)" }}
            />
            <button onClick={async () => {
              if (!displayName.trim() || displayNameSaving) return
              setDisplayNameSaving(true)
              try {
                await updateProfile(auth.currentUser, { displayName: displayName.trim() })
                await fetch("/api/users", {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ uid: user.uid, displayName: displayName.trim() }),
                })
              } catch {}
              setDisplayNameSaving(false)
            }} disabled={displayNameSaving || !displayName.trim()}
              className="text-xs px-2 py-0.5 rounded text-white font-medium disabled:opacity-50 shrink-0"
              style={{ background: "var(--c-accent)" }}>
              {displayNameSaving ? "..." : "Save"}
            </button>
          </div>
          <p><span className="font-medium" style={{ color: "var(--c-fg)" }}>Email:</span> {user?.email || "—"}</p>
          <p><span className="font-medium" style={{ color: "var(--c-fg)" }}>Account Age:</span> {accountAge}</p>
          <p><span className="font-medium" style={{ color: "var(--c-fg)" }}>Today:</span> {today}</p>
          <p><span className="font-medium" style={{ color: "var(--c-fg)" }}>Time:</span> {time}</p>
        </div>
      </div>

      <hr className="border-t" style={{ borderColor: "var(--c-border)" }} />

      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--c-muted)" }}>
          Notifications
        </h4>
        <div className="space-y-2">
          <label className="flex items-center justify-between text-sm">
            <span style={{ color: "var(--c-fg)" }}>Enabled</span>
            <button
              onClick={() => updateNotif("enabled", !notifSettings.enabled)}
              className={`text-xs px-2 py-0.5 rounded ${notifSettings.enabled ? "text-white" : ""}`}
              style={{ background: notifSettings.enabled ? "#2563eb" : "var(--c-bg)", border: "1px solid var(--c-border)", color: notifSettings.enabled ? "white" : "var(--c-fg)" }}
            >
              {notifSettings.enabled ? "ON" : "OFF"}
            </button>
          </label>

          {notifSettings.enabled && (
            <>
              <label className="flex items-center justify-between text-sm">
                <span style={{ color: "var(--c-fg)" }}>Sound</span>
                <button
                  onClick={() => updateNotif("sound", !notifSettings.sound)}
                  className={`text-xs px-2 py-0.5 rounded ${notifSettings.sound ? "text-white" : ""}`}
                  style={{ background: notifSettings.sound ? "#2563eb" : "var(--c-bg)", border: "1px solid var(--c-border)", color: notifSettings.sound ? "white" : "var(--c-fg)" }}
                >
                  {notifSettings.sound ? "ON" : "OFF"}
                </button>
              </label>

              <label className="flex items-center justify-between text-sm">
                <span style={{ color: "var(--c-fg)" }}>Popup</span>
                <button
                  onClick={() => updateNotif("popup", !notifSettings.popup)}
                  className={`text-xs px-2 py-0.5 rounded ${notifSettings.popup ? "text-white" : ""}`}
                  style={{ background: notifSettings.popup ? "#2563eb" : "var(--c-bg)", border: "1px solid var(--c-border)", color: notifSettings.popup ? "white" : "var(--c-fg)" }}
                >
                  {notifSettings.popup ? "ON" : "OFF"}
                </button>
              </label>

              <div>
                <span className="text-sm block mb-1" style={{ color: "var(--c-fg)" }}>Rooms to watch</span>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {rooms.length === 0 && (
                    <p className="text-xs" style={{ color: "var(--c-subtle)" }}>No public rooms available.</p>
                  )}
                  {rooms.map(room => {
                    const checked = notifSettings.rooms?.includes(room.id)
                    return (
                      <label key={room.id} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleRoom(room.id)}
                          className="rounded"
                        />
                        <span style={{ color: checked ? "var(--c-fg)" : "var(--c-muted)" }}>
                          #{room.name}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SettingsPanel({ children, onOpen, noPopup }) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [settings, setSettings] = useState(defaults)
  const panelRef = useRef(null)

  useEffect(() => {
    setSettings(load())
  }, [])

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    const keydown = (e) => { if (e.key === "Escape") setOpen(false) }
    document.addEventListener("mousedown", handler)
    document.addEventListener("keydown", keydown)
    return () => {
      document.removeEventListener("mousedown", handler)
      document.removeEventListener("keydown", keydown)
    }
  }, [open])

  const update = (key, value) => {
    const next = { ...settings, [key]: value }
    setSettings(next)
    apply(next)
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => { if (!noPopup) setOpen(!open); onOpen?.() }}
        className="text-sm px-2 py-1 rounded transition-colors"
        style={{ color: "var(--c-subtle)" }}
        title="Settings"
      >
        ⚙️
      </button>

      {!noPopup && open && (
        <div
          className="absolute right-0 top-full mt-2 w-60 rounded-xl border shadow-lg p-4 z-50 max-h-[70vh] overflow-y-auto"
          style={{
            background: "var(--c-card)",
            borderColor: "var(--c-border)",
            color: "var(--c-fg)",
          }}
        >
          <SettingsContent settings={settings} onUpdate={update} user={user} />

          {children && (
            <>
              <hr className="my-3 border-t" style={{ borderColor: "var(--c-border)" }} />
              <div className="space-y-1">{children}</div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
