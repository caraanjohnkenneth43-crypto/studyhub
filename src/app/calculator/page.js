"use client"

import { useState } from "react"
import Link from "next/link"

const buttons = [
  ["C", "±", "%", "÷"],
  ["7", "8", "9", "×"],
  ["4", "5", "6", "−"],
  ["1", "2", "3", "+"],
  ["0", ".", "="],
]

export default function CalculatorPage() {
  const [display, setDisplay] = useState("0")
  const [prev, setPrev] = useState(null)
  const [op, setOp] = useState(null)
  const [reset, setReset] = useState(false)

  const handle = (val) => {
    if (val === "C") {
      setDisplay("0"); setPrev(null); setOp(null); setReset(false); return
    }
    if (val === "±") {
      setDisplay(String(-parseFloat(display))); return
    }
    if (val === "%") {
      setDisplay(String(parseFloat(display) / 100)); return
    }
    if (["+", "−", "×", "÷"].includes(val)) {
      if (op && !reset) {
        const result = compute(prev, parseFloat(display), op)
        setDisplay(String(result))
        setPrev(result)
      } else {
        setPrev(parseFloat(display))
      }
      setOp(val); setReset(true); return
    }
    if (val === "=") {
      if (op === null) return
      const result = compute(prev, parseFloat(display), op)
      setDisplay(String(result))
      setPrev(null); setOp(null); setReset(true); return
    }
    if (reset) {
      setDisplay(val); setReset(false)
    } else {
      setDisplay(display === "0" ? val : display + val)
    }
  }

  const compute = (a, b, operator) => {
    switch (operator) {
      case "+": return a + b
      case "−": return a - b
      case "×": return a * b
      case "÷": return b !== 0 ? a / b : "Error"
      default: return b
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--c-bg)" }}>
      <div className="w-80 rounded-2xl border shadow-lg p-4" style={{ background: "var(--c-card)", borderColor: "var(--c-border)" }}>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-sm font-semibold" style={{ color: "var(--c-fg)" }}>Calculator</h1>
          <Link href="/dashboard" className="text-xs" style={{ color: "var(--c-link)" }}>✕</Link>
        </div>
        <div className="h-16 mb-4 rounded-xl px-4 flex items-center justify-end text-2xl font-mono" style={{ background: "var(--c-bg)", color: "var(--c-fg)" }}>
          {display}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {buttons.flat().map((b) => (
            <button key={b} onClick={() => handle(b)}
              className={`rounded-xl text-lg font-medium h-14 transition-colors active:scale-95 ${b === "0" ? "col-span-2" : ""}`}
              style={{
                background: ["C", "±", "%"].includes(b) ? "var(--c-border)" : ["÷", "×", "−", "+", "="].includes(b) ? "var(--c-accent)" : "var(--c-card)",
                color: ["÷", "×", "−", "+", "="].includes(b) ? "white" : "var(--c-fg)",
                border: ["C", "±", "%"].includes(b) || ["÷", "×", "−", "+", "="].includes(b) ? "none" : "1px solid var(--c-border)",
              }}
            >
              {b}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
