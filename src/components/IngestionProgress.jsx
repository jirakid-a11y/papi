// src/components/IngestionProgress.jsx
// Papi — Atom · File loading progress toast

/**
 * IngestionProgress
 *
 * Usage Guideline
 * ✅ Render at the root level (fixed position) — not inside the grid.
 * ❌ Don't show when loading is false — conditionally render the parent.
 *
 * @param {{ current: number, total: number }} props
 */
export default function IngestionProgress({ current, total }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0

  return (
    <div className="fixed bottom-5 right-5 z-40
                    bg-zinc-900 border border-zinc-700/60
                    rounded-xl px-4 py-3 shadow-2xl min-w-[220px]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-zinc-400">Loading files…</span>
        <span className="text-xs text-zinc-500">{current} / {total}</span>
      </div>
      <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-violet-500 rounded-full transition-all duration-150"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
