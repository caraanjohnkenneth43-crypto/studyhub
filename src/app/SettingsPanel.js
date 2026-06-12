"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "./AuthProvider"
import { updateProfile } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { doc, setDoc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { collection, query, onSnapshot } from "firebase/firestore"

const SETTINGS_KEY = "studyhub-settings"

const CAMEL_CASE_REGEX = /([A-Z])/g

const defaults = {
  dark: false,
  fontSize: 16,
  // Lobby/text settings
  messageTextSize: 14,
  userTagSize: 12,
  lobbyPfpSize: 32,
  // Color theme settings
  colorThemeCategory: "default",
  customColors: {
    light: { primary: "#2563eb", secondary: "#64748b", accent: "#2563eb", background: "#f8fafc", surface: "#ffffff", text: "#0f172a", muted: "#94a3b8" },
    dark: { primary: "#3b82f6", secondary: "#94a3b8", accent: "#3b82f6", background: "#0f172a", surface: "#1e293b", text: "#e2e8f0", muted: "#64748b" }
  }
}

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

  const cat = settings.colorThemeCategory
  if (cat && cat !== "default" && settings.customColors) {
    const mode = cat === "gradient" ? "light" : cat
    const colors = settings.customColors[mode]
    if (colors) {
      if (colors.primary) { root.style.setProperty("--c-accent", colors.primary); root.style.setProperty("--c-link", colors.primary) }
      if (colors.accent) { root.style.setProperty("--c-accent", colors.accent); root.style.setProperty("--c-link", colors.accent) }
      if (colors.background) root.style.setProperty("--c-bg", colors.background)
      if (colors.surface) root.style.setProperty("--c-card", colors.surface)
      if (colors.text) root.style.setProperty("--c-fg", colors.text)
      if (colors.muted) root.style.setProperty("--c-subtle", colors.muted)
      if (colors.secondary) root.style.setProperty("--c-muted", colors.secondary)
    }
  } else {
    const vars = ["--c-accent", "--c-link", "--c-bg", "--c-card", "--c-fg", "--c-subtle", "--c-muted"]
    vars.forEach(v => root.style.removeProperty(v))
  }

  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  try { window.dispatchEvent(new CustomEvent("studyhub-settings-changed", { detail: settings })) } catch {}
}

export { defaults as settingsDefaults, load as loadSettings, apply as applySettings, SETTINGS_KEY }

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

