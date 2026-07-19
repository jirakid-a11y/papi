// src/components/ViewPane.jsx
// Papi — one navigable pane (used for both single and split-view layouts)

import { useState, useCallback, useEffect } from 'react'
import { useAlbums } from '../hooks/useAlbums'
import MediaGrid from './MediaGrid'
import Lightbox from './Lightbox'

export default function ViewPane({ tree, getUrl, thumbs, navPath, setNavPath, sortKey, gridSize, onIngest }) {
  const [lbIndex,  setLbIndex]  = useState(null)
  const [dragging, setDragging] = useState(false)

  const { files, subFolders } = useAlbums(tree, navPath, sortKey)

  const hasMedia     = tree._count > 0
  const lightboxOpen = lbIndex !== null
  const lightboxItem = lightboxOpen ? (files[lbIndex] ?? null) : null
  const canGoUp      = navPath.length > 0

  // Reset lightbox whenever we navigate away
  useEffect(() => { setLbIndex(null) }, [navPath])

  const handleNavigate = useCallback((name) => {
    setNavPath(p => [...p, name])
  }, [setNavPath])

  // Stable handler — avoids defeating MediaCard's memo on every lbIndex change
  const handleCardOpen = useCallback((idx) => setLbIndex(idx), [])

  const handleGoUp = useCallback(() => {
    setNavPath(p => p.slice(0, -1))
  }, [setNavPath])

  const handleBreadcrumb = useCallback((idx) => {
    setNavPath(p => idx < 0 ? [] : p.slice(0, idx + 1))
  }, [setNavPath])

  const handleWheel = useCallback((e) => {
    if (!lightboxOpen) return
    e.preventDefault()
    setLbIndex(i => e.deltaY > 0
      ? (i + 1) % files.length
      : (i - 1 + files.length) % files.length
    )
  }, [lightboxOpen, files.length])

  return (
    <div className="relative flex flex-col flex-1 min-w-0 overflow-hidden">

      {/* ── Path bar ── */}
      <div className="flex items-center gap-1 px-2 h-8 bg-zinc-950 border-b border-zinc-800 flex-shrink-0 min-w-0">
        <button
          onClick={handleGoUp}
          disabled={!canGoUp}
          title="Go up"
          className={`flex items-center justify-center w-6 h-6 rounded flex-shrink-0 transition-colors
                      ${canGoUp
                        ? 'text-zinc-300 hover:bg-zinc-800 cursor-pointer'
                        : 'text-zinc-700 cursor-not-allowed'}`}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="18 15 12 9 6 15"/>
          </svg>
        </button>

        {/* Breadcrumb */}
        <div className="flex items-center min-w-0 overflow-hidden text-xs gap-0.5">
          <button
            onClick={() => handleBreadcrumb(-1)}
            className="text-zinc-400 hover:text-zinc-200 transition-colors flex-shrink-0 px-1.5 py-0.5 rounded hover:bg-zinc-800"
          >
            Home
          </button>
          {navPath.map((seg, idx) => (
            <div key={idx} className="flex items-center gap-0.5 min-w-0">
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="2.5" className="text-zinc-700 flex-shrink-0">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
              {idx < navPath.length - 1 ? (
                <button
                  onClick={() => handleBreadcrumb(idx)}
                  className="text-zinc-400 hover:text-zinc-200 transition-colors truncate px-1.5 py-0.5 rounded hover:bg-zinc-800"
                  style={{ maxWidth: '100px' }}
                >
                  {seg}
                </button>
              ) : (
                <span className="text-zinc-200 font-medium truncate px-1.5" style={{ maxWidth: '160px' }}>
                  {seg}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <main className="flex-1 min-h-0 overflow-hidden">
        {!hasMedia ? (

          /* Drop zone */
          <label
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); onIngest([...e.dataTransfer.files]) }}
            className={`flex flex-col items-center justify-center gap-4 cursor-pointer
                        h-full border-2 border-dashed rounded-xl mx-8 my-8 transition-all duration-200
                        ${dragging ? 'border-blue-500 bg-blue-600/5' : 'border-zinc-800 hover:border-zinc-600'}`}
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
            <button type="button"
              className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded pointer-events-none">
              Choose Folder
            </button>
            <p className="text-xs text-zinc-700 tracking-wide">
              JPEG · PNG · GIF · WebP · MP4 · MOV · WebM · MP3 · WAV · FLAC · AAC
            </p>
            <input type="file" multiple accept="image/*,video/*,audio/*"
              onChange={e => onIngest([...e.target.files])}
              // @ts-ignore
              webkitdirectory="" className="hidden" />
          </label>

        ) : subFolders.length === 0 && files.length === 0 ? (

          /* Empty folder */
          <div className="flex items-center justify-center h-full text-zinc-700 text-sm">
            This folder is empty
          </div>

        ) : (

          /* Mixed grid — folders first, then files (virtualized) */
          <MediaGrid
            folders={subFolders}
            files={files}
            thumbs={thumbs}
            gridSize={gridSize}
            onNavigate={handleNavigate}
            onOpen={handleCardOpen}
          />
        )}
      </main>

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
    </div>
  )
}
