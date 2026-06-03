import Link from "next/link"
import SettingsPanel from "./SettingsPanel"

export const dynamic = "force-dynamic"

async function getData() {
  try {
    const base = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000"
    const res = await fetch(`${base}/api/data`, { cache: "no-store" })
    return await res.json()
  } catch {
    return { subjects: [] }
  }
}

export default async function Home() {
  const data = await getData()
  const { subjects } = data

  return (
    <div className="min-h-screen" style={{ background: "var(--c-bg)" }}>
      <header style={{ background: "var(--c-card)", borderColor: "var(--c-border)" }} className="border-b">
        <div className="max-w-5xl mx-auto px-4 py-6 flex items-center justify-between header-content">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--c-fg)" }}>StudyHub</h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--c-subtle)" }}>All your study materials in one place</p>
          </div>
          <div className="flex items-center gap-2">
            <SettingsPanel />
            <Link
              href="/admin"
              className="text-xs transition-colors px-2 py-1 rounded"
              style={{ color: "var(--c-subtle)" }}
            >
              Admin
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {subjects.length === 0 && (
          <div className="text-center py-20" style={{ color: "var(--c-subtle)" }}>
            <p className="text-lg">No subjects yet.</p>
            <p className="text-sm mt-1">Check back later or ask your admin to add them.</p>
          </div>
        )}

        <div className="grid gap-4 subject-grid sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((subject) => (
            <Link
              key={subject.id}
              href={`/subjects/${subject.id}`}
              className="subject-card block rounded-xl border p-5"
              style={{ background: "var(--c-card)", borderColor: "var(--c-border)" }}
            >
              <div className="text-3xl mb-3">{subject.icon}</div>
              <h2 className="text-lg font-semibold" style={{ color: "var(--c-fg)" }}>{subject.name}</h2>
              <p className="text-sm mt-1" style={{ color: "var(--c-muted)" }}>{subject.description}</p>
              <div className="flex gap-3 mt-3 text-xs" style={{ color: "var(--c-subtle)" }}>
                <span>{subject.quizzes.length} quiz{(subject.quizzes.length !== 1) ? "zes" : ""}</span>
                <span>{subject.links.length} link{(subject.links.length !== 1) ? "s" : ""}</span>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}