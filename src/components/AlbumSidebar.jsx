// src/components/AlbumSidebar.jsx
// Papi — Organism · Album navigation sidebar

/**
 * AlbumSidebar
 *
 * Usage Guideline
 * ✅ Use when the user has loaded a folder with 2+ sub-albums.
 * ❌ Don't render when all files are in a single album (or "Unsorted") —
 *    hide the sidebar entirely to avoid visual noise.
 *
 * @param {{
 *   albums:      Record<string, string[]>,
 *   albumNames:  string[],
 *   activeAlbum: string,
 *   onSelect:    (albumName: string) => void,
 * }} props
 */
export default function AlbumSidebar({ albums, albumNames, activeAlbum, onSelect }) {
  const allItems = [
    { key: 'all', label: 'All Media', icon: '🗂️' },
    ...albumNames.map(name => ({
      key:   name,
      label: name,
      icon:  name === 'Unsorted' ? '📂' : '📁',
    })),
  ]

  return (
    <aside className="w-48 flex-shrink-0 bg-zinc-900 border-r border-zinc-800
                      flex flex-col overflow-y-auto">
      <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest
                    px-4 pt-4 pb-2">
        Albums
      </p>

      <nav className="flex flex-col gap-0.5 px-2 pb-4">
        {allItems.map(({ key, label, icon }) => {
          const count  = albums[key]?.length ?? 0
          const active = key === activeAlbum

          return (
            <button
              key={key}
              onClick={() => onSelect(key)}
              className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-left
                          text-xs transition-all duration-150 border-l-2
                          ${active
                            ? 'bg-violet-600/10 text-violet-400 border-violet-500'
                            : 'text-zinc-400 border-transparent hover:bg-zinc-800 hover:text-zinc-100'
                          }`}
            >
              <span className="text-sm leading-none">{icon}</span>
              <span className="flex-1 truncate">{label}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full
                                ${active ? 'bg-violet-500/20 text-violet-300' : 'bg-zinc-800 text-zinc-500'}`}>
                {count}
              </span>
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
