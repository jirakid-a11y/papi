// src/components/MediaCard.jsx
// Papi — Finder-style: no badge, no label, hover-only info

import { useEffect, useRef, useState, memo } from 'react'
import { fmtSize } from '../utils/fileHelpers'

// Shared IntersectionObserver for all cards
const callbackMap = new Map()
let sharedObserver = null

function getObserver() {
  if (!sharedObserver) {
    sharedObserver = new IntersectionObserver(
      entries => entries.forEach(e => {
        const cb = callbackMap.get(e.target)
        if (cb) cb(e.isIntersecting)
      }),
      { rootMargin: '300px' }
    )
  }
  return sharedObserver
}

function useInView() {
  const ref    = useRef(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || inView) return
    const obs = getObserver()
    callbackMap.set(el, visible => {
      if (visible) { setInView(true); obs.unobserve(el); callbackMap.delete(el) }
    })
    obs.observe(el)
    return () => { obs.unobserve(el); callbackMap.delete(el) }
  }, [inView])
  return { ref, inView }
}

const MediaCard = memo(function MediaCard({ item, getUrl, onClick }) {
  const { ref, inView } = useInView()

  return (
    <div
      ref={ref}
      onClick={onClick}
      className="group relative rounded-lg overflow-hidden cursor-pointer select-none
                 bg-zinc-900 border border-transparent
                 hover:border-blue-500/60 transition-all duration-150"
      style={{ aspectRatio: '1' }}
    >
      {/* Thumbnail — no badge, no label */}
      {item.kind === 'image' ? (
        inView
          ? <img src={getUrl(item)} alt="" draggable={false} decoding="async"
                 className="w-full h-full object-cover" />
          : <div className="w-full h-full bg-zinc-800" />
      ) : (
        <div className="w-full h-full bg-zinc-800 flex flex-col items-center justify-center gap-2">
          <span className="text-4xl">{item.kind === 'video' ? '🎬' : '🎵'}</span>
        </div>
      )}

      {/* Hover overlay — filename + size only on hover */}
      <div className="absolute inset-x-0 bottom-0
                      opacity-0 group-hover:opacity-100 transition-opacity duration-150
                      bg-gradient-to-t from-black/80 via-black/40 to-transparent
                      pt-6 pb-2 px-2 pointer-events-none">
        <p className="text-xs font-medium text-white truncate leading-tight">{item.name}</p>
        <p className="text-[10px] text-zinc-400 mt-0.5">{fmtSize(item.size)}</p>
      </div>

      {/* Play icon for video/audio */}
      {item.kind !== 'image' && (
        <div className="absolute inset-0 flex items-center justify-center
                        opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
            <span className="text-black text-sm pl-0.5">▶</span>
          </div>
        </div>
      )}

      {/* Blue selection ring on hover */}
      <div className="absolute inset-0 rounded-lg ring-2 ring-inset ring-transparent
                      group-hover:ring-blue-500/40 transition-all duration-150 pointer-events-none" />
    </div>
  )
})

export default MediaCard