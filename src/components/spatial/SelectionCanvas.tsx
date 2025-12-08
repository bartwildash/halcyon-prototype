// SelectionCanvas - Canvas overlay for lasso/rectangle multi-selection
// Inspired by Kinopio's PaintSelectCanvas.vue

import { useRef, useCallback, useEffect } from 'react'
import { useSpatialStore } from '../../stores/spatialStore'
import { screenToCanvas } from '../../utils/geometry'
import { isMultiTouch, TouchInteractionManager, isTouchOrLeftClick } from '../../utils/touch'

interface SelectionCanvasProps {
  zoom: number
  scrollX: number
  scrollY: number
  containerRef: React.RefObject<HTMLDivElement>
}

// Drag threshold - must move this many pixels before starting selection
const DRAG_THRESHOLD = 15 // Increased from implicit 0 to 15px

export function SelectionCanvas({ zoom, scrollX, scrollY, containerRef }: SelectionCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawing = useRef(false)
  const hasMoved = useRef(false) // Track if pointer moved beyond threshold
  const startPoint = useRef({ x: 0, y: 0 })
  const currentPoint = useRef({ x: 0, y: 0 })
  const selectionMode = useRef<'rectangle' | 'lasso'>('rectangle')
  const lassoPoints = useRef<{ x: number; y: number }[]>([])

  // Touch interaction management (Kinopio pattern)
  const touchManager = useRef(new TouchInteractionManager())

  const { space, selectCardsInArea, clearSelection } = useSpatialStore()

  // Resize canvas to match viewport
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`

      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.scale(dpr, dpr)
      }
    }

    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  // Draw selection rectangle or lasso
  const drawSelection = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    if (!isDrawing.current) return

    if (selectionMode.current === 'rectangle') {
      // Draw rectangle selection
      const width = currentPoint.current.x - startPoint.current.x
      const height = currentPoint.current.y - startPoint.current.y

      // Selection rectangle
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.6)'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      ctx.strokeRect(startPoint.current.x, startPoint.current.y, width, height)

      // Fill with semi-transparent blue
      ctx.fillStyle = 'rgba(59, 130, 246, 0.1)'
      ctx.fillRect(startPoint.current.x, startPoint.current.y, width, height)
    } else {
      // Draw lasso selection
      if (lassoPoints.current.length < 2) return

      ctx.strokeStyle = 'rgba(59, 130, 246, 0.6)'
      ctx.lineWidth = 2
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'
      ctx.setLineDash([])

      ctx.beginPath()
      ctx.moveTo(lassoPoints.current[0].x, lassoPoints.current[0].y)

      for (let i = 1; i < lassoPoints.current.length; i++) {
        ctx.lineTo(lassoPoints.current[i].x, lassoPoints.current[i].y)
      }

      ctx.stroke()

      // Show closing line back to start
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      ctx.moveTo(
        lassoPoints.current[lassoPoints.current.length - 1].x,
        lassoPoints.current[lassoPoints.current.length - 1].y
      )
      ctx.lineTo(lassoPoints.current[0].x, lassoPoints.current[0].y)
      ctx.stroke()
    }
  }, [])

  // Handle pointer down - start selection
  const handlePointerDown = useCallback(
    (e: PointerEvent) => {
      // Prevent multi-touch conflicts (pinch zoom, etc)
      if (isMultiTouch(e as any)) {
        touchManager.current.cancel()
        return
      }

      // Only valid touch/left-click
      if (!isTouchOrLeftClick(e)) return

      // Only start selection if clicking empty space (not on a card)
      const target = e.target as HTMLElement
      if (target.closest('.spatial-card')) return

      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return

      // Start touch interaction tracking (Kinopio pattern)
      touchManager.current.start(e as any)

      isDrawing.current = true
      hasMoved.current = false // Reset movement flag
      startPoint.current = { x: e.clientX, y: e.clientY }
      currentPoint.current = { x: e.clientX, y: e.clientY }

      // Determine selection mode based on modifier keys
      selectionMode.current = e.shiftKey ? 'lasso' : 'rectangle'

      if (selectionMode.current === 'lasso') {
        lassoPoints.current = [{ x: e.clientX, y: e.clientY }]
      }

      // Don't draw until threshold is exceeded
    },
    [containerRef]
  )

  // Handle pointer move - update selection
  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!isDrawing.current) return

      currentPoint.current = { x: e.clientX, y: e.clientY }

      // Kinopio pattern: Touch must wait 150ms before allowing interaction
      // This prevents accidental selection when trying to pan
      if (!touchManager.current.canInteract()) {
        return // Touch hasn't been held long enough
      }

      // Check if movement exceeds threshold
      if (!hasMoved.current) {
        const dx = e.clientX - startPoint.current.x
        const dy = e.clientY - startPoint.current.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance > DRAG_THRESHOLD) {
          hasMoved.current = true
        } else {
          // Haven't moved enough yet, don't draw
          return
        }
      }

      if (selectionMode.current === 'lasso') {
        lassoPoints.current.push({ x: e.clientX, y: e.clientY })
      }

      drawSelection()
    },
    [drawSelection]
  )

  // Handle pointer up - complete selection
  const handlePointerUp = useCallback(() => {
    if (!isDrawing.current) return

    // Reset touch manager
    touchManager.current.reset()

    // If pointer was never moved beyond threshold, don't select anything
    if (!hasMoved.current) {
      isDrawing.current = false
      lassoPoints.current = []
      return
    }

    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect || !space) return

    if (selectionMode.current === 'rectangle') {
      // Convert screen rectangle to canvas coordinates
      const canvasStart = screenToCanvas(
        startPoint.current.x - rect.left,
        startPoint.current.y - rect.top,
        zoom,
        scrollX,
        scrollY
      )

      const canvasEnd = screenToCanvas(
        currentPoint.current.x - rect.left,
        currentPoint.current.y - rect.top,
        zoom,
        scrollX,
        scrollY
      )

      const left = Math.min(canvasStart.x, canvasEnd.x)
      const right = Math.max(canvasStart.x, canvasEnd.x)
      const top = Math.min(canvasStart.y, canvasEnd.y)
      const bottom = Math.max(canvasStart.y, canvasEnd.y)

      // Select all cards within rectangle
      const cardsInArea = space.cards.filter((card) => {
        return (
          card.x >= left &&
          card.x <= right &&
          card.y >= top &&
          card.y <= bottom
        )
      })

      if (cardsInArea.length > 0) {
        // Use store action to select cards
        if (selectCardsInArea) {
          selectCardsInArea(cardsInArea.map((c) => c.id))
        }
      }
    } else {
      // Lasso selection - check if cards are inside polygon
      const canvasLassoPoints = lassoPoints.current.map((p) =>
        screenToCanvas(p.x - rect.left, p.y - rect.top, zoom, scrollX, scrollY)
      )

      const cardsInLasso = space.cards.filter((card) =>
        isPointInPolygon(card.x, card.y, canvasLassoPoints)
      )

      if (cardsInLasso.length > 0 && selectCardsInArea) {
        selectCardsInArea(cardsInLasso.map((c) => c.id))
      }
    }

    // Clear drawing state
    isDrawing.current = false
    lassoPoints.current = []

    // Clear canvas
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
  }, [zoom, scrollX, scrollY, space, selectCardsInArea])

  // Attach event listeners
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)

    return () => {
      container.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [handlePointerDown, handlePointerMove, handlePointerUp])

  return (
    <canvas
      ref={canvasRef}
      className="selection-canvas"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 1000,
      }}
    />
  )
}

// Point-in-polygon test (ray casting algorithm)
function isPointInPolygon(x: number, y: number, polygon: { x: number; y: number }[]): boolean {
  let inside = false

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x
    const yi = polygon[i].y
    const xj = polygon[j].x
    const yj = polygon[j].y

    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi

    if (intersect) inside = !inside
  }

  return inside
}
