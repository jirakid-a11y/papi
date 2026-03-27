// src/components/Lightbox.jsx
// Papi — Organism · Fullscreen media viewer with mouse-wheel navigation

import { useEffect } from 'react'
import { fmtSize, extOf } from '../utils/fileHelpers'

/**
 * Lightbox
 *
 * Usage Guideline
 * ✅ Use for fullscreen preview of a single media item within a navigable list.
 * ✅ Mouse wheel scrolls to next/previous item.
 * ❌ No zoom/pan — keep the lightbox focused on browsing, not editing.
 *
 * @param {{
 *   isOpen:   boolean,
 *   item:     import('../hooks/useIngestFiles').MediaItem | null,
 *   getUrl:   Function,
 *   index:    number,
 *   total:    number,
 *   onClose:  () => void,
 *   onPrev:   () => void,
 *   onNext:   () => void,
 *   onWheel:  (e: WheelEvent) => void,
 * }} props
 */
export default function Lightbox({ isOpen, item, getUrl, index, total, onClose, onPrev, onNext, onWheel }) {

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => {
      if (e.key === 'Escape')     onClose()
      if (e.key === 'ArrowLeft')  onPrev()
      if (e.key === 'ArrowRight') onNext()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose, onPrev, onNext])

  if (!isOpen || !item) return null

  const url = getUrl(item)

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/92 backdrop-blur-xl"
      onWheel={onWheel}
    >
      {/* Top bar */}
      <div className="flex items-center gap-3 px-5 py-3
                      bg-gradient-to-b from-black/70 to-transparent
                      absolute top-0 left-0 right-0 z-10">
        <span className="text-sm font-medium text-zinc-100 flex-1 truncate">{item.name}</span>
        <span className="text-xs text-zinc-500">{fmtSize(item.size)} · {extOf(item.name)}</span>
        <button
          onClick={onClose}
          className="text-xs text-red-400 border border-red-400/30 px-3 py-1.5
                     rounded-lg hover:bg-red-400/10 transition-colors"
        >
          ✕ Close
        </button>
      </div>

      {/* Stage */}
      <div
        className="flex-1 flex items-center justify-center overflow-hidden"
        onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      >
        {item.kind === 'image' && (
          <img
            src={url}
            alt={item.name}
            draggable={false}
            className="max-w-[90vw] max-h-[85vh] rounded-lg shadow-2xl object-contain select-none"
          />
        )}

        {item.kind === 'video' && (
          <video
            key={url}
            src={url}
            controls
            autoPlay
            className="max-w-[90vw] max-h-[85vh] rounded-lg shadow-2xl outline-none"
          />
        )}

        {item.kind === 'audio' && (
          <div className="flex flex-col items-center gap-5 p-12
                          bg-zinc-900 border border-zinc-700/50 rounded-2xl shadow-2xl min-w-72">
            <span className="text-6xl">🎵</span>
            <p className="text-sm font-medium text-zinc-100 text-center">{item.name}</p>
            <audio key={url} src={url} controls autoPlay className="w-full" />
          </div>
        )}
      </div>

      {/* Prev / Next arrows */}
      {total > 1 && (
        <>
          <button
            onClick={onPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2
                       w-11 h-11 rounded-full bg-black/50 border border-zinc-700/50
                       text-white text-xl grid place-items-center
                       hover:bg-white/15 transition-colors backdrop-blur-sm"
          >‹</button>
          <button
            onClick={onNext}
            className="absolute right-4 top-1/2 -translate-y-1/2
                       w-11 h-11 rounded-full bg-black/50 border border-zinc-700/50
                       text-white text-xl grid place-items-center
                       hover:bg-white/15 transition-colors backdrop-blur-sm"
          >›</button>
        </>
      )}

      {/* Scroll hint + counter */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
        <p className="text-[10px] text-zinc-600">scroll to navigate</p>
        <p className="text-xs text-zinc-500">{index + 1} / {total}</p>
      </div>
    </div>
  )
}