// Space Component - The infinite canvas container
// This is NOT an HTML5 canvas - it's a DOM-based infinite canvas with CSS transforms

import { useRef, useEffect, useCallback, useMemo } from 'react'
import { useSpatialStore } from '../../stores/spatialStore'
import { usePanZoom } from '../../hooks/usePanZoom'
import { useUndoRedo } from '../../hooks/useUndoRedo'
import { SpatialCard } from './SpatialCard'
import { ConnectionsLayer } from './ConnectionsLayer'
import { SelectionCanvas } from './SelectionCanvas'
import { BoxFrame } from './BoxFrame'
import { BenchBackground, type BenchMode } from './BenchBackground'
import { screenToCanvas, isCardInViewport } from '../../utils/geometry'

interface SpaceProps {
  spaceId: string
  /** Background texture mode: 'osb' (chipboard), 'grid' (dots), or 'plain' */
  backgroundMode?: BenchMode
}

export function Space({ spaceId, backgroundMode = 'osb' }: SpaceProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const { space, loadSpace, createCard, clearSelection } = useSpatialStore()

  // Initialize pan/zoom (casting containerRef to RefObject<HTMLElement>)
  const { zoom, scrollX, scrollY } = usePanZoom(containerRef as React.RefObject<HTMLElement>)

  // Initialize undo/redo (Cmd/Ctrl+Z, Cmd/Ctrl+Shift+Z)
  useUndoRedo()

  // Load space on mount
  useEffect(() => {
    loadSpace(spaceId)
  }, [spaceId, loadSpace])

  // Handle click on empty space to create new card
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      // Only create card if clicking directly on canvas (not on a card)
      if (e.target !== canvasRef.current) return

      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return

      // Convert screen coordinates to canvas coordinates
      const canvasPos = screenToCanvas(
        e.clientX - rect.left,
        e.clientY - rect.top,
        zoom,
        scrollX,
        scrollY
      )

      createCard(canvasPos.x, canvasPos.y, '')
    },
    [zoom, scrollX, scrollY, createCard]
  )

  // Viewport culling - only render visible cards for performance
  const visibleCards = useMemo(() => {
    if (!space) return []

    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    return space.cards.filter((card) =>
      isCardInViewport(card, scrollX, scrollY, viewportWidth, viewportHeight, zoom, 200)
    )
  }, [space, scrollX, scrollY, zoom])

  // Handle escape key to clear selection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        clearSelection()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [clearSelection])

  if (!space) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100vw',
          height: '100vh',
          background: 'var(--canvas-bg, #fafafa)',
          fontFamily: 'system-ui',
          color: '#666',
        }}
      >
        Loading space...
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="space-container halcyon-bench"
      style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        touchAction: 'none',
      }}
    >
      {/* Bench background texture - warm OSB chipboard feel */}
      <BenchBackground mode={backgroundMode} zoom={zoom} />
      {/* The "infinite canvas" - transformed container */}
      <div
        ref={canvasRef}
        className="space-canvas"
        onClick={handleCanvasClick}
        style={{
          position: 'absolute',
          width: 10000,
          height: 10000,
          transformOrigin: '0 0',
          transform: `scale(${zoom}) translate(${scrollX}px, ${scrollY}px)`,
          willChange: 'transform',
        }}
      >
        {/* Layer 0: Boxes/Frames (background grouping) */}
        {space.boxes.map((box) => (
          <BoxFrame key={box.id} box={box} />
        ))}

        {/* Layer 1: Connections (SVG, underneath cards) */}
        <ConnectionsLayer />

        {/* Layer 2: Cards (DOM elements) - with viewport culling */}
        {visibleCards.map((card) => (
          <SpatialCard key={card.id} card={card} />
        ))}
      </div>

      {/* Selection canvas overlay - for lasso/rectangle selection */}
      <SelectionCanvas
        zoom={zoom}
        scrollX={scrollX}
        scrollY={scrollY}
        containerRef={containerRef}
      />

      {/* Performance indicators */}
      <div
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          alignItems: 'flex-end',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        {/* Zoom indicator */}
        <div
          style={{
            padding: '8px 12px',
            background: 'rgba(255, 255, 255, 0.9)',
            borderRadius: 6,
            fontSize: 12,
            fontFamily: 'system-ui',
            fontWeight: 500,
            color: '#666',
          }}
        >
          {Math.round(zoom * 100)}%
        </div>

        {/* Card count indicator */}
        {space.cards.length > 0 && (
          <div
            style={{
              padding: '6px 10px',
              background: 'rgba(255, 255, 255, 0.9)',
              borderRadius: 6,
              fontSize: 11,
              fontFamily: 'system-ui',
              fontWeight: 500,
              color: '#666',
            }}
          >
            {space.cards.length} cards
          </div>
        )}
      </div>
    </div>
  )
}
