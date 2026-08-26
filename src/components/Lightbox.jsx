// src/components/Lightbox.jsx
// Papi — Organism · Fullscreen media viewer with mouse-wheel navigation + slideshow

import { useEffect, useState, useRef } from 'react'
import { fmtSize, extOf } from '../utils/fileHelpers'

const INTERVALS = [0.8, 1, 2, 3, 5, 10]  // seconds between slides
const DEFAULT_INTERVAL = 0.8

/**
 * Lightbox
 *
 * Usage Guideline
 * ✅ Use for fullscreen preview of a single media item within a navigable list.
 * ✅ Mouse wheel scrolls to next/previous item.
 * ✅ Slideshow: auto-advances images on a timer; video/audio advance when they end.
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
  const [playing, setPlaying]         = useState(false)
  const [intervalSec, setIntervalSec] = useState(DEFAULT_INTERVAL)

  // Stop the slideshow when the lightbox closes (render-phase reset — keeps the
  // chosen interval, and avoids autoplaying on the next open).
  const [wasOpen, setWasOpen] = useState(isOpen)
  if (wasOpen !== isOpen) {
    setWasOpen(isOpen)
    if (!isOpen && playing) setPlaying(false)
  }

  // onNext/onPrev are recreated by the parent each render; keep the latest in a
  // ref so the slideshow timer doesn't reset on unrelated re-renders.
  const onNextRef = useRef(onNext)
  useEffect(() => { onNextRef.current = onNext }, [onNext])

  const canSlideshow = total > 1

  // Keyboard: Esc close, ←/→ navigate, Space toggle slideshow.
  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => {
      if (e.key === 'Escape')     onClose()
      if (e.key === 'ArrowLeft')  onPrev()
      if (e.key === 'ArrowRight') onNext()
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault()
        if (canSlideshow) setPlaying(p => !p)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose, onPrev, onNext, canSlideshow])

  // Auto-advance images on a timer. Video/audio advance on their 'ended' event
  // instead (see onEnded below), so a clip is never cut off mid-play.
  useEffect(() => {
    if (!isOpen || !playing || !item || item.kind !== 'image') return
    const t = setTimeout(() => onNextRef.current(), intervalSec * 1000)
    return () => clearTimeout(t)
  }, [isOpen, playing, item, intervalSec])

  if (!isOpen || !item) return null

  const url = getUrl(item)
  const handleEnded = () => { if (playing) onNextRef.current() }

  return (
    <div
      className="absolute inset-0 z-50 flex flex-col bg-black/92 backdrop-blur-sm"
      onWheel={onWheel}
    >
      {/* Top bar */}
      <div className="flex items-center gap-3 px-5 py-3
                      bg-gradient-to-b from-black/70 to-transparent
                      absolute top-0 left-0 right-0 z-10">
        <span className="text-sm font-medium text-zinc-100 flex-1 truncate">{item.name}</span>
        <span className="hidden sm:inline text-xs text-zinc-500">{fmtSize(item.size)} · {extOf(item.name)}</span>

        {/* Slideshow controls */}
        {canSlideshow && (
          <>
            <select
              value={intervalSec}
              onChange={e => setIntervalSec(Number(e.target.value))}
              title="Seconds per slide"
              className="bg-zinc-800/80 border border-zinc-700 text-zinc-200 text-xs
                         rounded px-1.5 py-1 outline-none cursor-pointer focus:border-blue-500"
            >
              {INTERVALS.map(s => <option key={s} value={s}>{s}s</option>)}
            </select>
            <button
              onClick={() => setPlaying(p => !p)}
              title={playing ? 'Pause slideshow (Space)' : 'Play slideshow (Space)'}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors
                          ${playing
                            ? 'bg-blue-600/20 border-blue-500/60 text-blue-300 hover:bg-blue-600/30'
                            : 'border-zinc-600 text-zinc-200 hover:bg-white/10'}`}
            >
              {playing ? (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <rect x="6" y="5" width="4" height="14" rx="1" />
                  <rect x="14" y="5" width="4" height="14" rx="1" />
                </svg>
              ) : (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <polygon points="6 4 20 12 6 20" />
                </svg>
              )}
              {playing ? 'Pause' : 'Slideshow'}
            </button>
          </>
        )}

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
            className="max-w-[90%] max-h-[90%] rounded-lg shadow-2xl object-contain select-none"
          />
        )}

        {item.kind === 'video' && (
          <video
            key={url}
            src={url}
            controls
            autoPlay
            onEnded={handleEnded}
            className="max-w-[90%] max-h-[90%] rounded-lg shadow-2xl outline-none"
          />
        )}

        {item.kind === 'audio' && (
          <div className="flex flex-col items-center gap-5 p-12
                          bg-zinc-900 border border-zinc-700/50 rounded-2xl shadow-2xl min-w-72">
            <span className="text-6xl">🎵</span>
            <p className="text-sm font-medium text-zinc-100 text-center">{item.name}</p>
            <audio key={url} src={url} controls autoPlay onEnded={handleEnded} className="w-full" />
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

      {/* Hint + counter */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
        <p className="text-[10px] text-zinc-600">
          {canSlideshow ? 'space to play · scroll to navigate' : 'scroll to navigate'}
        </p>
        <p className="text-xs text-zinc-500">{index + 1} / {total}</p>
      </div>
    </div>
  )
}
