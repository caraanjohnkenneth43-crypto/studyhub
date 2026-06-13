"use client"

import { motion } from "motion/react"
import ProgressRing from "./ProgressRing"

export default function StatCard({ label, value, trend, progress, icon, color }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className="rounded-[var(--radius-lg)] p-[var(--space-4)] flex items-center gap-[var(--space-4)]"
      style={{
        background: "var(--c-card)",
        border: "1px solid var(--c-border)",
      }}
    >
      {icon && <span className="text-2xl">{icon}</span>}
      {progress !== undefined && (
        <ProgressRing progress={progress} size={48} color={color} />
      )}
      <div className="flex-1 min-w-0">
        <div className="text-[var(--text-caption)]" style={{ color: "var(--c-subtle)" }}>
          {label}
        </div>
        <div className="text-[var(--text-h2)] font-bold truncate" style={{ color: "var(--c-fg)" }}>
          {value}
        </div>
        {trend && (
          <div className="text-[var(--text-caption)] mt-[var(--space-1)]" style={{ color: "var(--c-success)" }}>
            {trend}
          </div>
        )}
      </div>
    </motion.div>
  )
}
