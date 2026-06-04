"use client"

import { useState, useEffect, useRef } from "react"

const SETTINGS_KEY = "studyhub-settings"

const defaults = {
  dark: false,
  fontSize: "medium",
  density: "comfortable",
}

function load() {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY)
    return saved ? { ...defaults, ...JSON.parse(saved) } : defaults
  } catch {
    return defaults
  }
}

function apply(settings) {
  const root = document.documentElement
  root.classList.toggle("dark", settings.dark)

  root.style.fontSize =
    settings.fontSize === "small" ? "14px" :
    settings.fontSize === "large" ? "18px" :
    "16px"

  root.classList.remove("density-compact", "density-comfortable", "density-spacious")
  root.classList.add("density-" + settings.density)

  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

export default function SettingsPanel({ children, onOpen }) {
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
        onClick={() => { setOpen(!open); onOpen?.() }}
        className="text-sm px-2 py-1 rounded transition-colors"
        style={{ color: "var(--c-subtle)" }}
        title="Settings"
      >
        ⚙️
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-56 rounded-xl border shadow-lg p-4 z-50"
          style={{
            background: "var(--c-card)",
            borderColor: "var(--c-border)",
            color: "var(--c-fg)",
          }}
        >
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--c-muted)" }}>
            Preferences
          </h3>

          <div className="space-y-3">
            <label className="flex items-center justify-between text-sm">
              <span>Dark Mode</span>
              <button
                onClick={() => update("dark", !settings.dark)}
                className="text-base"
              >
                {settings.dark ? "☀️" : "🌙"}
              </button>
            </label>

            <div>
              <span className="text-sm block mb-1">Font Size</span>
              <div className="flex gap-1">
                {["small", "medium", "large"].map((size) => (
                  <button
                    key={size}
                    onClick={() => update("fontSize", size)}
                    className="flex-1 text-xs py-1 rounded border capitalize"
                    style={{
                      background: settings.fontSize === size ? "#2563eb" : "transparent",
                      borderColor: settings.fontSize === size ? "#2563eb" : "var(--c-border)",
                      color: settings.fontSize === size ? "white" : "var(--c-fg)",
                    }}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-sm block mb-1">Density</span>
              <div className="flex gap-1">
                {[
                  { key: "compact", label: "Compact" },
                  { key: "comfortable", label: "Normal" },
                  { key: "spacious", label: "Spacious" },
                ].map((d) => (
                  <button
                    key={d.key}
                    onClick={() => update("density", d.key)}
                    className="flex-1 text-xs py-1 rounded border"
                    style={{
                      background: settings.density === d.key ? "#2563eb" : "transparent",
                      borderColor: settings.density === d.key ? "#2563eb" : "var(--c-border)",
                      color: settings.density === d.key ? "white" : "var(--c-fg)",
                    }}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

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