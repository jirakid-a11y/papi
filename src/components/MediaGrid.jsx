import { useRef, useState, useEffect, useMemo, useCallback } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import MediaCard from './MediaCard'

const GAP      = 8   // px gap between cards
const PAD_X    = 16  // px horizontal padding inside the scroll container
const OVERSCAN = 5   // extra rows to render beyond the visible window

/**
 * VirtualMediaGrid — renders up to 50 000+ items with windowed virtualisation.
 *
 * Scroll is self-contained: the component owns its overflow-y-auto container
 * so that it can fill the remaining flex height in the layout without fighting
 * with an outer scroll element.
 */
export default function MediaGrid({ flatItems, getUrl, onCardClick, gridSize }) {
  const scrollRef    = useRef(null)
  const [width, setWidth] = useState(0)

  // Track container width via ResizeObserver so columns recalculate on resize.
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const ro = new ResizeObserver(entries => {
      setWidth(entries[0].contentRect.width)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Number of columns that fit given the current container width.
  const cols = useMemo(() => {
    const available = width - PAD_X * 2
    return available > 0 ? Math.max(1, Math.floor((available + GAP) / (gridSize + GAP))) : 1
  }, [width, gridSize])

  // Group flat items into rows of `cols` length.
  const rows = useMemo(() => {
    const result = []
    for (let i = 0; i < flatItems.length; i += cols) {
      result.push(flatItems.slice(i, i + cols))
    }
    return result
  }, [flatItems, cols])

  const virtualizer = useVirtualizer({
    count:            rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize:     () => gridSize + GAP,   // initial estimate per row
    measureElement:   el => el ? el.getBoundingClientRect().height : gridSize,
    overscan:         OVERSCAN,
  })

  // Stable click handler factory to avoid anonymous functions per card.
  const handleClick = useCallback((item, idx) => () => onCardClick(item, idx), [onCardClick])

  if (!flatItems.length) {
    return (
      <div className="h-full flex items-center justify-center text-zinc-600 text-sm italic">
        No files
      </div>
    )
  }

  return (
    <div
      ref={scrollRef}
      className="h-full overflow-y-auto"
      // Scrollbar gutter reserved so grid doesn't jump on appearance
      style={{ scrollbarGutter: 'stable' }}
    >
      {/* Total height placeholder — keeps the scrollbar correctly sized */}
      <div style={{ height: virtualizer.getTotalSize(), width: '100%', position: 'relative' }}>
        {virtualizer.getVirtualItems().map(vRow => {
          const rowItems = rows[vRow.index]
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
              <div
                style={{
                  display:               'grid',
                  gridTemplateColumns:   `repeat(${cols}, minmax(0, 1fr))`,
                  gap:                   GAP,
                }}
              >
                {rowItems.map((item, colIdx) => {
                  const flatIdx = vRow.index * cols + colIdx
                  return (
                    <MediaCard
                      key={item.id}
                      item={item}
                      getUrl={getUrl}
                      onClick={handleClick(item, flatIdx)}
                    />
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
