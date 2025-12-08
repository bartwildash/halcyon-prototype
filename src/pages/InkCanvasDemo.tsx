/**
 * InkCanvasDemo - Complete Halcyon canvas with ink drawing
 *
 * Demonstrates:
 * - Terrain background (Canvas 2D)
 * - Konva entities with drag/drop
 * - Ink drawing on note cards
 * - Mode switching (pan/draw/select)
 */

import { useState, useRef } from 'react'
import { Stage, Layer } from 'react-konva'
import type Konva from 'konva'
import { InkNoteCard } from '../components/ink/InkNoteCard'
import { InkLayer } from '../components/ink/InkLayer'
import { InkToolbar, type CanvasMode } from '../components/ink/InkToolbar'
import { PrimitivesToggle } from '../components/ui/PrimitivesToggle'
import type { PrimitiveTool } from '../components/ui/PrimitivesPalette'
import { LandmarkNavigator } from '../components/ui/LandmarkNavigator'
import { ControlPanel } from '../components/ui/ControlPanel'
import type { NoteEntity } from '../types/entities'
import type { InkBrush, InkStroke } from '../types/ink'
import { DEFAULT_BRUSH } from '../types/ink'
import type { CameraState } from '../terrain/types'

// Landmark positions (matching spatial canvas)
const LANDMARKS = [
  { name: 'Lake', x: 500, y: 300 },
  { name: 'Mt. Crumpit', x: -200, y: -400 },
  { name: 'Canyon', x: 800, y: -200 },
  { name: 'Meadow', x: -400, y: 500 },
]

interface ViewportPosition {
  x: number
  y: number
  zoom: number
}

