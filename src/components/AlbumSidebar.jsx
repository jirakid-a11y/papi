// src/components/AlbumSidebar.jsx
// Papi — Organism · Depth-aware sidebar showing current folder's children

export default function AlbumSidebar({ sidebarFolders, navPath, onNavigate, rootFolders }) {
  // Label: show current folder name, or "Root" if at top
  const currentLabel = navPath.length > 0
    ? navPath[navPath.length - 1]
    : rootFolders.length === 1
      ? rootFolders[0]        // show the uploaded folder name
      : 'Folders'

  return (
    <aside className="w-48 flex-shrink-0 flex flex-col overflow-y-auto
                      bg-zinc-900 border-r border-zinc-800">

      {/* Current level label */}
      <div className="px-3 py-2 border-b border-zinc-800
                      text-[10px] font-semibold uppercase tracking-widest
                      text-zinc-500 truncate">
        {currentLabel}
      </div>

      {/* Sub-folder list */}
      <nav className="flex flex-col flex-1 py-1 overflow-y-auto">
        {sidebarFolders.length === 0 ? (
          <p className="px-3 py-3 text-xs text-zinc-700 italic">No sub-folders</p>
        ) : (
          sidebarFolders.map(({ name, count, hasChildren }) => (
            <button
              key={name}
              onClick={() => onNavigate(name)}
              className="flex items-center gap-2 px-3 py-1.5 text-left text-sm
                         text-zinc-400 border-l-2 border-transparent
                         hover:bg-zinc-800 hover:text-zinc-100
                         transition-colors duration-100 group"
            >
              <span className="text-sm leading-none flex-shrink-0">📁</span>
              <span className="flex-1 truncate">{name}</span>
              {/* › arrow if has nested sub-folders */}
              {hasChildren && (
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" strokeWidth="2.5"
                     className="text-zinc-600 group-hover:text-zinc-400 flex-shrink-0">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              )}
              <span className="text-[10px] text-zinc-600 tabular-nums flex-shrink-0">
                {count.toLocaleString()}
              </span>
            </button>
          ))
        )}
      </nav>
    </aside>
  )
}