// src/hooks/useZoomPan.js
// Papi — zoom + pan for the Lightbox image stage
//
// Gesture contract (kept deliberately narrow so plain scroll stays "navigate"):
//   · hold RIGHT mouse button + scroll  → zoom in / out, anchored at the cursor
//   · right-click twice, quickly        → reset zoom
//   · left-drag (only while zoomed)     → pan
//   · double-click                      → toggle 1x ⇄ 2x at the cursor
//   · + / = / - / _ / 0                 → zoom in / out / reset

import { useState, useCallback, useRef, useEffect } from 'react'

const MIN_SCALE = 1        // 1 = fit; we never zoom out past the fitted image
const MAX_SCALE = 8
const WHEEL_K   = 0.002    // wheel delta → zoom factor sensitivity
const KEY_STEP  = 1.25
const DBL_SCALE = 2
const PAN_SLOP  = 4        // px of movement before a drag counts as a pan
const DBL_RIGHT_MS = 400   // max gap between two right-clicks that counts as "double"

const clampScale = (s) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s))

// Normalise wheel deltas across deltaMode (pixel / line / page).
const pixelDelta = (e) =>
  e.deltaMode === 1 ? e.deltaY * 16 :
  e.deltaMode === 2 ? e.deltaY * 100 :
  e.deltaY

/**
 * @param {React.RefObject<HTMLElement>} stageRef    - the clipping container
 * @param {React.RefObject<HTMLElement>} contentRef  - the transformed element (the <img>)
 * @param {boolean}                      active      - only bind while the image stage is live
 *
 * @returns {{
 *   scale: number,
 *   pan: { x: number, y: number },
 *   transform: string,
 *   isZoomed: boolean,
 *   isPanning: boolean,
 *   zoomIn:  () => void,
 *   zoomOut: () => void,
 *   reset:   () => void,
 *   onMouseDown:    (e) => void,
 *   onDoubleClick:  (e) => void,
 *   onContextMenu:  (e) => void,
 *   onClickCapture: (e) => void,
 * }}
 */
