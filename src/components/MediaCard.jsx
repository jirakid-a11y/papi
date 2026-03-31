// src/components/MediaCard.jsx
// Papi — Atom · Single media file card

import { useInView } from 'react-intersection-observer'
import { extOf } from '../utils/fileHelpers'

const KIND_ICON = {
  audio: '🎵',
}

export default function MediaCard({ item, getUrl, onClick }) {
  const { ref, inView } = useInView({ triggerOnce: true, rootMargin: '200px' })

  return (
    <div
      ref={ref}
      onClick={onClick}
      className="group relative bg-zinc-900 border border-zinc-700/50 rounded-xl
                 overflow-hidden cursor-pointer select-none
                 transition-all duration-150
                 hover:-translate-y-1 hover:border-zinc-500 hover:shadow-xl hover:shadow-black/50"
    >
      {/* Thumbnail */}
      {item.kind === 'image' ? (
        <div className="w-full bg-zinc-800">
          {inView && (
            <img
              src={getUrl(item)}
              alt={item.name}
              className="w-full h-auto block"
            />
          )}
        </div>
      ) : item.kind === 'video' ? (
        <div className="w-full bg-zinc-900">
          {inView && (
            <video
              src={getUrl(item)}
              muted
              preload="metadata"
              className="w-full h-auto block"
              onLoadedMetadata={e => { e.target.currentTime = 1 }}
            />
          )}
        </div>
      ) : (
        <div className="w-full aspect-square bg-zinc-800 flex flex-col items-center justify-center gap-2">
          <span className="text-4xl">{KIND_ICON[item.kind]}</span>
          <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
            {extOf(item.name)}
          </span>
        </div>
      )}

      {/* Play overlay for video / audio */}
      {item.kind !== 'image' && (
        <div className="absolute inset-0 flex items-center justify-center
                        bg-black/0 group-hover:bg-black/40
                        transition-colors duration-150">
          <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center
                          opacity-0 scale-75
                          group-hover:opacity-100 group-hover:scale-100
                          transition-all duration-150">
            <span className="text-black text-sm pl-0.5">▶</span>
          </div>
        </div>
      )}
    </div>
  )
}