export function InkCanvasDemo() {
  const stageRef = useRef<Konva.Stage>(null)

  // Canvas state
  const [camera, setCamera] = useState<CameraState>({
    zoom: 1.0,
    offsetX: 0,
    offsetY: 0,
  })

  const [mode, setMode] = useState<CanvasMode>('pan')
  const [brush, setBrush] = useState<InkBrush>(DEFAULT_BRUSH)
  const [primitiveTool, setPrimitiveTool] = useState<PrimitiveTool>('hand')

  // Navigation history
  const [history, setHistory] = useState<ViewportPosition[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const isNavigating = useRef(false)

  // Landing page notes (matching SpatialDemo)
  const centerX = 500
  const centerY = 300

  const [notes, setNotes] = useState<NoteEntity[]>([
    {
      id: 'halcyon',
      type: 'note',
      title: 'Halcyon Ink Canvas',
      body: 'Draw with your stylus or finger',
      kind: 'idea',
      domainId: 'write',
      layout: { x: centerX, y: centerY - 400 },
      color: '#FAFAF9', // Zen white
      inkStrokes: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'welcome',
      type: 'note',
      title: 'Welcome',
      body: 'Handwritten notes\nFree-form sketches\nInfinite canvas',
      kind: 'idea',
      domainId: 'write',
      layout: { x: centerX, y: centerY - 200 },
      color: '#F5F5F0', // Zen cream
      inkStrokes: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'instructions',
      type: 'note',
      title: 'How to use',
      body: 'Space - Pan\nD - Draw\nV - Select',
      kind: 'draft',
      domainId: 'write',
      layout: { x: centerX - 300, y: centerY },
      color: '#E8EEF2', // Zen blue
      inkStrokes: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'features',
      type: 'note',
      title: 'Features',
      body: 'Konva.js rendering\nPressure-sensitive\nRAF batching',
      kind: 'idea',
      domainId: 'write',
      layout: { x: centerX + 300, y: centerY },
      color: '#E8F0E8', // Zen sage
      inkStrokes: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ])

  // Free-form ink strokes (not on cards)
  const [freeStrokes, setFreeStrokes] = useState<InkStroke[]>([])

  // Camera controls
  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    if (mode !== 'pan') return

    e.evt.preventDefault()
    const stage = stageRef.current
    if (!stage) return

    const oldScale = camera.zoom
    const pointer = stage.getPointerPosition()
    if (!pointer) return

    const scaleBy = 1.05
    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy

    // Clamp zoom
    const zoom = Math.max(0.3, Math.min(2.0, newScale))

    // Zoom to pointer
    const mousePointTo = {
      x: (pointer.x - camera.offsetX) / oldScale,
      y: (pointer.y - camera.offsetY) / oldScale,
    }

    const newPos = {
      x: pointer.x - mousePointTo.x * zoom,
      y: pointer.y - mousePointTo.y * zoom,
    }

    setCamera({
      zoom,
      offsetX: newPos.x,
      offsetY: newPos.y,
    })
  }

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    if (mode !== 'pan') return

    setCamera({
      ...camera,
      offsetX: e.target.x(),
      offsetY: e.target.y(),
    })
  }

  const updateNote = (id: string, updates: Partial<NoteEntity>) => {
    setNotes(notes.map(n => (n.id === id ? { ...n, ...updates } : n)))
  }

  const handleNoteDragEnd = (id: string, pos: { x: number; y: number }) => {
    updateNote(id, {
      layout: { ...notes.find(n => n.id === id)?.layout, ...pos },
    })
  }

  // Keyboard shortcuts
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'd' || e.key === 'D') {
      setMode('draw')
    } else if (e.key === 'v' || e.key === 'V') {
      setMode('select')
    } else if (e.key === ' ') {
      setMode('pan')
      e.preventDefault()
    } else if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
      // Undo last free stroke
      setFreeStrokes(prev => prev.slice(0, -1))
      e.preventDefault()
    }
  }

  // Add keyboard listener
  useState(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  })

  // Save current position to history
  const saveToHistory = () => {
    if (isNavigating.current) return

    const currentPos: ViewportPosition = {
      x: camera.offsetX,
      y: camera.offsetY,
      zoom: camera.zoom,
    }

    // Add to history, removing any forward history
    setHistory((prev) => [...prev.slice(0, historyIndex + 1), currentPos])
    setHistoryIndex((prev) => prev + 1)
  }

  // Navigate to landmark - center the viewport on that location
  const handleNavigateToLandmark = (x: number, y: number) => {
    saveToHistory()
    isNavigating.current = true

    const targetX = -(x - window.innerWidth / (2 * camera.zoom))
    const targetY = -(y - window.innerHeight / (2 * camera.zoom))
    const startX = camera.offsetX
    const startY = camera.offsetY
    const duration = 800

    const easeInOutCubic = (t: number) => {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
    }

    const startTime = performance.now()

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = easeInOutCubic(progress)

      const currentX = startX + (targetX - startX) * eased
      const currentY = startY + (targetY - startY) * eased

      setCamera((prev) => ({
        ...prev,
        offsetX: currentX,
        offsetY: currentY,
      }))

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        isNavigating.current = false
      }
    }

    requestAnimationFrame(animate)
  }

  // Find and navigate to nearest landmark
  const handleRecenter = () => {
    // Get current viewport center in canvas coordinates
    const viewportCenterX = -camera.offsetX + window.innerWidth / (2 * camera.zoom)
    const viewportCenterY = -camera.offsetY + window.innerHeight / (2 * camera.zoom)

    // Find nearest landmark
    let nearestLandmark = LANDMARKS[0]
    let minDistance = Infinity

    for (const landmark of LANDMARKS) {
      const dx = landmark.x - viewportCenterX
      const dy = landmark.y - viewportCenterY
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance < minDistance) {
        minDistance = distance
        nearestLandmark = landmark
      }
    }

    handleNavigateToLandmark(nearestLandmark.x, nearestLandmark.y)
  }

  // Zoom controls - zoom toward viewport center
  const handleZoomIn = () => {
    const oldZoom = camera.zoom
    const newZoom = Math.min(2.0, oldZoom * 1.2)

    // Zoom toward center of viewport
    const centerX = window.innerWidth / 2
    const centerY = window.innerHeight / 2

    // Point in canvas coordinates that's at viewport center
    const canvasPoint = {
      x: (centerX - camera.offsetX) / oldZoom,
      y: (centerY - camera.offsetY) / oldZoom,
    }

    // Keep that same canvas point at the viewport center after zoom
    const newOffsetX = centerX - canvasPoint.x * newZoom
    const newOffsetY = centerY - canvasPoint.y * newZoom

    setCamera({
      zoom: newZoom,
      offsetX: newOffsetX,
      offsetY: newOffsetY,
    })
  }

  const handleZoomOut = () => {
    const oldZoom = camera.zoom
    const newZoom = Math.max(0.3, oldZoom * 0.8)

    // Zoom toward center of viewport
    const centerX = window.innerWidth / 2
    const centerY = window.innerHeight / 2

    // Point in canvas coordinates that's at viewport center
    const canvasPoint = {
      x: (centerX - camera.offsetX) / oldZoom,
      y: (centerY - camera.offsetY) / oldZoom,
    }

    // Keep that same canvas point at the viewport center after zoom
    const newOffsetX = centerX - canvasPoint.x * newZoom
    const newOffsetY = centerY - canvasPoint.y * newZoom

    setCamera({
      zoom: newZoom,
      offsetX: newOffsetX,
      offsetY: newOffsetY,
    })
  }

  // Navigation history controls
  const handleBack = () => {
    if (historyIndex <= 0) return

    const prevPos = history[historyIndex - 1]
    isNavigating.current = true

    setCamera({
      zoom: prevPos.zoom,
      offsetX: prevPos.x,
      offsetY: prevPos.y,
    })
    setHistoryIndex(historyIndex - 1)

    setTimeout(() => {
      isNavigating.current = false
    }, 100)
  }

  const handleForward = () => {
    if (historyIndex >= history.length - 1) return

    const nextPos = history[historyIndex + 1]
    isNavigating.current = true

    setCamera({
      zoom: nextPos.zoom,
      offsetX: nextPos.x,
      offsetY: nextPos.y,
    })
    setHistoryIndex(historyIndex + 1)

    setTimeout(() => {
      isNavigating.current = false
    }, 100)
  }

  return (
    <div style={{
      position: 'relative',
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      background: 'radial-gradient(circle, rgba(0,0,0,0.08) 1px, transparent 1px)',
      backgroundColor: '#F5F5F0',
      backgroundSize: '24px 24px'
    }}>
      {/* Konva infinite canvas */}
      <Stage
        ref={stageRef}
        width={10000}
        height={10000}
        x={camera.offsetX}
        y={camera.offsetY}
        scaleX={camera.zoom}
        scaleY={camera.zoom}
        draggable={mode === 'pan'}
        onWheel={handleWheel}
        onDragEnd={handleDragEnd}
        style={{ position: 'absolute', inset: 0 }}
      >
        {/* Free-form ink layer */}
        <InkLayer
          strokes={freeStrokes}
          onStrokesChange={setFreeStrokes}
          isDrawingMode={mode === 'draw'}
          brush={brush}
        />

        {/* Note entities */}
        <Layer>
          {notes.map(note => (
            <InkNoteCard
              key={note.id}
              note={note}
              isDrawingMode={mode === 'draw'}
              brush={brush}
              onUpdate={updates => updateNote(note.id, updates)}
              onDragEnd={pos => handleNoteDragEnd(note.id, pos)}
            />
          ))}
        </Layer>
      </Stage>

      {/* Layer 3: UI overlay */}
      <InkToolbar
        mode={mode}
        onModeChange={setMode}
        brush={brush}
        onBrushChange={setBrush}
        onUndo={() => setFreeStrokes(prev => prev.slice(0, -1))}
        onClear={() => setFreeStrokes([])}
      />

      {/* Control Panel - left side */}
      <ControlPanel
        zoom={camera.zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onRecenter={handleRecenter}
        onBack={handleBack}
        onForward={handleForward}
        canGoBack={historyIndex > 0}
        canGoForward={historyIndex < history.length - 1}
      />

      {/* Primitives toggle (bottom left) */}
      <div style={{ position: 'fixed', bottom: 20, left: 20, zIndex: 1500 }}>
        <PrimitivesToggle
          activeTool={primitiveTool}
          onToolSelect={(tool) => {
            setPrimitiveTool(tool)
            // Map primitive tools to canvas modes
            if (tool === 'hand') {
              setMode('pan')
            } else {
              setMode('draw')
              // Future: set specific brush styles per primitive
            }
          }}
        />
      </div>

      {/* Landmark Navigator - top center */}
      <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 1500 }}>
        <LandmarkNavigator onNavigate={handleNavigateToLandmark} />
      </div>

      {/* Instructions */}
      <div
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          padding: '12px 16px',
          background: 'rgba(255, 255, 255, 0.95)',
          border: '2px solid #111',
          borderRadius: 8,
          fontSize: 12,
          fontFamily: 'monospace',
        }}
      >
        <div><strong>Keyboard shortcuts:</strong></div>
        <div>Space - Pan mode</div>
        <div>D - Draw mode</div>
        <div>V - Select mode</div>
        <div>Cmd+Z - Undo</div>
      </div>
    </div>
  )
}
