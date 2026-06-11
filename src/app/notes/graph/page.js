"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "../../AuthProvider"

export default function NotesGraphPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const canvasRef = useRef(null)
  const [notes, setNotes] = useState([])
  const [nodes, setNodes] = useState([])
  const [edges, setEdges] = useState([])
  const [hovered, setHovered] = useState(null)
  const animRef = useRef(null)

  useEffect(() => {
    if (!loading && !user) router.push("/login")
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return
    fetch(`/api/notes?userId=${user.uid}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) {
          console.error("Failed to fetch notes for graph:", d.error)
          return
        }
        const allNotes = d.notes || []
        setNotes(allNotes)
        buildGraph(allNotes)
      })
      .catch(e => console.error("Error fetching notes for graph:", e))
  }, [user])

  const parseLinks = (content) => {
    const links = []
    const regex = /\[\[([^\]]+)\]\]/g
    let match
    while ((match = regex.exec(content)) !== null) {
      links.push(match[1].trim().toLowerCase())
    }
    return links
  }

  const buildGraph = (allNotes) => {
    const nodeMap = {}
    const edgeList = []
    const centerX = 400, centerY = 300

    allNotes.forEach((note, i) => {
      const angle = (2 * Math.PI * i) / allNotes.length
      const radius = 150 + Math.random() * 50
      nodeMap[note.id] = {
        id: note.id,
        title: note.title,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
        vx: 0, vy: 0,
        radius: 20,
      }
    })

    allNotes.forEach(note => {
      const links = parseLinks(note.content)
      links.forEach(targetTitle => {
        const target = allNotes.find(n => n.title.toLowerCase() === targetTitle)
        if (target && target.id !== note.id) {
          edgeList.push({ source: note.id, target: target.id })
        }
      })
    })

    setNodes(Object.values(nodeMap))
    setEdges(edgeList)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || nodes.length === 0) return
    const ctx = canvas.getContext("2d")

    const F = 0.02, DAMP = 0.9, REP = 5000, ATTR = 0.001

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const current = [...nodes]

      for (let i = 0; i < current.length; i++) {
        for (let j = i + 1; j < current.length; j++) {
          const dx = current[j].x - current[i].x
          const dy = current[j].y - current[i].y
          const dist = Math.sqrt(dx * dx + dy * dy) || 1
          const force = REP / (dist * dist)
          current[i].vx -= (force * dx) / dist
          current[i].vy -= (force * dy) / dist
          current[j].vx += (force * dx) / dist
          current[j].vy += (force * dy) / dist
        }
      }

      for (const edge of edges) {
        const a = current.find(n => n.id === edge.source)
        const b = current.find(n => n.id === edge.target)
        if (a && b) {
          const dx = b.x - a.x
          const dy = b.y - a.y
          const dist = Math.sqrt(dx * dx + dy * dy) || 1
          a.vx += ATTR * dx
          a.vy += ATTR * dy
          b.vx -= ATTR * dx
          b.vy -= ATTR * dy
        }
      }

      for (const node of current) {
        node.vx *= DAMP
        node.vy *= DAMP
        node.x += node.vx
        node.y += node.vy
        node.x = Math.max(30, Math.min(canvas.width - 30, node.x))
        node.y = Math.max(30, Math.min(canvas.height - 30, node.y))
      }

      for (const edge of edges) {
        const a = current.find(n => n.id === edge.source)
        const b = current.find(n => n.id === edge.target)
        if (a && b) {
          ctx.beginPath()
          ctx.moveTo(a.x, a.y)
          ctx.lineTo(b.x, b.y)
          ctx.strokeStyle = "var(--c-border)"
          ctx.lineWidth = 1
          ctx.stroke()
        }
      }

      for (const node of current) {
        const isHovered = hovered === node.id
        ctx.beginPath()
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2)
        ctx.fillStyle = isHovered ? "var(--c-accent)" : "var(--c-card)"
        ctx.fill()
        ctx.strokeStyle = "var(--c-border)"
        ctx.lineWidth = isHovered ? 2 : 1
        ctx.stroke()

        if (isHovered) {
          ctx.fillStyle = "var(--c-fg)"
          ctx.font = "12px sans-serif"
          ctx.textAlign = "center"
          ctx.fillText(node.title, node.x, node.y + node.radius + 16)
        }
      }

      setNodes(current)
      animRef.current = requestAnimationFrame(animate)
    }

    animRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animRef.current)
  }, [nodes.length, edges.length, hovered])

  const handleMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    const mx = e.clientX - rect.left, my = e.clientY - rect.top
    const found = nodes.find(n => Math.hypot(n.x - mx, n.y - my) < n.radius)
    setHovered(found ? found.id : null)
  }

  if (loading || !user) return null

  return (
    <div className="p-6" style={{ color: "var(--c-fg)" }}>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Notes Graph</h1>
        <div className="flex items-center gap-4 text-xs" style={{ color: "var(--c-subtle)" }}>
          <span>{notes.length} notes</span>
          <span>{edges.length} links</span>
          <button onClick={() => router.push("/notes")} style={{ color: "var(--c-accent)" }}>Back to Notes</button>
        </div>
      </div>

      {notes.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--c-subtle)" }}>Create some notes with [[wikilinks]] to see the graph.</p>
      ) : (
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--c-border)" }}>
          <div style={{ position: "relative", width: "100%", maxWidth: 800, margin: "0 auto" }}>
            <canvas
              ref={canvasRef}
              width={800}
              height={600}
              onMouseMove={handleMove}
              style={{ display: "block", width: "100%", height: "auto", background: "var(--c-card)" }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
