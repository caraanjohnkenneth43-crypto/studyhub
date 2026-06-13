"use client"

export default function EmptyState({ icon = "📭", title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-[var(--space-12)] px-[var(--space-4)]">
      <span className="text-4xl mb-[var(--space-4)]">{icon}</span>
      <h3 className="text-[var(--text-h3)] font-semibold mb-[var(--space-2)]" style={{ color: "var(--c-fg)" }}>
        {title}
      </h3>
      {description && (
        <p className="text-[var(--text-body)] max-w-sm mb-[var(--space-6)]" style={{ color: "var(--c-subtle)" }}>
          {description}
        </p>
      )}
      {action && action}
    </div>
  )
}