export function useZoomPan(stageRef, contentRef, active = true) {
  const [view,    setView]    = useState({ scale: 1, x: 0, y: 0 })
  const [panning, setPanning] = useState(false)

  const rightDown   = useRef(false)   // right mouse button currently held
  const lastRightUp = useRef(0)       // timestamp of the last right-button release
  const dragging  = useRef(false)
  const moved     = useRef(false)   // drag travelled past PAN_SLOP → swallow the click
  const dragStart = useRef({ x: 0, y: 0 })
  const panStart  = useRef({ x: 0, y: 0 })

  // Keep the image from being dragged off-stage: at most half the overflow per axis.
  const clampPan = useCallback((x, y, scale) => {
    const stage   = stageRef.current
    const content = contentRef.current
    if (!stage || !content) return { x, y }
    const maxX = Math.max(0, (content.offsetWidth  * scale - stage.clientWidth)  / 2)
    const maxY = Math.max(0, (content.offsetHeight * scale - stage.clientHeight) / 2)
    return {
      x: Math.min(maxX, Math.max(-maxX, x)),
      y: Math.min(maxY, Math.max(-maxY, y)),
    }
  }, [stageRef, contentRef])

  const reset = useCallback(() => setView({ scale: 1, x: 0, y: 0 }), [])

  /** Scale by `factor`, keeping the content point under (clientX, clientY) put. */
  const zoomAt = useCallback((factor, clientX, clientY) => {
    setView(v => {
      const scale = clampScale(v.scale * factor)
      if (scale === v.scale) return v

      const stage = stageRef.current
      let x = v.x, y = v.y
      if (stage) {
        // Cursor offset from the stage centre (the transform-origin).
        const r  = stage.getBoundingClientRect()
        const cx = clientX - r.left - r.width  / 2
        const cy = clientY - r.top  - r.height / 2
        const k  = scale / v.scale
        x = cx - (cx - v.x) * k
        y = cy - (cy - v.y) * k
      }
      const p = clampPan(x, y, scale)
      return { scale, x: p.x, y: p.y }
    })
  }, [stageRef, clampPan])

  /** Zoom about the middle of the stage — used by the keyboard and the buttons. */
  const zoomCentered = useCallback((factor) => {
    const r = stageRef.current?.getBoundingClientRect()
    zoomAt(factor, r ? r.left + r.width / 2 : 0, r ? r.top + r.height / 2 : 0)
  }, [stageRef, zoomAt])

  const zoomIn  = useCallback(() => zoomCentered(KEY_STEP),     [zoomCentered])
  const zoomOut = useCallback(() => zoomCentered(1 / KEY_STEP), [zoomCentered])

  // Track the right button globally: a press that starts anywhere still arms the
  // gesture, and a release outside the window must disarm it. Two quick releases
  // in a row (a "double right-click", with no drag/zoom needed in between) reset
  // the zoom — handy when the wheel isn't in reach (trackpads, remote desktops).
  useEffect(() => {
    if (!active) return
    const onDown = (e) => { if (e.button === 2) rightDown.current = true }
    const onUp   = (e) => {
      if (e.button !== 2) return
      rightDown.current = false
      const now = performance.now()
      if (now - lastRightUp.current < DBL_RIGHT_MS) {
        lastRightUp.current = 0
        reset()
      } else {
        lastRightUp.current = now
      }
    }
    const onBlur = ()  => { rightDown.current = false }

    window.addEventListener('mousedown', onDown, true)
    window.addEventListener('mouseup',   onUp,   true)
    window.addEventListener('blur',      onBlur)
    return () => {
      rightDown.current = false
      window.removeEventListener('mousedown', onDown, true)
      window.removeEventListener('mouseup',   onUp,   true)
      window.removeEventListener('blur',      onBlur)
    }
  }, [active, reset])

  // Right-button + wheel → zoom. Native + non-passive so preventDefault sticks,
  // and stopPropagation keeps the wheel away from the lightbox's navigation.
  // A plain wheel is left alone and still flips to the next/previous item.
  useEffect(() => {
    const el = stageRef.current
    if (!el || !active) return
    const onWheel = (e) => {
      // `buttons` is authoritative when present; the ref covers browsers that
      // drop it on wheel events.
      if (!(rightDown.current || (e.buttons & 2))) return
      e.preventDefault()
      e.stopPropagation()
      zoomAt(Math.exp(-pixelDelta(e) * WHEEL_K), e.clientX, e.clientY)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [stageRef, active, zoomAt])

  // Keyboard shortcuts. Ctrl/⌘ combos are left to the browser's own page zoom.
  useEffect(() => {
    if (!active) return
    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (e.key === '+' || e.key === '=')      { e.preventDefault(); zoomIn() }
      else if (e.key === '-' || e.key === '_') { e.preventDefault(); zoomOut() }
      else if (e.key === '0')                  { e.preventDefault(); reset() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active, zoomIn, zoomOut, reset])

  // Left-drag pan — global listeners so the cursor can leave the stage mid-drag.
  useEffect(() => {
    if (!active) return
    const onMouseMove = (e) => {
      if (!dragging.current) return
      const dx = e.clientX - dragStart.current.x
      const dy = e.clientY - dragStart.current.y
      if (!moved.current && Math.hypot(dx, dy) > PAN_SLOP) moved.current = true
      setView(v => {
        const p = clampPan(panStart.current.x + dx, panStart.current.y + dy, v.scale)
        return { scale: v.scale, x: p.x, y: p.y }
      })
    }
    const onMouseUp = () => {
      if (!dragging.current) return
      dragging.current = false
      setPanning(false)
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup',   onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup',   onMouseUp)
    }
  }, [active, clampPan])

  // Only the left button pans, and only once zoomed — otherwise a click on the
  // backdrop must stay a plain click (which closes the lightbox).
  const onMouseDown = useCallback((e) => {
    if (e.button !== 0 || view.scale <= 1) return
    e.preventDefault()
    dragging.current = true
    moved.current    = false
    dragStart.current = { x: e.clientX, y: e.clientY }
    panStart.current  = { x: view.x, y: view.y }
    setPanning(true)
  }, [view])

  const onDoubleClick = useCallback((e) => {
    if (view.scale > 1) reset()
    else zoomAt(DBL_SCALE, e.clientX, e.clientY)
  }, [view.scale, reset, zoomAt])

  // Suppress the native menu on the stage: on macOS `contextmenu` fires on
  // mousedown, so leaving it alone would pop the menu before any scroll arrives
  // and the zoom gesture could never start.
  const onContextMenu = useCallback((e) => e.preventDefault(), [])

  // Swallow the click that ends a pan so it can't fall through to close.
  const onClickCapture = useCallback((e) => {
    if (!moved.current) return
    moved.current = false
    e.stopPropagation()
  }, [])

  return {
    scale: view.scale,
    pan: { x: view.x, y: view.y },
    transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
    isZoomed: view.scale > 1,
    isPanning: panning,
    zoomIn, zoomOut, reset,
    onMouseDown, onDoubleClick, onContextMenu, onClickCapture,
  }
}
