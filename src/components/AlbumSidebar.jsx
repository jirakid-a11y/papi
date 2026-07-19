export default function AlbumSidebar({ treeItems, navPath, onNavToPath, rootFolders }) {
  const title = rootFolders.length === 1 ? rootFolders[0] : 'Folders'

  return (
    <aside className="w-48 flex-shrink-0 flex flex-col overflow-hidden bg-zinc-900 border-r border-zinc-800">
      <div className="px-3 py-2 border-b border-zinc-800 text-[10px] font-semibold uppercase tracking-widest text-zinc-500 truncate flex-shrink-0">
        {title}
      </div>
      <nav className="flex flex-col flex-1 py-1 overflow-y-auto">
        {treeItems.length === 0
          ? <p className="px-3 py-3 text-xs text-zinc-700 italic">No folders</p>
          : treeItems.map((item) => (
            <button
              key={item.navPath.join('/')}
              onClick={() => onNavToPath(item.navPath)}
              style={{ paddingLeft: `${0.75 + item.depth * 1}rem` }}
              className={`flex items-center gap-1.5 pr-2 py-1.5 text-left text-sm w-full
                          border-l-2 transition-colors duration-100
                          ${item.isActive
                            ? 'border-blue-500 bg-zinc-800 text-zinc-100'
                            : 'border-transparent text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
                          }`}
            >
              {/* Expand arrow — rotated when open */}
              <svg
                width="8" height="8" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5"
                className={`flex-shrink-0 transition-transform duration-150 text-zinc-600
                            ${item.isExpanded ? 'rotate-90' : ''}`}
                style={{ opacity: item.hasChildren ? 1 : 0 }}
              >
                <polyline points="9 18 15 12 9 6"/>
              </svg>
              <span className="text-sm leading-none flex-shrink-0">📁</span>
              <span className="flex-1 truncate">{item.name}</span>
              <span className="text-[10px] text-zinc-600 tabular-nums flex-shrink-0">
                {item.count.toLocaleString()}
              </span>
            </button>
          ))
        }
      </nav>
    </aside>
  )
}
