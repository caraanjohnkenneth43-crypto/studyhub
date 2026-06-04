"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "../AuthProvider"
import SettingsPanel from "../SettingsPanel"
import ReactMarkdown from "react-markdown"
import rehypeRaw from "rehype-raw"

export default function DashboardHome() {
  const { user, loading, logOut } = useAuth()
  const router = useRouter()
  const [data, setData] = useState(null)

  useEffect(() => {
    if (!loading && !user) router.push("/login")
  }, [user, loading, router])

  useEffect(() => {
    fetch("/api/data").then(r => r.json()).then(setData).catch(() => setData({ subjects: [], info: [] }))
  }, [])

  if (loading || !user || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--c-bg)", color: "var(--c-subtle)" }}>
        Loading...
      </div>
    )
  }

  const info = data.info || []

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--c-bg)" }}>
      <div className="flex-1 flex w-full mobile-stack">
        <div className="w-72 shrink-0 p-6 flex flex-col gap-4 h-full mobile-sidebar">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-extrabold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
              StudyHub
            </h1>
            <SettingsPanel>
              <Link href="/admin/dashboard" className="block text-sm px-2 py-1.5 rounded-lg transition-colors hover:bg-black/5" style={{ color: "var(--c-subtle)" }}>Admin</Link>
              <button onClick={logOut} className="w-full text-left text-sm px-2 py-1.5 rounded-lg transition-colors hover:bg-black/5" style={{ color: "var(--c-subtle)" }}>Log out</button>
            </SettingsPanel>
          </div>
          <button
            onClick={() => router.push("/dashboard/2029")}
            className="w-full rounded-xl border-2 card-pad text-left transition-all hover:border-blue-400"
            style={{
              background: "var(--c-card)",
              borderColor: "var(--c-border)",
              color: "var(--c-fg)",
            }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--c-muted)" }}>Classroom</p>
            <p className="text-base font-semibold">Class of 2029 &rarr;</p>
          </button>
        </div>

        <main className="flex-1 p-6 overflow-y-auto border-l mobile-px" style={{ borderColor: "var(--c-border)", height: "calc(100vh - 49px)" }}>
          {info.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center" style={{ color: "var(--c-subtle)" }}>
                <p className="text-sm">Edit this page in the Admin panel.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-8 max-w-2xl">
              {info.map((section, i) => (
                <div key={i}>
                  <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--c-fg)" }}>{section.title}</h2>
                  <div className="text-sm leading-relaxed" style={{ color: "var(--c-muted)" }}>
                    <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                      {section.content}
                    </ReactMarkdown>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
