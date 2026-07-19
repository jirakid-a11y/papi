// src/components/MediaCard.jsx
// Papi — one grid tile. Renders a cached thumbnail (never the full-res original)
// so scrolling never pays a full-resolution decode.
//
// Because the grid is virtualized, a mounted card is already near the viewport —
// mounting is our "on reveal" signal, so we request thumbnail generation here.
// - image: queued to the worker pool (useThumbnails)
// - video: a poster frame is captured once via an offscreen <video> (needs the
//          DOM, so it can't run in the worker) and stored in the same cache
// - audio: static icon, no thumbnail
//
// On unmount (scrolled out of the virtual window) an image request is cancelled
// and any in-progress video load is torn down — so scrolling a huge folder never
// leaves a backlog of work or leaked object URLs behind.

import { memo, useEffect, useSyncExternalStore, useCallback } from 'react'
import { extOf } from '../utils/fileHelpers'

// Keep in sync with LABEL_H in MediaGrid.jsx (h-7 = 28px).
const AUDIO_ICON = '🎵'

function MediaCard({ item, index, onOpen, thumbs }) {
  // Subscribe to this id's thumbnail; re-reads the cache whenever it changes.
  const thumb = useSyncExternalStore(
    useCallback(cb => thumbs.subscribe(item.id, cb), [thumbs, item.id]),
    useCallback(() => thumbs.get(item.id), [thumbs, item.id]),
  )

  // Kick off generation for the visible card.
  useEffect(() => {
    if (item.kind === 'image') {
      thumbs.requestImage(item)
      return () => thumbs.cancel(item.id)   // drop from queue if scrolled away first
    }
    if (item.kind !== 'video') return
    if (thumbs.get(item.id)) return          // already have a poster

    const v = document.createElement('video')
    v.muted = true
    v.preload = 'auto'          // load frame data, not just metadata, so seeking works
    v.playsInline = true
    // Temporary URL just for poster capture — revoked in finish() so scrolling
    // past thousands of videos never accumulates original-file object URLs.
    const url = URL.createObjectURL(item.file)
    let done = false
    let timer = null

    const finish = () => {
      done = true
      clearTimeout(timer)
      try { v.removeAttribute('src'); v.load() } catch { /* noop */ }
      URL.revokeObjectURL(url)
    }
    const capture = () => {
      if (done) return
      if (!v.videoWidth) { finish(); return }   // nothing decodable (e.g. audio-only / unsupported codec)
      try {
        const w = 400
        const h = Math.round(w * (v.videoHeight / v.videoWidth)) || w
        const c = document.createElement('canvas')
        c.width = w; c.height = h
        c.getContext('2d').drawImage(v, 0, 0, w, h)
        c.toBlob(b => { if (b) thumbs.put(item.id, b); finish() }, 'image/jpeg', 0.8)
      } catch {
        finish()
      }
    }

    v.onloadeddata = () => {
      // Seek slightly in to skip an intro black frame; capture once seeked.
      const t = Math.min(1, (v.duration || 0) * 0.1)
      if (t > 0 && Number.isFinite(t)) {
        try { v.currentTime = t } catch { capture() }
      } else {
        capture()
      }
    }
    v.onseeked = capture
    v.onerror  = finish
    // Fallback: if seeking stalls on some codecs, grab whatever frame is ready.
    timer = setTimeout(capture, 3000)
    v.src = url

    return finish
  }, [item, thumbs])

  const showThumb = thumb && item.kind !== 'audio'

  return (
    <div
      onClick={() => onOpen(index)}
      className="group h-full flex flex-col rounded-lg overflow-hidden cursor-pointer select-none
                 bg-zinc-900 border border-zinc-700/50 transition-colors hover:border-zinc-500"
    >
      {/* Square-ish thumbnail area — fills all row height above the label */}
      <div className="relative flex-1 min-h-0 bg-zinc-800">
        {showThumb ? (
          <img
            src={thumb}
            alt={item.name}
            draggable={false}
            className="w-full h-full object-cover block"
          />
        ) : item.kind === 'audio' ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1">
            <span className="text-3xl">{AUDIO_ICON}</span>
            <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
              {extOf(item.name)}
            </span>
          </div>
        ) : (
          /* Placeholder while the thumbnail/poster is being generated */
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-[10px] text-zinc-600 font-semibold uppercase tracking-wider">
              {extOf(item.name)}
            </span>
          </div>
        )}

        {/* Play affordance for video */}
        {item.kind === 'video' && (
          <div className="absolute inset-0 flex items-center justify-center
                          bg-black/0 group-hover:bg-black/40 transition-colors duration-150">
            <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center
                            opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100
                            transition-all duration-150">
              <span className="text-black text-sm pl-0.5">▶</span>
            </div>
          </div>
        )}
      </div>

      {/* File name */}
      <div className="h-7 flex items-center px-2 border-t border-zinc-800 flex-shrink-0">
        <p className="text-[11px] text-zinc-400 truncate leading-none">{item.name}</p>
      </div>
    </div>
  )
}

export default memo(MediaCard)
