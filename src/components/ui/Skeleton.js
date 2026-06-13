"use client"

export function Skeleton({ className, style, ...props }) {
  return (
    <div
      className={`animate-pulse rounded-[var(--radius-md)] ${className || ""}`}
      style={{
        background: "var(--c-border)",
        ...style,
      }}
      {...props}
    />
  )
}

export function SkeletonCard() {
  return (
    <div
      className="rounded-[var(--radius-lg)] p-[var(--space-4)] space-y-[var(--space-3)]"
      style={{ background: "var(--c-card)", border: "1px solid var(--c-border)" }}
    >
      <Skeleton style={{ width: "40%", height: "12px" }} />
      <Skeleton style={{ width: "100%", height: "80px", borderRadius: "var(--radius-md)" }} />
      <Skeleton style={{ width: "70%", height: "12px" }} />
      <Skeleton style={{ width: "50%", height: "12px" }} />
    </div>
  )
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-[var(--space-3)] px-[var(--space-4)] py-[var(--space-3)]">
      <Skeleton style={{ width: "32px", height: "32px", borderRadius: "var(--radius-full)" }} />
      <div className="flex-1 space-y-[var(--space-1)]">
        <Skeleton style={{ width: "30%", height: "10px" }} />
        <Skeleton style={{ width: "60%", height: "10px" }} />
      </div>
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-[var(--space-6)] p-[var(--space-6)] max-w-4xl mx-auto w-full">
      <Skeleton style={{ width: "50%", height: "24px" }} />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-[var(--space-4)]">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-[var(--space-4)]">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  )
}

export function ChatSkeleton() {
  return (
    <div className="flex-1 space-y-[var(--space-2)] p-[var(--space-4)]">
      {Array.from({ length: 5 }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  )
}