function getAvatarColor(email) {
  const colors = [
    "#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6",
    "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1",
  ]
  if (!email) return colors[0]
  let hash = 0
  for (let i = 0; i < email.length; i++) hash = email.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

export function SettingsContent({ settings, onUpdate, user }) {
  const [now, setNow] = useState(new Date())
  const [rooms, setRooms] = useState([])
  const [accountAge, setAccountAge] = useState("Unknown")
  const [displayName, setDisplayName] = useState(user?.displayName || "")
  const [displayNameSaving, setDisplayNameSaving] = useState(false)
  const [avatar, setAvatar] = useState(user?.avatar || "")
  const [avatarSaving, setAvatarSaving] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState("")
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

  // Load avatar from Firestore
  useEffect(() => {
    if (!user) return
    getDoc(doc(db, "users", user.uid)).then(snap => {
      if (snap.exists() && snap.data().avatar) {
        setAvatar(snap.data().avatar)
      }
    })
  }, [user])

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

  const handleAvatarUpload = (file) => {
    if (!file) return
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file")
      return
    }
    if (file.size > 500000) {
      alert("Image too large (max 500KB)")
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const base64 = e.target.result
      setAvatarPreview(base64)
      setAvatarSaving(true)
      setDoc(doc(db, "users", user.uid), { avatar: base64 }, { merge: true })
        .then(() => {
          setAvatar(base64)
          setAvatarSaving(false)
          setAvatarPreview("")
        })
        .catch(err => {
          console.error("Failed to save avatar:", err)
          alert("Failed to save avatar")
          setAvatarSaving(false)
          setAvatarPreview("")
        })
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-4">
      {/* Account Settings Section */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: "var(--c-muted)" }}>
          <span>👤</span> Account
        </h3>
        <div className="space-y-3">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 shrink-0">
              {(avatarPreview || avatar) ? (
                <img src={avatarPreview || avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
              ) : (
                <div className="w-full h-full rounded-full flex items-center justify-center text-2xl font-medium text-white" style={{ background: getAvatarColor(user?.email) }}>
                  {user?.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "?"}
                </div>
              )}
              <label className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center cursor-pointer text-white text-sm" style={{ background: "var(--c-accent)", border: "2px solid var(--c-card)" }}>
                📷
                <input type="file" accept="image/*" onChange={e => e.target.files[0] && handleAvatarUpload(e.target.files[0])} className="hidden" disabled={avatarSaving} />
              </label>
            </div>
            <div className="flex-1 min-w-0">
              {avatarSaving && <span className="text-xs" style={{ color: "var(--c-accent)" }}>Saving...</span>}
            </div>
          </div>

          {/* Display Name */}
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium" style={{ color: "var(--c-fg)" }}>Display Name</span>
            <div className="flex items-center gap-2">
              <input 
                value={displayName} 
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Enter your name"
                className="flex-1 px-2 py-1.5 rounded-lg border text-sm min-w-0"
                style={{ background: "var(--c-bg)", borderColor: "var(--c-border)", color: "var(--c-fg)" }}
              />
              <button 
                onClick={async () => {
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
                }} 
                disabled={displayNameSaving || !displayName.trim()}
                className="text-xs px-3 py-1.5 rounded-lg text-white font-medium disabled:opacity-50 shrink-0"
                style={{ background: "var(--c-accent)" }}
              >
                {displayNameSaving ? "..." : "Save"}
              </button>
            </div>
          </label>

          {/* Email & Account Info */}
          <div className="space-y-1 pt-2 border-t" style={{ borderColor: "var(--c-border)" }}>
            <p className="text-sm flex items-center gap-2"><span className="font-medium shrink-0" style={{ color: "var(--c-fg)" }}>Email:</span> <span style={{ color: "var(--c-muted)" }}>{user?.email || "—"}</span></p>
            <p className="text-sm flex items-center gap-2"><span className="font-medium shrink-0" style={{ color: "var(--c-fg)" }}>Account Age:</span> <span style={{ color: "var(--c-muted)" }}>{accountAge}</span></p>
          </div>
        </div>
      </div>

      <hr className="border-t my-4" style={{ borderColor: "var(--c-border)" }} />

      {/* Display Settings Section */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: "var(--c-muted)" }}>
          <span>🎨</span> Display
        </h3>
        <div className="space-y-4">
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

        </div>
      </div>

      <hr className="border-t my-4" style={{ borderColor: "var(--c-border)" }} />

        {/* Lobby/Text Customization Section */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: "var(--c-muted)" }}>
            <span>💬</span> Lobby Customization
          </h3>
          <div className="space-y-4">
            <div>
              <span className="text-sm block mb-1" style={{ color: "var(--c-fg)" }}>Message Text Size — {settings.messageTextSize}px</span>
              <input
                type="range"
                min="10"
                max="24"
                step="1"
                value={settings.messageTextSize}
                onChange={e => onUpdate("messageTextSize", Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <span className="text-sm block mb-1" style={{ color: "var(--c-fg)" }}>User Tag Size — {settings.userTagSize}px</span>
              <input
                type="range"
                min="10"
                max="18"
                step="1"
                value={settings.userTagSize}
                onChange={e => onUpdate("userTagSize", Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--c-muted)" }}>
                PFP Size in Lobbies
              </h4>
              <div className="flex gap-2">
                {[32, 40, 48, 56].map(size => (
                  <button key={size} onClick={() => onUpdate("lobbyPfpSize", size)} 
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${settings.lobbyPfpSize === size ? "" : "opacity-50"}`}
                    style={{
                      background: settings.lobbyPfpSize === size ? "var(--c-accent)" : "var(--c-bg)",
                      color: settings.lobbyPfpSize === size ? "white" : "var(--c-fg)",
                      borderColor: "var(--c-border)",
                    }}
                  >
                    {size}px
                  </button>
                ))}
              </div>
            </div>
            </div>
        </div>

      <hr className="border-t my-4" style={{ borderColor: "var(--c-border)" }} />

      {/* Color Theme Customization Section */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: "var(--c-muted)" }}>
            <span>🎨</span> Color Themes
          </h3>
          <div className="space-y-4">
            <div>
              <span className="text-sm block mb-2" style={{ color: "var(--c-fg)" }}>Theme Category</span>
              <div className="flex gap-2 flex-wrap">
                {["default", "light", "dark", "gradient"].map(cat => (
                  <button key={cat} onClick={() => onUpdate("colorThemeCategory", cat)} 
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${settings.colorThemeCategory === cat ? "" : "opacity-50"}`}
                    style={{
                      background: settings.colorThemeCategory === cat ? "var(--c-accent)" : "var(--c-bg)",
                      color: settings.colorThemeCategory === cat ? "white" : "var(--c-fg)",
                      borderColor: "var(--c-border)",
                    }}
                    title={cat}
                  >
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {settings.colorThemeCategory !== "default" && (
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--c-muted)" }}>
                  Custom Colors ({settings.colorThemeCategory === "gradient" ? "Gradient" : settings.colorThemeCategory })
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(settings.customColors[settings.colorThemeCategory === "gradient" ? "light" : settings.colorThemeCategory]).map(([key, value]) => (
                    <div key={key}>
                      <label className="flex items-center justify-between text-xs">
                        <span className="capitalize" style={{ color: "var(--c-fg)" }}>{key.replace(new RegExp(CAMEL_CASE_REGEX.source, CAMEL_CASE_REGEX.flags), " $1").trim()}</span>
                        <input
                          type="color"
                          value={value}
                          onChange={e => {
                            const newColors = { ...settings.customColors[settings.colorThemeCategory === "gradient" ? "light" : settings.colorThemeCategory], [key]: e.target.value }
                            onUpdate("customColors", { ...settings.customColors, [settings.colorThemeCategory === "gradient" ? "light" : settings.colorThemeCategory]: newColors })
                          }}
                          className="w-8 h-8 rounded border-2 cursor-pointer"
                          style={{ borderColor: settings.colorThemeCategory === settings.colorThemeCategory ? "var(--c-fg)" : "transparent" }}
                        />
                      </label>
                    </div>
                  ))}
                </div>
                {settings.colorThemeCategory === "gradient" && (
                  <div className="space-y-2">
                    <p className="text-xs" style={{ color: "var(--c-subtle)" }}>Gradient uses light theme colors for start/end points</p>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(settings.customColors.dark).map(([key, value]) => (
                        <div key={key}>
                          <label className="flex items-center justify-between text-xs">
                            <span className="capitalize" style={{ color: "var(--c-fg)" }}>{key.replace(new RegExp(CAMEL_CASE_REGEX.source, CAMEL_CASE_REGEX.flags), " $1").trim()} (Dark End)</span>
                            <input
                              type="color"
                              value={value}
                              onChange={e => {
                                const newColors = { ...settings.customColors.dark, [key]: e.target.value }
                                onUpdate("customColors", { ...settings.customColors, dark: newColors })
                              }}
                              className="w-8 h-8 rounded border-2 cursor-pointer"
                            />
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      <hr className="border-t my-4" style={{ borderColor: "var(--c-border)" }} />

      {/* Notifications Section */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: "var(--c-muted)" }}>
          <span>🔔</span> Notifications
        </h3>
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
    const loaded = load()
    setSettings(loaded)
    apply(loaded)
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
          className="absolute right-0 top-full mt-2 w-80 rounded-xl border shadow-lg p-4 z-50 max-h-[70vh] overflow-y-auto"
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