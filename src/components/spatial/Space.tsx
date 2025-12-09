// Space Component - The infinite canvas container
// This is NOT an HTML5 canvas - it's a DOM-based infinite canvas with CSS transforms

import { useRef, useEffect, useMemo, useCallback, useState } from 'react'
import { useSpatialStore } from '../../stores/spatialStore'
import { usePanZoom } from '../../hooks/usePanZoom'
import { useUndoRedo } from '../../hooks/useUndoRedo'
import { SpatialCard } from './SpatialCard'
import { ConnectionsLayer } from './ConnectionsLayer'
import { SelectionCanvas } from './SelectionCanvas'
import { BoxFrame } from './BoxFrame'
import { BenchBackground, type BenchMode } from './BenchBackground'
import { InkCanvas } from './InkCanvas'
import { CardContextMenu } from '../ui/CardContextMenu'
import { isCardInViewport } from '../../utils/geometry'
import type { InkStroke } from '../../types/spatial'

interface SpaceProps {
  spaceId: string
  /** Background texture mode: 'osb' (chipboard), 'grid' (dots), or 'plain' */
  backgroundMode?: BenchMode
}

export function Space({ spaceId, backgroundMode = 'osb' }: SpaceProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const { space, loadSpace, clearSelection, toolMode, setInkStrokes } = useSpatialStore()

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean
    position: { x: number; y: number }
    cardId: string
  }>({
    isOpen: false,
    position: { x: 0, y: 0 },
    cardId: '',
  })

  const closeContextMenu = useCallback(() => {
    setContextMenu(prev => ({ ...prev, isOpen: false }))
  }, [])

  // Ink strokes handler
  const handleStrokesChange = useCallback((strokes: InkStroke[]) => {
    setInkStrokes(strokes)
  }, [setInkStrokes])

  // Initialize pan/zoom (casting containerRef to RefObject<HTMLElement>)
  const { zoom, scrollX, scrollY } = usePanZoom(containerRef as React.RefObject<HTMLElement>)

  // Initialize undo/redo (Cmd/Ctrl+Z, Cmd/Ctrl+Shift+Z)
  useUndoRedo()

  // Load space on mount
  useEffect(() => {
    loadSpace(spaceId)
  }, [spaceId, loadSpace])

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
        closeContextMenu()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [clearSelection, closeContextMenu])

  // Handle right-click on cards
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    // Find the card element
    const cardElement = (e.target as HTMLElement).closest('[data-card-id]')
    if (cardElement) {
      e.preventDefault()
      const cardId = cardElement.getAttribute('data-card-id')
      if (cardId) {
        setContextMenu({
          isOpen: true,
          position: { x: e.clientX, y: e.clientY },
          cardId,
        })
      }
    }
  }, [])

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
      onContextMenu={handleContextMenu}
    >
      {/* Bench background texture - warm OSB chipboard feel */}
      <BenchBackground mode={backgroundMode} zoom={zoom} />
      {/* The "infinite canvas" - transformed container */}
      <div
        ref={canvasRef}
        className="space-canvas"
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

      {/* Ink/Drawing layer overlay */}
      <InkCanvas
        strokes={space.inkStrokes || []}
        onStrokesChange={handleStrokesChange}
        isDrawingMode={toolMode === 'draw'}
        zoom={zoom}
        scrollX={scrollX}
        scrollY={scrollY}
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

      {/* Card context menu (right-click) */}
      <CardContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        cardId={contextMenu.cardId}
        onClose={closeContextMenu}
      />
    </div>
  )
}
