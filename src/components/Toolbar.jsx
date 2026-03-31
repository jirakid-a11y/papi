// src/components/Toolbar.jsx
export default function Toolbar({
  onOpenFolder, onGoUp, canGoUp,
  sortKey, onSortChange,
  gridSize, onGridSizeChange,
  navPath = [], onBreadcrumb,
  rootFolders = [],
}) {
  const rootLabel = rootFolders.length === 1 ? rootFolders[0] : 'Root'

  return (
    <div className="flex items-center gap-2 px-3 py-2
                    bg-zinc-900 border-b border-zinc-700 flex-shrink-0 min-w-0">

      {/* Open folder */}
      <label className="flex items-center gap-1.5 px-3 py-1.5 rounded flex-shrink-0
                         bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium
                         cursor-pointer transition-colors">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>
        Open
        <input type="file" multiple accept="image/*,video/*,audio/*"
          onChange={e => onOpenFolder([...e.target.files])}
          // @ts-ignore
          webkitdirectory="" className="hidden" />
      </label>

      {/* Up button — right of Open */}
      <button
        onClick={onGoUp}
        disabled={!canGoUp}
        title="Go up"
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

      {/* Breadcrumb — Root › Folder › SubFolder */}
      <div className="flex items-center gap-1 min-w-0 overflow-hidden">
        {/* Root crumb — always visible when media loaded */}
        {rootFolders.length > 0 && (
          <button
            onClick={() => onBreadcrumb(-1)}
            className={`text-sm flex-shrink-0 transition-colors whitespace-nowrap
                        ${navPath.length === 0
                          ? 'text-zinc-200 font-semibold cursor-default'
                          : 'text-blue-400 hover:text-blue-300 cursor-pointer'
                        }`}
          >
            {rootLabel}
          </button>
        )}

        {navPath.map((seg, idx) => (
          <span key={idx} className="flex items-center gap-1 min-w-0">
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2.5" className="text-zinc-700 flex-shrink-0">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
            {idx < navPath.length - 1 ? (
              <button
                onClick={() => onBreadcrumb(idx)}
                className="text-blue-400 hover:text-blue-300 transition-colors
                           whitespace-nowrap flex-shrink-0 text-sm"
              >
                {seg}
              </button>
            ) : (
              <span className="font-semibold text-zinc-100 truncate text-sm">{seg}</span>
            )}
          </span>
        ))}
      </div>

      {/* Spacer */}
      <div className="flex-1 min-w-0" />

      {/* Sort */}
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

      {/* Grid size slider */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-zinc-500">
          <rect x="3" y="3" width="4" height="4" rx="0.5"/><rect x="10" y="3" width="4" height="4" rx="0.5"/>
          <rect x="17" y="3" width="4" height="4" rx="0.5"/><rect x="3" y="10" width="4" height="4" rx="0.5"/>
          <rect x="10" y="10" width="4" height="4" rx="0.5"/><rect x="17" y="10" width="4" height="4" rx="0.5"/>
          <rect x="3" y="17" width="4" height="4" rx="0.5"/><rect x="10" y="17" width="4" height="4" rx="0.5"/>
          <rect x="17" y="17" width="4" height="4" rx="0.5"/>
        </svg>
        <input
          type="range" min="80" max="320" step="10"
          value={gridSize}
          onChange={e => onGridSizeChange(Number(e.target.value))}
          className="w-20 cursor-pointer"
          style={{ accentColor: '#2563eb' }}
        />
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" className="text-zinc-500">
          <rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/>
          <rect x="3" y="13" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/>
        </svg>
      </div>
    </div>
  )
}