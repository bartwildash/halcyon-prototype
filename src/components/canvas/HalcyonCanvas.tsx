/**
 * HalcyonCanvas - Robust infinite canvas implementation
 *
 * ⚠️ DEPRECATED - This component is being phased out
 * See CLEANUP_PLAN.md for migration path
 *
 * NEW APPROACH: Use Space component from /components/spatial/
 * - Simpler architecture (no library dependency)
 * - DOM-based (not react-zoom-pan-pinch)
 * - Kinopio-proven interaction patterns
 * - Zero TypeScript errors
 * - Better performance
 *
 * This file will be moved to /src/archive/ in Phase 4
 *
 * ---
 *
 * OLD Architecture (DEPRECATED):
 * ┌─────────────────────────────────────┐
 * │ HalcyonCanvas                       │
 * │  ├─ TransformWrapper (zoom/pan)     │
 * │  │   └─ TransformComponent          │
 * │  │       ├─ TerrainLayer            │  ← Dot grid background
 * │  │       ├─ InkLayer (future)       │  ← Drawing strokes
 * │  │       ├─ EntityLayer             │  ← Cards (Note, Task, Person, etc)
 * │  │       └─ OverlayLayer            │  ← Selection boxes, guides
 * │  └─ Fixed UI (zoom controls, etc)   │
 * └─────────────────────────────────────┘
 */

import { useRef, useState } from 'react'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import type { ReactZoomPanPinchRef } from 'react-zoom-pan-pinch'
import { useHalcyonStore } from '../../store/halcyonStore'
import { TerrainCanvas } from './TerrainCanvas'
import { EntityLayer } from './EntityLayer'
import './HalcyonCanvas.css'

type TerrainMode = 'lake' | 'meadow' | 'crumpit' | 'canyon'

interface HalcyonCanvasProps {
  // No props needed - manages its own state
}

export function HalcyonCanvas({}: HalcyonCanvasProps) {
  const transformRef = useRef<ReactZoomPanPinchRef>(null)
  const { entities } = useHalcyonStore()
  const [mode, setMode] = useState<TerrainMode>('lake')

  return (
    <div className="halcyon-canvas-container">
      <TransformWrapper
        ref={transformRef}
        initialScale={1}
        initialPositionX={0}
        initialPositionY={0}
        minScale={0.1}
        maxScale={5}
        limitToBounds={false} // ← CRITICAL: infinite canvas
        centerOnInit={false}
        wheel={{
          step: 0.05,
        }}
        panning={{
          velocityDisabled: true, // Calm, no momentum scroll (DC-1 friendly)
        }}
        doubleClick={{
          disabled: true, // Don't interfere with card interactions
        }}
      >
        {({ zoomIn, zoomOut, resetTransform, centerView, instance }) => (
          <>
            {/* Main canvas content (transformed) */}
            <TransformComponent
              wrapperClass="halcyon-transform-wrapper"
              contentClass="halcyon-transform-content"
            >
              {/* Layer 1: Terrain background (dot grid) */}
              <TerrainCanvas
                mode={mode}
                scale={instance.transformState.scale}
                positionX={instance.transformState.positionX}
                positionY={instance.transformState.positionY}
              />

              {/* Layer 2: Ink strokes (future) */}
              {/* <InkLayer /> */}

              {/* Layer 3: Entity cards */}
              <EntityLayer entities={Array.from(entities.values())} />

              {/* Layer 4: Overlays (selection, guides) */}
              {/* <OverlayLayer /> */}
            </TransformComponent>

            {/* Zoom controls - Bottom right */}
            <div className="halcyon-zoom-controls">
              <button onClick={() => zoomIn()} aria-label="Zoom in">
                +
              </button>
              <button onClick={() => zoomOut()} aria-label="Zoom out">
                −
              </button>
              <button onClick={() => resetTransform()} aria-label="Reset view">
                ⌖
              </button>
            </div>

            {/* Mode switcher - Top center */}
            <div className="halcyon-mode-switcher">
              <button
                onClick={() => setMode('lake')}
                className={mode === 'lake' ? 'active' : ''}
              >
                Lake
              </button>
              <button
                onClick={() => setMode('meadow')}
                className={mode === 'meadow' ? 'active' : ''}
              >
                Meadow
              </button>
              <button
                onClick={() => setMode('crumpit')}
                className={mode === 'crumpit' ? 'active' : ''}
              >
                Crumpit
              </button>
              <button
                onClick={() => setMode('canyon')}
                className={mode === 'canyon' ? 'active' : ''}
              >
                Canyon
              </button>
            </div>
          </>
        )}
      </TransformWrapper>
    </div>
  )
}
