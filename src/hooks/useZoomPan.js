// src/hooks/useZoomPan.js
// Papi — zoom + drag pan for the Lightbox image stage

import { useState, useCallback, useRef, useEffect } from 'react'

const MIN_SCALE = 0.5
const MAX_SCALE = 8
const STEP      = 0.25

/**
 * @param {React.RefObject} stageRef  - ref on the container div
 * @param {boolean}         active    - only bind events when lightbox is open
 *
 * @returns {{
 *   scale: number,
 *   pan: { x: number, y: number },
 *   transform: string,           // ready-to-use CSS transform string
 *   zoomIn:  () => void,
 *   zoomOut: () => void,
 *   reset:   () => void,
 *   onMouseDown: (e) => void,    // bind to stage
 * }}
 */
export function useZoomPan(stageRef, active = true) {
  const [scale, setScale] = useState(1)
  const [pan,   setPan]   = useState({ x: 0, y: 0 })

  const isDragging = useRef(false)
  const dragStart  = useRef({ x: 0, y: 0 })
  const panStart   = useRef({ x: 0, y: 0 })
  const lastDist   = useRef(null)

  const clampScale = (s) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s))

  const reset = useCallback(() => {
    setScale(1)
    setPan({ x: 0, y: 0 })
  }, [])

  const zoomIn  = useCallback(() => setScale(s => clampScale(s + STEP)), [])
  const zoomOut = useCallback(() => setScale(s => clampScale(s - STEP)), [])

  // Mouse wheel zoom
  useEffect(() => {
    const el = stageRef.current
    if (!el || !active) return
    const onWheel = (e) => {
      e.preventDefault()
      setScale(s => clampScale(s + (e.deltaY < 0 ? STEP : -STEP)))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [stageRef, active])

  // Touch pinch zoom
  useEffect(() => {
    const el = stageRef.current
    if (!el || !active) return

    const onTouchMove = (e) => {
      if (e.touches.length !== 2) return
      e.preventDefault()
      const d = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      )
      if (lastDist.current !== null) {
        setScale(s => clampScale(s + (d - lastDist.current) * 0.005))
      }
      lastDist.current = d
    }
    const onTouchEnd = () => { lastDist.current = null }

    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend',  onTouchEnd)
    return () => {
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend',  onTouchEnd)
    }
  }, [stageRef, active])

  // Mouse drag pan — global mousemove/mouseup so dragging outside the stage works
  useEffect(() => {
    if (!active) return
    const onMouseMove = (e) => {
      if (!isDragging.current) return
      setPan({
        x: panStart.current.x + (e.clientX - dragStart.current.x),
        y: panStart.current.y + (e.clientY - dragStart.current.y),
      })
    }
    const onMouseUp = () => { isDragging.current = false }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup',   onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup',   onMouseUp)
    }
  }, [active])

  const onMouseDown = useCallback((e) => {
    isDragging.current = true
    dragStart.current  = { x: e.clientX, y: e.clientY }
    panStart.current   = { ...pan }
  }, [pan])

  const transform = `translate(${pan.x}px, ${pan.y}px) scale(${scale})`

  return { scale, pan, transform, zoomIn, zoomOut, reset, onMouseDown }
}
