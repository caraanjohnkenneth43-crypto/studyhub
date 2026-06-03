import Link from "next/link"
import data from "../../data/content.json"

export default function Home() {
  const { subjects } = data

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">StudyHub</h1>
            <p className="text-sm text-slate-500 mt-0.5">All your study materials in one place</p>
          </div>
          <Link
            href="/admin"
            className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            Admin
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((subject) => (
            <Link
              key={subject.id}
              href={`/subjects/${subject.id}`}
              className="subject-card block bg-white rounded-xl border border-slate-200 p-5"
            >
              <div className="text-3xl mb-3">{subject.icon}</div>
              <h2 className="text-lg font-semibold text-slate-900">{subject.name}</h2>
              <p className="text-sm text-slate-500 mt-1">{subject.description}</p>
              <div className="flex gap-3 mt-3 text-xs text-slate-400">
                <span>{subject.quizzes.length} quiz{(subject.quizzes.length !== 1) ? "zes" : ""}</span>
                <span>{subject.links.length} link{(subject.links.length !== 1) ? "s" : ""}</span>
              </div>
            </Link>
          ))}
        </div>

        {subjects.length === 0 && (
          <div className="text-center py-20 text-slate-400">
            <p className="text-lg">No subjects yet.</p>
            <p className="text-sm mt-1">Check back later or ask your admin to add them.</p>
          </div>
        )}
      </main>
    </div>
  )
}