/**
 * OrbitCard - A spatial card that contains the orbit visualization
 *
 * Renders the orbit system as card content (not a fixed background layer)
 */

import { useRef, useEffect, useState, useCallback } from 'react'
import type { Card } from '../../types/spatial'
import { useSpatialStore } from '../../stores/spatialStore'
import { ConnectionHandle } from './ConnectionHandle'

interface OrbitCardProps {
  card: Card
}

export function OrbitCard({ card }: OrbitCardProps) {
  const {
    selectedCardIds,
    selectCard,
    updateCard,
    moveCard,
    setIsDragging,
    isPanning,
    space,
  } = useSpatialStore()

  const cardRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const nodesRef = useRef<SVGGElement>(null)
  const animationFrameRef = useRef<number | undefined>(undefined)
  const dragStart = useRef({ x: 0, y: 0, cardX: 0, cardY: 0 })
  const dragThresholdCrossed = useRef(false)
  const resizeStart = useRef({ x: 0, y: 0, cardWidth: 0, cardHeight: 0 })
  const jiggleTimeout = useRef<number | undefined>(undefined)

  const [isDragging, setLocalDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [showJiggle, setShowJiggle] = useState(true)

  const isSelected = selectedCardIds.has(card.id)
  const width = card.width || 600
  const height = card.height || 400
  const zoom = space?.zoom || 1

  // Kinopio drag threshold - prevents accidental drags
  const DRAG_THRESHOLD = 5 // pixels

  // Auto-stop jiggle animation after 3500ms
  useEffect(() => {
    if (isSelected) {
      setShowJiggle(true)
      if (jiggleTimeout.current !== undefined) {
        clearTimeout(jiggleTimeout.current)
      }
      jiggleTimeout.current = setTimeout(() => {
        setShowJiggle(false)
      }, 3500) as unknown as number
    } else {
      setShowJiggle(true)
      if (jiggleTimeout.current !== undefined) {
        clearTimeout(jiggleTimeout.current)
      }
    }

    return () => {
      if (jiggleTimeout.current !== undefined) {
        clearTimeout(jiggleTimeout.current)
      }
    }
  }, [isSelected])

  // Orbit animation
  useEffect(() => {
    if (!svgRef.current || !nodesRef.current) return

    // Config
    const tilt = 0.42
    const gap = 40
    const baseRadius = 80
    const speedScale = 2.1 / 4 // Slowed down 4x

    const ecc: Record<number, number> = {
      0: 0.04,
      1: 0.02,
      2: 0.03,
      3: 0.05,
      4: 0.04,
      5: 0.06,
      6: 0.05,
      7: 0.01,
    }
    const ringRotationDeg: Record<number, number> = { 5: -8, 7: 12 }
    const ringTilt: Record<number, number> = { 5: 0.4, 7: 0.44 }

    const toRad = (d: number) => d * (Math.PI / 180)

    // Kepler solver
    function solveKepler(M: number, e: number): number {
      let E = M
      for (let i = 0; i < 8; i++) {
        const d = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E))
        E -= d
        if (Math.abs(d) < 1e-6) break
      }
      return (
        2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2))
      )
    }

    function posOnRing(i: number, M: number): { x: number; y: number } {
      const a = baseRadius + i * gap
      const e = ecc[i] || 0
      const b = a * (ringTilt[i] ?? tilt)
      const c = a * e
      const nu = e ? solveKepler(M, e) : M

      let x = -c + a * Math.cos(nu)
      let y = b * Math.sin(nu)

      const rot = toRad(ringRotationDeg[i] || 0)
      if (rot) {
        const X = x * Math.cos(rot) - y * Math.sin(rot)
        const Y = x * Math.sin(rot) + y * Math.cos(rot)
        x = X
        y = Y
      }

      return { x, y }
    }

    interface NodeOrbit {
      ring: number
      M: number
      n: number
    }

    const nodes: Array<{ element: SVGCircleElement; orbit: NodeOrbit }> = []

    function seedRing({
      ring,
      count,
      r,
      fill,
      baseN,
      jitterDeg = 10,
    }: {
      ring: number
      count: number
      r: number
      fill: string
      baseN: number
      jitterDeg?: number
    }) {
      const step = 360 / Math.max(1, count)
      for (let i = 0; i < count; i++) {
        const jitter = Math.random() * 2 * jitterDeg - jitterDeg
        const M = toRad(i * step + jitter)
        const n = baseN * (0.95 + Math.random() * 0.1) * speedScale

        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
        circle.setAttribute('r', r.toString())
        circle.setAttribute('fill', fill)

        const orbit: NodeOrbit = { ring, M, n }
        nodes.push({ element: circle, orbit })

        nodesRef.current?.appendChild(circle)
      }
    }

    // Seed friend distribution
    seedRing({ ring: 0, count: 3, r: 5.2, fill: '#FFCEBF', baseN: 0.03, jitterDeg: 14 })
    seedRing({ ring: 2, count: 8, r: 4.9, fill: '#FFDDBA', baseN: 0.02, jitterDeg: 16 })
    seedRing({ ring: 4, count: 24, r: 4.1, fill: '#B1B7FF', baseN: 0.01, jitterDeg: 18 })
    seedRing({ ring: 6, count: 60, r: 3.2, fill: '#A8D2FF', baseN: 0.004, jitterDeg: 20 })
    seedRing({ ring: 1, count: 2, r: 4.6, fill: 'rgba(255,196,140,0.95)', baseN: 0.014, jitterDeg: 28 })
    seedRing({ ring: 3, count: 4, r: 3.8, fill: 'rgba(196,201,255,0.95)', baseN: 0.008, jitterDeg: 32 })
    seedRing({ ring: 5, count: 6, r: 3.4, fill: 'rgba(131,185,255,0.95)', baseN: 0.005, jitterDeg: 36 })
    seedRing({ ring: 7, count: 10, r: 3.1, fill: 'rgba(131,185,255,0.85)', baseN: 0.003, jitterDeg: 40 })

    // Initial layout
    for (const { element, orbit } of nodes) {
      const p = posOnRing(orbit.ring, orbit.M)
      element.setAttribute('cx', p.x.toString())
      element.setAttribute('cy', p.y.toString())
    }

    // Animate
    function animate() {
      for (const { element, orbit } of nodes) {
        orbit.M = (orbit.M + orbit.n) % (Math.PI * 2)
        const p = posOnRing(orbit.ring, orbit.M)
        element.setAttribute('cx', p.x.toString())
        element.setAttribute('cy', p.y.toString())
      }
      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationFrameRef.current !== undefined) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  // ========== RESIZE HANDLERS ==========

  const handleResizeStart = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation()
      e.preventDefault()

      setIsResizing(true)
      resizeStart.current = {
        x: e.clientX,
        y: e.clientY,
        cardWidth: width,
        cardHeight: height,
      }

      cardRef.current?.setPointerCapture(e.pointerId)
    },
    [width, height]
  )

  const handleResizeMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isResizing) return

      const dx = (e.clientX - resizeStart.current.x) / zoom
      const dy = (e.clientY - resizeStart.current.y) / zoom

      const newWidth = Math.max(300, resizeStart.current.cardWidth + dx)
      const newHeight = Math.max(200, resizeStart.current.cardHeight + dy)

      updateCard(card.id, { width: newWidth, height: newHeight })
    },
    [isResizing, card.id, updateCard, zoom]
  )

  const handleResizeEnd = useCallback(
    (e: React.PointerEvent) => {
      if (isResizing) {
        setIsResizing(false)
        cardRef.current?.releasePointerCapture(e.pointerId)
      }
    },
    [isResizing]
  )

  // ========== DRAG HANDLERS ==========

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (isPanning || e.button !== 0) return
      e.stopPropagation()
      selectCard(card.id, e.shiftKey)
      setLocalDragging(true)
      setIsDragging(true)
      dragThresholdCrossed.current = false
      dragStart.current = { x: e.clientX, y: e.clientY, cardX: card.x, cardY: card.y }
      cardRef.current?.setPointerCapture(e.pointerId)
    },
    [card.id, card.x, card.y, selectCard, setIsDragging, isPanning]
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      // Handle resize first (takes priority)
      if (isResizing) {
        handleResizeMove(e)
        return
      }

      if (!isDragging) return

      const dx = e.clientX - dragStart.current.x
      const dy = e.clientY - dragStart.current.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (!dragThresholdCrossed.current && distance < DRAG_THRESHOLD) {
        return
      }

      dragThresholdCrossed.current = true

      const scaledDx = dx / zoom
      const scaledDy = dy / zoom

      moveCard(card.id, dragStart.current.cardX + scaledDx, dragStart.current.cardY + scaledDy)
    },
    [isDragging, isResizing, card.id, moveCard, zoom, handleResizeMove]
  )

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (isResizing) {
        handleResizeEnd(e)
      } else if (isDragging) {
        setLocalDragging(false)
        setIsDragging(false)
        cardRef.current?.releasePointerCapture(e.pointerId)
      }
    },
    [isDragging, isResizing, setIsDragging, handleResizeEnd]
  )

  return (
    <div
      ref={cardRef}
      className={`card spatial-card ${isDragging ? 'dragging active' : ''} ${
        isSelected ? `selected ${showJiggle ? 'jiggle' : ''}` : ''
      }`}
      data-card-id={card.id}
      style={{
        position: 'absolute',
        left: card.x,
        top: card.y,
        width,
        height,
        padding: 0,
        background: card.color || '#0a0a0a',
        borderRadius: 'var(--entity-radius)',
        border: '1px solid var(--primary-border)',
        boxShadow: isDragging
          ? 'var(--card-shadow-drag)'
          : isSelected && showJiggle
          ? '0 0 0 3px rgba(59, 130, 246, 0.5), 0 0 20px rgba(59, 130, 246, 0.3)'
          : 'var(--card-shadow)',
        animation: isSelected && showJiggle ? 'focus-ring-pulse 2s ease-in-out infinite' : 'none',
        cursor: isDragging ? 'grabbing' : 'grab',
        transition: isSelected && showJiggle ? 'none' : 'box-shadow 0.3s ease, transform 0.3s ease',
        userSelect: 'none',
        zIndex: isDragging ? 1000 : card.z,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        touchAction: 'manipulation',
        // Organic blob shape - irregular soft pentagon
        clipPath: `path('M 150,10
          C 250,15 380,50 450,120
          C 480,180 485,280 420,330
          C 350,380 280,390 200,380
          C 100,365 30,320 15,240
          C 5,180 40,80 100,40
          C 130,20 140,8 150,10 Z')`,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <svg
        ref={svgRef}
        viewBox="-300 -200 600 400"
        width="100%"
        height="100%"
        role="img"
        aria-label="Orbit rings with friend distribution"
        style={{ pointerEvents: 'none' }}
      >
        <defs>
          <linearGradient id="orbit-glow-card" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF9A1A" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#FF9A1A" stopOpacity="0.2" />
          </linearGradient>
        </defs>

        {/* Rings */}
        <g>
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
            const a = 80 + i * 40
            const b = a * (i === 5 ? 0.4 : i === 7 ? 0.44 : 0.42)
            const c = a * ([0.04, 0.02, 0.03, 0.05, 0.04, 0.06, 0.05, 0.01][i] || 0)
            const rot = i === 5 ? -8 : i === 7 ? 12 : 0

            const isHeavy = i % 2 === 0
            const stroke = isHeavy
              ? ['#FF8B7B', '#FFC48C', '#C4C9FF', '#83B9FF'][i / 2] || '#1E2C4B'
              : [
                  'rgba(255,139,123,0.28)',
                  'rgba(255,196,140,0.26)',
                  'rgba(196,201,255,0.28)',
                  'rgba(131,185,255,0.26)',
                ][(i - 1) / 2] || 'rgba(255,255,255,0.15)'
            const strokeWidth = isHeavy ? 2 : 1

            return (
              <g key={i} transform={`rotate(${rot})`}>
                <ellipse
                  cx={-c}
                  cy={0}
                  rx={a}
                  ry={b}
                  fill="none"
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                />
              </g>
            )
          })}
        </g>

        {/* Sun */}
        <circle cx={0} cy={0} r={28} fill="url(#orbit-glow-card)" />

        {/* Nodes */}
        <g ref={nodesRef} />
      </svg>

      {/* Connection handle - only show on hover/select */}
      {(isSelected || isHovered) && (
        <ConnectionHandle cardId={card.id} position="right" />
      )}

      {/* Resize handle */}
      <div
        className="card-resize-handle"
        onPointerDown={handleResizeStart}
        onPointerMove={handleResizeMove}
        onPointerUp={handleResizeEnd}
        style={{
          position: 'absolute',
          right: 8,
          bottom: 8,
          width: 24,
          height: 24,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.9)',
          border: '2px solid rgba(59, 130, 246, 0.5)',
          cursor: 'nwse-resize',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          fontWeight: 'bold',
          color: 'rgba(59, 130, 246, 0.8)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          zIndex: 10,
          pointerEvents: 'auto',
        }}
      >
        ↘
      </div>
    </div>
  )
}
