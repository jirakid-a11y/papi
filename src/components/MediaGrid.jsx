// src/components/MediaGrid.jsx
// Papi — virtualized grid of folders + media tiles.
//
// Only the rows near the viewport are mounted, so a folder with thousands of
// files no longer creates thousands of DOM nodes (and, with useThumbnails, no
// longer kicks off thousands of concurrent full-res decodes). Tiles are a fixed
// square + label, giving uniform row heights — the virtualizer needs no per-row
// measurement, which keeps scrolling jank-free.

import { useRef, useState, useEffect, useMemo } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import MediaCard from './MediaCard'

const GAP      = 8
const PAD      = 12
const LABEL_H  = 28   // keep in sync with MediaCard label (h-7)
const OVERSCAN = 3

export default function MediaGrid({ folders, files, thumbs, gridSize, onNavigate, onOpen }) {
  const scrollRef = useRef(null)
  const [width, setWidth] = useState(0)

  // Track container width (rAF-debounced so a resize drag doesn't thrash).
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    let raf = null
    const ro = new ResizeObserver(entries => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => setWidth(entries[0].contentRect.width))
    })
    ro.observe(el)
    return () => { ro.disconnect(); cancelAnimationFrame(raf) }
  }, [])

  const cols = useMemo(() => {
    const avail = width - PAD * 2
    return avail > 0 ? Math.max(1, Math.floor((avail + GAP) / (gridSize + GAP))) : 1
  }, [width, gridSize])

  // Actual tile width once columns stretch to fill (minmax(0,1fr)).
  const tileW = useMemo(() => {
    const avail = width - PAD * 2
    if (avail <= 0) return gridSize
    return (avail - GAP * (cols - 1)) / cols
  }, [width, cols, gridSize])

  const rowH = Math.round(tileW + LABEL_H)  // square thumb + label

  // Folders first, then files — same visual order as before, one flat cell list.
  const cells = useMemo(() => {
    const arr = folders.map(name => ({ type: 'folder', name }))
    files.forEach((item, i) => arr.push({ type: 'file', item, index: i }))
    return arr
  }, [folders, files])

  const rowCount = Math.ceil(cells.length / cols)

  const virtualizer = useVirtualizer({
    count:            rowCount,
    getScrollElement: () => scrollRef.current,
    estimateSize:     () => rowH + GAP,
    overscan:         OVERSCAN,
  })

  // Recompute positions when tile height or column count changes.
  useEffect(() => { virtualizer.measure() }, [rowH, cols, virtualizer])

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto" style={{ scrollbarGutter: 'stable' }}>
      <div style={{ height: virtualizer.getTotalSize(), width: '100%', position: 'relative' }}>
        {virtualizer.getVirtualItems().map(vRow => {
          const start = vRow.index * cols
          const rowCells = cells.slice(start, start + cols)
          return (
            <div
              key={vRow.key}
              style={{
                position:  'absolute',
                top:       0,
                left:      0,
                width:     '100%',
                transform: `translateY(${vRow.start}px)`,
                padding:   `0 ${PAD}px`,
                boxSizing: 'border-box',
              }}
            >
              <div style={{
                display:             'grid',
                gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                gap:                 GAP,
                height:              rowH,
                paddingBottom:       GAP,
                boxSizing:           'content-box',
              }}>
                {rowCells.map(cell =>
                  cell.type === 'folder' ? (
                    <FolderTile key={'dir-' + cell.name} name={cell.name} onNavigate={onNavigate} />
                  ) : (
                    <MediaCard
                      key={cell.item.id}
                      item={cell.item}
                      index={cell.index}
                      onOpen={onOpen}
                      thumbs={thumbs}
                    />
                  )
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function FolderTile({ name, onNavigate }) {
  return (
    <button
      onClick={() => onNavigate(name)}
      className="group h-full flex flex-col rounded-lg overflow-hidden cursor-pointer
                 bg-zinc-900 border border-transparent hover:border-blue-500/60 transition-all duration-150"
    >
      <div className="flex-1 min-h-0 flex items-center justify-center">
        <span className="text-4xl group-hover:scale-110 transition-transform duration-150 leading-none">📁</span>
      </div>
      <div className="h-7 flex items-center justify-center px-2 border-t border-zinc-800 flex-shrink-0 w-full">
        <p className="text-[11px] text-zinc-300 truncate leading-none">{name}</p>
      </div>
    </button>
  )
}
