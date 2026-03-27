// src/components/MediaCard.jsx
// Papi — Atom · Single media file card

import { useInView } from 'react-intersection-observer'
import { extOf, fmtSize } from '../utils/fileHelpers'

const KIND_BADGE = {
  image: 'bg-violet-600/70 text-white',
  video: 'bg-amber-500/80 text-black',
  audio: 'bg-emerald-500/80 text-black',
}

const KIND_ICON = {
  video: '🎬',
  audio: '🎵',
}

/**
 * MediaCard — displays a single image, video, or audio file.
 *
 * Usage Guideline
 * ✅ Use inside MediaGrid for browsing a flat or grouped list of files.
 * ❌ Don't use standalone outside a grid context — it has no fixed width.
 * ❌ Don't pass a pre-created object URL; let getUrl handle lazy creation.
 *
 * @param {{ item: import('../hooks/useIngestFiles').MediaItem, getUrl: Function, onClick: Function }} props
 */
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
        <div className="w-full aspect-square bg-zinc-800">
          {inView && (
            <img
              src={getUrl(item)}
              alt={item.name}
              className="w-full h-full object-cover"
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

      {/* File type badge */}
      <span className={`absolute top-2 right-2 text-[9px] font-bold uppercase
                        tracking-wide px-1.5 py-0.5 rounded backdrop-blur-md
                        ${KIND_BADGE[item.kind]}`}>
        {extOf(item.name)}
      </span>

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

      {/* Info */}
      <div className="px-2.5 py-2">
        <p className="text-xs text-zinc-100 truncate leading-snug">{item.name}</p>
        <p className="text-[10px] text-zinc-500 mt-0.5">{fmtSize(item.size)}</p>
      </div>
    </div>
  )
}
