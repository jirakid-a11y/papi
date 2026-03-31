// src/components/Toolbar.jsx
// Papi — Molecule · Toolbar with Up, Open Folder, inline breadcrumb, sort, grid slider

export default function Toolbar({
  onOpenFolder,
  onGoUp,
  canGoUp,
  sortKey,
  onSortChange,
  gridSize,
  onGridSizeChange,
  activeAlbum,
  albumFileCount,
}) {
  const handleFolder = (e) => onOpenFolder([...e.target.files])
  const inAlbum = activeAlbum && activeAlbum !== 'all'

  return (
    <div className="flex items-center gap-2 px-3 py-2
                    bg-zinc-900 border-b border-zinc-700 flex-shrink-0 min-w-0">

      {/* ── Up button ── */}
      <button
        onClick={onGoUp}
        disabled={!canGoUp}
        title="Go up (Backspace)"
        className={`flex items-center justify-center w-8 h-8 rounded flex-shrink-0
                    transition-all duration-150
                    ${canGoUp
                      ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-200 cursor-pointer'
                      : 'bg-zinc-800/40 text-zinc-700 cursor-not-allowed'
                    }`}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="18 15 12 9 6 15"/>
        </svg>
      </button>

      {/* ── Open Folder ── */}
      <label className="flex items-center gap-1.5 px-3 py-1.5 rounded flex-shrink-0
                         bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium
                         cursor-pointer transition-colors">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>
        Open
        <input
          type="file" multiple accept="image/*,video/*,audio/*"
          onChange={handleFolder}
          // @ts-ignore
          webkitdirectory=""
          className="hidden"
        />
      </label>

      {/* ── Inline breadcrumb — only when inside an album ── */}
      {inAlbum && (
        <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2" className="text-zinc-600 flex-shrink-0">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
          <button
            onClick={onGoUp}
            className="text-blue-400 hover:text-blue-300 transition-colors
                       flex-shrink-0 font-medium whitespace-nowrap"
            style={{ fontSize: '18px' }}
          >
            Albums
          </button>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2" className="text-zinc-600 flex-shrink-0">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
          <span
            className="font-semibold text-zinc-100 truncate"
            style={{ fontSize: '18px' }}
          >
            {activeAlbum}
          </span>
          {albumFileCount != null && (
            <span className="flex-shrink-0 text-[11px] text-zinc-500
                             bg-zinc-800 px-2 py-0.5 rounded-full ml-1">
              {albumFileCount.toLocaleString()} files
            </span>
          )}
        </div>
      )}

      {/* ── Spacer ── */}
      <div className="flex-1 min-w-0" />

      {/* ── Sort ── */}
      <select
        value={sortKey}
        onChange={e => onSortChange(e.target.value)}
        className="bg-zinc-800 border border-zinc-600 text-zinc-200 text-sm
                   rounded px-2 py-1.5 outline-none cursor-pointer
                   focus:border-blue-500 flex-shrink-0"
      >
        <option value="latest">Newest first</option>
        <option value="oldest">Oldest first</option>
        <option value="name-asc">Name A→Z</option>
        <option value="name-desc">Name Z→A</option>
        <option value="size-desc">Size ↓</option>
        <option value="size-asc">Size ↑</option>
      </select>

      {/* ── Grid size slider ── */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* Small grid icon */}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-zinc-500">
          <rect x="3" y="3" width="4" height="4" rx="0.5"/>
          <rect x="10" y="3" width="4" height="4" rx="0.5"/>
          <rect x="17" y="3" width="4" height="4" rx="0.5"/>
          <rect x="3" y="10" width="4" height="4" rx="0.5"/>
          <rect x="10" y="10" width="4" height="4" rx="0.5"/>
          <rect x="17" y="10" width="4" height="4" rx="0.5"/>
          <rect x="3" y="17" width="4" height="4" rx="0.5"/>
          <rect x="10" y="17" width="4" height="4" rx="0.5"/>
          <rect x="17" y="17" width="4" height="4" rx="0.5"/>
        </svg>
        <input
          type="range" min="80" max="320" step="10"
          value={gridSize}
          onChange={e => onGridSizeChange(Number(e.target.value))}
          title={`Grid size: ${gridSize}px`}
          className="w-20 cursor-pointer"
          style={{ accentColor: '#2563eb' }}
        />
        {/* Large grid icon */}
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" className="text-zinc-500">
          <rect x="3" y="3" width="8" height="8" rx="1"/>
          <rect x="13" y="3" width="8" height="8" rx="1"/>
          <rect x="3" y="13" width="8" height="8" rx="1"/>
          <rect x="13" y="13" width="8" height="8" rx="1"/>
        </svg>
      </div>
    </div>
  )
}