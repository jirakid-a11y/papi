import { useRef, useState, useEffect, useMemo } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import MediaCard from './MediaCard'

const GAP      = 8
const PAD_X    = 16
const OVERSCAN = 3

export default function MediaGrid({ flatItems, getUrl, onCardClick, gridSize }) {
  const scrollRef = useRef(null)
  const [width, setWidth] = useState(0)

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
    const available = width - PAD_X * 2
    return available > 0 ? Math.max(1, Math.floor((available + GAP) / (gridSize + GAP))) : 1
  }, [width, gridSize])

  const rowCount = Math.ceil(flatItems.length / cols)

  const virtualizer = useVirtualizer({
    count:            rowCount,
    getScrollElement: () => scrollRef.current,
    estimateSize:     () => gridSize + GAP,
    measureElement:   el => el ? el.getBoundingClientRect().height : gridSize,
    overscan:         OVERSCAN,
  })

  if (!flatItems.length) {
    return (
      <div className="h-full flex items-center justify-center text-zinc-600 text-sm italic">
        No files
      </div>
    )
  }

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto" style={{ scrollbarGutter: 'stable' }}>
      <div style={{ height: virtualizer.getTotalSize(), width: '100%', position: 'relative' }}>
        {virtualizer.getVirtualItems().map(vRow => {
          const startIdx = vRow.index * cols
          const endIdx   = Math.min(startIdx + cols, flatItems.length)

          return (
            <div
              key={vRow.key}
              data-index={vRow.index}
              ref={virtualizer.measureElement}
              style={{
                position:  'absolute',
                top:       0,
                left:      0,
                width:     '100%',
                transform: `translateY(${vRow.start}px)`,
                padding:   `0 ${PAD_X}px ${GAP}px`,
                boxSizing: 'border-box',
              }}
            >
              <div style={{
                display:             'grid',
                gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                gap:                 GAP,
              }}>
                {flatItems.slice(startIdx, endIdx).map((item, colIdx) => (
                  <MediaCard
                    key={item.id}
                    item={item}
                    getUrl={getUrl}
                    onClick={() => onCardClick(item, startIdx + colIdx)}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
