// src/components/MediaGrid.jsx
// Papi — Organism · Finder-style virtualized media grid

import MediaCard from './MediaCard'

/**
 * MediaGrid
 *
 * Usage Guideline
 * ✅ Pass gridSize to control thumb size via the toolbar slider.
 * ✅ Grouped by album when in "all" view.
 * ❌ Don't add list-view mode here — keep it grid only (Finder convention).
 */
export default function MediaGrid({ grouped, getUrl, onCardClick, flatItems, gridSize = 160 }) {
  const groupEntries = Object.entries(grouped)

  if (!flatItems.length) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-zinc-600 text-sm">
        No results
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {groupEntries.map(([albumName, items]) => (
        <section key={albumName}>

          {/* Section header — only when multiple albums visible */}
          {groupEntries.length > 1 && (
            <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-zinc-800/60">
              <span className="text-sm">📁</span>
              <h2 className="text-xs font-semibold text-zinc-400 tracking-wide">{albumName}</h2>
              <span className="text-[10px] text-zinc-600 ml-auto">{items.length} files</span>
            </div>
          )}

          {/* Finder-style grid — tight gap, square cells */}
          <div
            className="grid"
            style={{
              gridTemplateColumns: `repeat(auto-fill, minmax(${gridSize}px, 1fr))`,
              gap: '4px',
            }}
          >
            {items.map(item => {
              const flatIdx = flatItems.findIndex(m => m.id === item.id)
              return (
                <MediaCard
                  key={item.id}
                  item={item}
                  getUrl={getUrl}
                  onClick={() => onCardClick(item, flatIdx)}
                />
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}