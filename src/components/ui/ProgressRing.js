"use client"

import { motion } from "motion/react"

export default function ProgressRing({ progress = 0, size = 64, strokeWidth = 4, color, bgColor }) {
  const r = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * r
  const offset = circumference - (progress / 100) * circumference

  return (
    <svg width={size} height={size} className="shrink-0" style={{ transform: "rotate(-90deg)" }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        strokeWidth={strokeWidth}
        fill="none"
        stroke={bgColor || "var(--c-border)"}
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        strokeWidth={strokeWidth}
        fill="none"
        stroke={color || "var(--c-accent)"}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
      />
    </svg>
  )
}
