"use client"

import { createContext, useContext, useState, useCallback } from "react"
import { motion, AnimatePresence } from "motion/react"

const ToastContext = createContext(null)

export function useToast() {
  return useContext(ToastContext)
}

const VARIANTS = {
  success: { bg: "var(--c-success-bg)", color: "var(--c-success)", icon: "✓" },
  error: { bg: "var(--c-danger-bg)", color: "var(--c-danger)", icon: "✕" },
  warning: { bg: "var(--c-warning-bg)", color: "var(--c-warning)", icon: "⚠" },
  info: { bg: "var(--c-info-bg)", color: "var(--c-info)", icon: "ℹ" },
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const toast = useCallback((message, type = "info", duration = 3000) => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, duration)
  }, [])

  const remove = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => {
            const v = VARIANTS[t.type] || VARIANTS.info
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.15 } }}
                onClick={() => remove(t.id)}
                className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-[var(--radius-lg)] shadow-lg cursor-pointer max-w-sm"
                style={{ background: v.bg, color: v.color, border: `1px solid ${v.color}20` }}
              >
                <span className="text-sm font-bold">{v.icon}</span>
                <span className="text-sm">{t.message}</span>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
