// src/pages/ViewerPage.jsx
import { useState, useCallback } from 'react'
import { useIngestFiles }    from '../hooks/useIngestFiles'
import { useAlbums }         from '../hooks/useAlbums'
import Toolbar               from '../components/Toolbar'
import AlbumSidebar          from '../components/AlbumSidebar'
import MediaGrid             from '../components/MediaGrid'
import Lightbox              from '../components/Lightbox'
import IngestionProgress     from '../components/IngestionProgress'

const FILE_LIMIT   = 5000
const GRID_DEFAULT = 160

export default function ViewerPage() {
  const { media, progress, ingest, getUrl } = useIngestFiles()

  const [navPath,  setNavPath]  = useState([])
  const [sortKey,  setSortKey]  = useState('latest')
  const [lbIndex,  setLbIndex]  = useState(null)
  const [dragging, setDragging] = useState(false)
  const [gridSize, setGridSize] = useState(GRID_DEFAULT)

  const { files, subFolders, sidebarFolders, rootFolders, treeItems } = useAlbums(media, navPath, sortKey)

  const hasMedia     = media.length > 0
  const lightboxOpen = lbIndex !== null
  const lightboxItem = lightboxOpen ? files[lbIndex] ?? null : null
  const canGoUp      = navPath.length > 0

  const imgCount = media.filter(m => m.kind === 'image').length
  const vidCount = media.filter(m => m.kind === 'video').length
  const audCount = media.filter(m => m.kind === 'audio').length

  const currentLabel = navPath.length > 0 ? navPath[navPath.length - 1] : ''
  const statusText = !hasMedia
    ? 'Ready — open a folder to begin'
    : `${files.length.toLocaleString()} files${currentLabel ? ` in "${currentLabel}"` : ''}`

  const handleNavigate = useCallback((name) => {
    setNavPath(p => [...p, name])
    setLbIndex(null)
  }, [])

  const handleNavToPath = useCallback((path) => {
    setNavPath(path)
    setLbIndex(null)
  }, [])

  const handleGoUp = useCallback(() => {
    setNavPath(p => p.slice(0, -1))
    setLbIndex(null)
  }, [])

  const handleWheel = useCallback((e) => {
    if (!lightboxOpen) return
    e.preventDefault()
    setLbIndex(i => e.deltaY > 0
      ? (i + 1) % files.length
      : (i - 1 + files.length) % files.length
    )
  }, [lightboxOpen, files.length])

  const handleIngest = useCallback((fileList) => {
    const valid = [...fileList].filter(f =>
      !f.name.startsWith('.') &&
      (f.type.startsWith('image/') || f.type.startsWith('video/') || f.type.startsWith('audio/'))
    )
    if (valid.length > FILE_LIMIT) {
      if (!window.confirm(
        `You're opening ${valid.length.toLocaleString()} files.\n\nPapi works best under ${FILE_LIMIT.toLocaleString()} files.\n\nContinue anyway?`
      )) return
    }
    ingest(fileList)
    setNavPath([])
    setLbIndex(null)
  }, [ingest])

  return (
    <div className="h-screen flex flex-col bg-black text-gray-200 overflow-hidden">

      <Toolbar
        onOpenFolder={handleIngest}
        onGoUp={handleGoUp}
        canGoUp={canGoUp}
        sortKey={sortKey}
        onSortChange={setSortKey}
        gridSize={gridSize}
        onGridSizeChange={setGridSize}
        activeAlbum={currentLabel}
        albumFileCount={files.length}
      />

      {/* Body: sidebar + main */}
      <div className="flex flex-1 overflow-hidden">

        {hasMedia && (
          <AlbumSidebar
            treeItems={treeItems}
            navPath={navPath}
            onNavToPath={handleNavToPath}
            rootFolders={rootFolders}
          />
        )}

        <main
          className="flex-1 overflow-y-auto"
          onWheelCapture={lightboxOpen ? handleWheel : undefined}
        >
          {!hasMedia ? (
            /* Drop / Empty state */
            <label
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => {
                e.preventDefault(); setDragging(false)
                handleIngest([...e.dataTransfer.files])
              }}
              className={`flex flex-col items-center justify-center gap-4 cursor-pointer
                          h-full border-2 border-dashed rounded-xl mx-8 my-8
                          transition-all duration-200
                          ${dragging
                            ? 'border-blue-500 bg-blue-600/5'
                            : 'border-zinc-800 hover:border-zinc-600'
                          }`}
            >
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   strokeWidth="1.5" strokeLinecap="round" className="text-zinc-600">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                <line x1="12" y1="11" x2="12" y2="17"/>
                <polyline points="9 14 12 11 15 14"/>
              </svg>
              <div className="text-center">
                <p className="text-base font-semibold text-zinc-300">Open a folder</p>
                <p className="text-sm text-zinc-600 mt-1">Click here or drag &amp; drop a folder</p>
              </div>
              <button
                type="button"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm
                           font-medium rounded transition-colors pointer-events-none"
              >
                Choose Folder
              </button>
              <p className="text-xs text-zinc-700 tracking-wide">
                JPEG · PNG · GIF · WebP · MP4 · MOV · WebM · MP3 · WAV · FLAC · AAC
              </p>
              <input
                type="file" multiple accept="image/*,video/*,audio/*"
                onChange={e => handleIngest([...e.target.files])}
                // @ts-ignore
                webkitdirectory=""
                className="hidden"
              />
            </label>

          ) : (
            /* Folders + files together */
            <div className="p-4 space-y-6">
              {/* Sub-folder icon grid */}
              {subFolders.length > 0 && (
                <div>
                  {files.length > 0 && (
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-2">Folders</p>
                  )}
                  <div className="grid gap-2"
                       style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${gridSize}px, 1fr))` }}>
                    {subFolders.map(name => {
                      const sf = sidebarFolders.find(s => s.name === name)
                      return (
                        <button
                          key={name}
                          onClick={() => handleNavigate(name)}
                          className="flex flex-col items-center gap-2 p-4
                                     bg-zinc-900 border border-zinc-800 rounded-xl
                                     hover:border-blue-500/50 hover:bg-zinc-800
                                     transition-all duration-150 group"
                        >
                          <span
                            className="group-hover:scale-110 transition-transform duration-150"
                            style={{ fontSize: Math.max(32, gridSize * 0.28) + 'px' }}
                          >
                            📁
                          </span>
                          <span className="text-xs font-medium text-zinc-300 truncate w-full text-center">{name}</span>
                          <span className="text-[10px] text-zinc-600">{sf?.count?.toLocaleString()} files</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Media files */}
              {files.length > 0 && (
                <div>
                  {subFolders.length > 0 && (
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-2">Files</p>
                  )}
                  <MediaGrid
                    grouped={{ [currentLabel || 'All']: files }}
                    flatItems={files}
                    getUrl={getUrl}
                    onCardClick={(_, idx) => setLbIndex(idx)}
                    gridSize={gridSize}
                    gridSize={gridSize}
                  />
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Status bar */}
      <div className="flex-shrink-0 flex items-center justify-between
                      px-3 h-7 bg-zinc-900 border-t border-zinc-800 text-xs text-zinc-500">
        <span>{statusText}</span>
        <div className="flex items-center gap-4">
          {hasMedia && (
            <span>
              <span className="text-zinc-400">{imgCount.toLocaleString()}</span> img ·{' '}
              <span className="text-zinc-400">{vidCount.toLocaleString()}</span> vid ·{' '}
              <span className="text-zinc-400">{audCount.toLocaleString()}</span> audio
            </span>
          )}
          <span className="hidden sm:flex items-center gap-3">
            <span><kbd className="px-1 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-[10px]">←→</kbd> navigate</span>
            <span><kbd className="px-1 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-[10px]">Backspace</kbd> up</span>
            <span><kbd className="px-1 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-[10px]">Esc</kbd> close</span>
          </span>
        </div>
      </div>

      <Lightbox
        isOpen={lightboxOpen}
        item={lightboxItem}
        getUrl={getUrl}
        index={lbIndex ?? 0}
        total={files.length}
        onClose={() => setLbIndex(null)}
        onPrev={() => setLbIndex(i => (i - 1 + files.length) % files.length)}
        onNext={() => setLbIndex(i => (i + 1) % files.length)}
        onWheel={handleWheel}
      />

      {progress.loading && (
        <IngestionProgress current={progress.current} total={progress.total} />
      )}
    </div>
  )
}
