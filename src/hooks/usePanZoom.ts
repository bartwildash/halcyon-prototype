// Pan and Zoom Hook
// Handles canvas navigation: pan via drag, zoom via wheel/pinch

import { useRef, useCallback, useEffect } from 'react'
import { useSpatialStore } from '../stores/spatialStore'
import { clampZoom, zoomTowardPoint } from '../utils/geometry'
import { isMultiTouch } from '../utils/touch'

// Drag threshold before panning starts (prevents accidental pans on click)
const PAN_THRESHOLD = 3

export function usePanZoom(containerRef: React.RefObject<HTMLElement>) {
  const { space, setZoom, setPan, setIsPanning, toolMode } = useSpatialStore()
  const isPanningRef = useRef(false)
  const panThresholdCrossed = useRef(false)
  const lastPanPos = useRef({ x: 0, y: 0 })
  const panStart = useRef({ scrollX: 0, scrollY: 0, clientX: 0, clientY: 0 })
  const pinchDistance = useRef<number | null>(null)

  // Pan via drag (only in hand mode)
  const handlePointerDown = useCallback(
    (e: PointerEvent) => {
      // Only pan in hand mode (or with middle mouse button)
      if (toolMode !== 'hand' && e.button !== 1) return

      // Only pan on middle mouse or left mouse on empty space
      if (e.button !== 0 && e.button !== 1) return

      // Check if clicking on a card or UI element
      const target = e.target as HTMLElement
      if (target.closest('.spatial-card') || target.closest('.spatial-connection')) {
        return
      }

      if (!space) return

      isPanningRef.current = true
      panThresholdCrossed.current = false // Reset threshold
      lastPanPos.current = { x: e.clientX, y: e.clientY }
      // Store starting position to avoid state accumulation issues
      panStart.current = {
        scrollX: space.scrollX,
        scrollY: space.scrollY,
        clientX: e.clientX,
        clientY: e.clientY,
      }
      e.preventDefault()
    },
    [space, toolMode]
  )

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!isPanningRef.current) return

      // Calculate total delta from drag start (more reliable than accumulating)
      const totalDx = e.clientX - panStart.current.clientX
      const totalDy = e.clientY - panStart.current.clientY

      // Check if threshold has been crossed
      if (!panThresholdCrossed.current) {
        const distance = Math.sqrt(totalDx * totalDx + totalDy * totalDy)
        if (distance < PAN_THRESHOLD) {
          return // Haven't moved enough to start panning
        }
        panThresholdCrossed.current = true
        setIsPanning(true) // Now we're actually panning
      }

      setPan(
        panStart.current.scrollX + totalDx,
        panStart.current.scrollY + totalDy
      )

      lastPanPos.current = { x: e.clientX, y: e.clientY }
    },
    [setPan, setIsPanning]
  )

  const handlePointerUp = useCallback(
    () => {
      isPanningRef.current = false
      setIsPanning(false)
    },
    [setIsPanning]
  )

  // Zoom via wheel
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      if (!space) return

      e.preventDefault()

      // Determine zoom delta
      const delta = e.deltaY > 0 ? 0.9 : 1.1
      const oldZoom = space.zoom
      const newZoom = clampZoom(oldZoom * delta)

      if (newZoom === oldZoom) return

      // Zoom toward cursor position
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return

      const cursorX = e.clientX - rect.left
      const cursorY = e.clientY - rect.top

      const newScroll = zoomTowardPoint(
        cursorX,
        cursorY,
        oldZoom,
        newZoom,
        space.scrollX,
        space.scrollY
      )

      setZoom(newZoom)
      setPan(newScroll.x, newScroll.y)
    },
    [space, containerRef, setZoom, setPan]
  )

  // Pinch zoom on mobile
  const handleTouchStart = useCallback((e: TouchEvent) => {
    // Only handle 2-finger pinch (multi-touch)
    if (e.touches.length === 2 && isMultiTouch(e as any)) {
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      const dx = touch2.clientX - touch1.clientX
      const dy = touch2.clientY - touch1.clientY
      pinchDistance.current = Math.sqrt(dx * dx + dy * dy)
    }
  }, [])

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (e.touches.length === 2 && pinchDistance.current && space) {
        e.preventDefault()

        const touch1 = e.touches[0]
        const touch2 = e.touches[1]
        const dx = touch2.clientX - touch1.clientX
        const dy = touch2.clientY - touch1.clientY
        const newDistance = Math.sqrt(dx * dx + dy * dy)

        const scale = newDistance / pinchDistance.current
        const oldZoom = space.zoom
        const newZoom = clampZoom(oldZoom * scale)

        if (newZoom !== oldZoom) {
          // Zoom toward midpoint of touches
          const rect = containerRef.current?.getBoundingClientRect()
          if (!rect) return

          const midX = (touch1.clientX + touch2.clientX) / 2 - rect.left
          const midY = (touch1.clientY + touch2.clientY) / 2 - rect.top

          const newScroll = zoomTowardPoint(
            midX,
            midY,
            oldZoom,
            newZoom,
            space.scrollX,
            space.scrollY
          )

          setZoom(newZoom)
          setPan(newScroll.x, newScroll.y)
        }

        pinchDistance.current = newDistance
      }
    },
    [space, containerRef, setZoom, setPan]
  )

  const handleTouchEnd = useCallback(() => {
    pinchDistance.current = null
  }, [])

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!space) return

      const isCmdOrCtrl = e.metaKey || e.ctrlKey

      if (isCmdOrCtrl && (e.key === '=' || e.key === '+')) {
        e.preventDefault()
        const newZoom = clampZoom(space.zoom * 1.2)
        setZoom(newZoom)
      } else if (isCmdOrCtrl && e.key === '-') {
        e.preventDefault()
        const newZoom = clampZoom(space.zoom * 0.8)
        setZoom(newZoom)
      } else if (isCmdOrCtrl && e.key === '0') {
        e.preventDefault()
        setZoom(1)
        setPan(0, 0)
      }
    },
    [space, setZoom, setPan]
  )

  // Attach event listeners
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    container.addEventListener('wheel', handleWheel, { passive: false })
    container.addEventListener('touchstart', handleTouchStart, { passive: false })
    container.addEventListener('touchmove', handleTouchMove, { passive: false })
    container.addEventListener('touchend', handleTouchEnd)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      container.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      container.removeEventListener('wheel', handleWheel)
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [
    containerRef,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleWheel,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleKeyDown,
  ])

  return {
    zoom: space?.zoom || 1,
    scrollX: space?.scrollX || 0,
    scrollY: space?.scrollY || 0,
  }
}
