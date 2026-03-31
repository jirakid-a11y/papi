// src/components/MediaGrid.jsx
// Papi — Organism · Virtualized media grid with album section headers

import MediaCard from './MediaCard'

/**
 * MediaGrid
 *
 * Usage Guideline
 * ✅ Use when rendering a grouped or flat list of MediaItems.
 * ✅ Pass grouped (Record<albumName, MediaItem[]>) for "All" view with headers.
 * ❌ Don't add pagination — virtualization handles performance at 1000+ files.
 *
 * @param {{
 *   grouped: Record<string, import('../hooks/useIngestFiles').MediaItem[]>,
 *   getUrl:  Function,
 *   onCardClick: (item: MediaItem, flatIndex: number) => void,
 *   flatItems: MediaItem[],   // needed to compute lightbox index
 * }} props
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
    <div className="space-y-8">
      {groupEntries.map(([albumName, items]) => (
        <section key={albumName}>
          {/* Section header — only shown when there are multiple albums */}
          {groupEntries.length > 1 && (
            <div className="flex items-center gap-3 mb-3 pb-2 border-b border-zinc-800">
              <h2 className="text-sm font-semibold text-zinc-100">{albumName}</h2>
              <span className="text-xs text-zinc-500">{items.length} files</span>
            </div>
          )}

          <div className="grid gap-2.5"
               style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${gridSize}px, 1fr))` }}>
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
