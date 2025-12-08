// Halcyon Spatial Workspace
// Infinite canvas for spatial thinking with entity cards

import { useEffect, useState, useRef } from 'react'
import { Space } from '../components/spatial/Space'
import { useSpatialStore } from '../stores/spatialStore'
import { PrimitivesToggle } from '../components/ui/PrimitivesToggle'
import type { PrimitiveTool } from '../components/ui/PrimitivesPalette'
import { MiniAppsPalette, type MiniApp } from '../components/ui/MiniAppsPalette'
import { LandmarkNavigator } from '../components/ui/LandmarkNavigator'
import { ControlPanel } from '../components/ui/ControlPanel'
import { GraphView } from '../components/miniapps/GraphView'
import { Weather } from '../components/miniapps/Weather'
import { PomodoroTimer } from '../components/gadgets/pomodoro/PomodoroTimer'
import { FlipClock } from '../components/gadgets/flip-clock/FlipClock'
import '../styles/spatial.css'

// Landmark positions
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

export function SpatialDemo() {
  const { space, createCard, updateCard, setPan, setZoom, deleteAllCards } = useSpatialStore()
  const [primitiveTool, setPrimitiveTool] = useState<PrimitiveTool>('hand')
  const [openMiniApp, setOpenMiniApp] = useState<MiniApp | null>(null)
  const [instructionsExpanded, setInstructionsExpanded] = useState(false)
  const [showTimer, setShowTimer] = useState(true)
  const [showFlipClock, setShowFlipClock] = useState(true)

  // Navigation history
  const [history, setHistory] = useState<ViewportPosition[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const isNavigating = useRef(false)

  // Save current position to history
  const saveToHistory = () => {
    if (!space || isNavigating.current) return

    const currentPos: ViewportPosition = {
      x: space.scrollX,
      y: space.scrollY,
      zoom: space.zoom,
    }

    // Add to history, removing any forward history
    setHistory((prev) => [...prev.slice(0, historyIndex + 1), currentPos])
    setHistoryIndex((prev) => prev + 1)
  }

  // Navigate to landmark with smooth animation
  const handleNavigateToLandmark = (x: number, y: number) => {
    if (!space) return

    saveToHistory()
    isNavigating.current = true

    // Target position (centered on screen)
    const targetX = x - window.innerWidth / 2
    const targetY = y - window.innerHeight / 2

    // Current position
    const startX = space.scrollX
    const startY = space.scrollY

    // Animation duration in ms
    const duration = 800

    // Easing function (ease-in-out)
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

      setPan(currentX, currentY)

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
    if (!space) return

    // Get current viewport center
    const viewportCenterX = -space.scrollX + window.innerWidth / 2
    const viewportCenterY = -space.scrollY + window.innerHeight / 2

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
    if (!space) return

    const oldZoom = space.zoom
    const newZoom = Math.min(2.0, oldZoom * 1.2)

    // Zoom toward center of viewport
    const centerX = window.innerWidth / 2
    const centerY = window.innerHeight / 2

    // Point in canvas coordinates that's at viewport center
    const canvasPoint = {
      x: (centerX - space.scrollX) / oldZoom,
      y: (centerY - space.scrollY) / oldZoom,
    }

    // Keep that same canvas point at the viewport center after zoom
    const newScrollX = centerX - canvasPoint.x * newZoom
    const newScrollY = centerY - canvasPoint.y * newZoom

    setZoom(newZoom)
    setPan(newScrollX, newScrollY)
  }

  const handleZoomOut = () => {
    if (!space) return

    const oldZoom = space.zoom
    const newZoom = Math.max(0.3, oldZoom * 0.8)

    // Zoom toward center of viewport
    const centerX = window.innerWidth / 2
    const centerY = window.innerHeight / 2

    // Point in canvas coordinates that's at viewport center
    const canvasPoint = {
      x: (centerX - space.scrollX) / oldZoom,
      y: (centerY - space.scrollY) / oldZoom,
    }

    // Keep that same canvas point at the viewport center after zoom
    const newScrollX = centerX - canvasPoint.x * newZoom
    const newScrollY = centerY - canvasPoint.y * newZoom

    setZoom(newZoom)
    setPan(newScrollX, newScrollY)
  }

  // Navigation history controls
  const handleBack = () => {
    if (historyIndex <= 0 || !space) return

    const prevPos = history[historyIndex - 1]
    isNavigating.current = true

    setPan(prevPos.x, prevPos.y)
    setZoom(prevPos.zoom)
    setHistoryIndex(historyIndex - 1)

    setTimeout(() => {
      isNavigating.current = false
    }, 100)
  }

  const handleForward = () => {
    if (historyIndex >= history.length - 1 || !space) return

    const nextPos = history[historyIndex + 1]
    isNavigating.current = true

    setPan(nextPos.x, nextPos.y)
    setZoom(nextPos.zoom)
    setHistoryIndex(historyIndex + 1)

    setTimeout(() => {
      isNavigating.current = false
    }, 100)
  }


  // Initialize bench demo on first load
  useEffect(() => {
    if (!space) return

    // Check if demo already exists
    const hasBenchDemo = space.cards.some(card => card.name === 'The Bench')
    if (hasBenchDemo) return

    const centerX = 500
    const centerY = 300

    // ========== BENCH DEMO: TWO VIEWS, ONE MIND ==========

    // Hero: The Bench concept
    setTimeout(() => {
      const cardId = createCard(centerX, centerY - 350, 'The Bench')
      updateCard(cardId, {
        cardType: 'note',
        color: '#f4e2c4', // OSB chipboard color
        width: 260,
        height: 80,
      })
    }, 50)

    setTimeout(() => {
      const cardId = createCard(centerX, centerY - 240, 'A workspace with two views:\nwhere things are + how they connect')
      updateCard(cardId, {
        cardType: 'note',
        color: '#F5F5F0',
        width: 300,
      })
    }, 100)

    // Left side: Spatial Canvas explanation
    setTimeout(() => {
      const cardId = createCard(centerX - 450, centerY - 120, 'Spatial Canvas')
      updateCard(cardId, {
        cardType: 'note',
        color: '#E8EEF2',
        width: 200,
        height: 60,
      })
    }, 150)

    setTimeout(() => {
      const cardId = createCard(centerX - 450, centerY, 'Position = meaning\nFreeform thinking\nInk + stickers + cards')
      updateCard(cardId, {
        cardType: 'note',
        color: '#F0EBE3',
        width: 200,
      })
    }, 200)

    setTimeout(() => {
      const cardId = createCard(centerX - 520, centerY + 100, '🎨')
      updateCard(cardId, { cardType: 'sticker', icon: '🎨', size: 'medium' })
    }, 250)

    setTimeout(() => {
      const cardId = createCard(centerX - 380, centerY + 100, '✏️')
      updateCard(cardId, { cardType: 'sticker', icon: '✏️', size: 'medium' })
    }, 280)

    // Right side: Logic View explanation
    setTimeout(() => {
      const cardId = createCard(centerX + 450, centerY - 120, 'Logic View')
      updateCard(cardId, {
        cardType: 'note',
        color: '#E8F0E8',
        width: 200,
        height: 60,
      })
    }, 300)

    setTimeout(() => {
      const cardId = createCard(centerX + 450, centerY, 'Connections = structure\nDependencies + flows\nGraphs + pipelines')
      updateCard(cardId, {
        cardType: 'note',
        color: '#F0EBE3',
        width: 200,
      })
    }, 350)

    setTimeout(() => {
      const cardId = createCard(centerX + 380, centerY + 100, '🔗')
      updateCard(cardId, { cardType: 'sticker', icon: '🔗', size: 'medium' })
    }, 400)

    setTimeout(() => {
      const cardId = createCard(centerX + 520, centerY + 100, '📊')
      updateCard(cardId, { cardType: 'sticker', icon: '📊', size: 'medium' })
    }, 430)

    // Center: The connection
    setTimeout(() => {
      const cardId = createCard(centerX, centerY - 40, '↔️')
      updateCard(cardId, { cardType: 'sticker', icon: '↔️', size: 'large' })
    }, 460)

    setTimeout(() => {
      const cardId = createCard(centerX, centerY + 40, 'Same data\nTwo lenses')
      updateCard(cardId, {
        cardType: 'note',
        color: '#ffffff',
        width: 140,
      })
    }, 500)

    // Bottom: The 6 graphs preview
    setTimeout(() => {
      const cardId = createCard(centerX - 300, centerY + 200, 'Task Graph\n"What blocks what"')
      updateCard(cardId, {
        cardType: 'note',
        color: '#FFE4E4',
        width: 160,
      })
    }, 550)

    setTimeout(() => {
      const cardId = createCard(centerX - 100, centerY + 200, 'People Graph\n"Who works with who"')
      updateCard(cardId, {
        cardType: 'note',
        color: '#E4E4FF',
        width: 160,
      })
    }, 600)

    setTimeout(() => {
      const cardId = createCard(centerX + 100, centerY + 200, 'Pipeline View\n"Phase → phase"')
      updateCard(cardId, {
        cardType: 'note',
        color: '#E4FFE4',
        width: 160,
      })
    }, 650)

    setTimeout(() => {
      const cardId = createCard(centerX + 300, centerY + 200, 'Zone Map\n"Life architecture"')
      updateCard(cardId, {
        cardType: 'note',
        color: '#FFF4E4',
        width: 160,
      })
    }, 700)

    // Example task cards (showing structure)
    setTimeout(() => {
      const cardId = createCard(centerX - 200, centerY + 350, 'Design system')
      updateCard(cardId, {
        cardType: 'task',
        completed: true,
        energy: 'high_focus',
        signal: 'normal',
      })
    }, 750)

    setTimeout(() => {
      const cardId = createCard(centerX, centerY + 350, 'Build components')
      updateCard(cardId, {
        cardType: 'task',
        completed: false,
        energy: 'high_focus',
        signal: 'loud',
      })
    }, 800)

    setTimeout(() => {
      const cardId = createCard(centerX + 200, centerY + 350, 'Ship v1')
      updateCard(cardId, {
        cardType: 'task',
        completed: false,
        energy: 'medium',
        signal: 'normal',
      })
    }, 850)

    // Arrow stickers showing flow
    setTimeout(() => {
      const cardId = createCard(centerX - 100, centerY + 340, '→')
      updateCard(cardId, { cardType: 'sticker', icon: '→', size: 'small' })
    }, 880)

    setTimeout(() => {
      const cardId = createCard(centerX + 100, centerY + 340, '→')
      updateCard(cardId, { cardType: 'sticker', icon: '→', size: 'small' })
    }, 900)

    // Footer
    setTimeout(() => {
      const cardId = createCard(centerX, centerY + 460, 'Click anywhere to add cards\nDrag to move • Scroll to zoom')
      updateCard(cardId, {
        cardType: 'note',
        color: '#EBEBEB',
        width: 280,
      })
    }, 950)

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [space])

  return (
    <>
      {/* Main spatial canvas */}
      <Space spaceId="demo-space" />

      {/* Control Panel - left side */}
      <ControlPanel
        zoom={space?.zoom || 1}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onRecenter={handleRecenter}
        onBack={handleBack}
        onForward={handleForward}
        canGoBack={historyIndex > 0}
        canGoForward={historyIndex < history.length - 1}
      />

      {/* Primitives Toggle - bottom left */}
      <div style={{ position: 'fixed', bottom: 20, left: 20, zIndex: 1500 }}>
        <PrimitivesToggle
          activeTool={primitiveTool}
          onToolSelect={(tool) => {
            setPrimitiveTool(tool)
            // Future: Map tools to canvas actions
            // e.g., 'circle' -> create circular card/connection
          }}
        />
      </div>

      {/* MiniApps Palette - bottom left (above primitives) */}
      <div style={{ position: 'fixed', bottom: 80, left: 20, zIndex: 1500 }}>
        <MiniAppsPalette
          onAppLaunch={(app) => setOpenMiniApp(app)}
        />
      </div>

      {/* MiniApp windows */}
      {openMiniApp === 'graph' && (
        <GraphView onClose={() => setOpenMiniApp(null)} />
      )}
      {openMiniApp === 'weather' && (
        <Weather onClose={() => setOpenMiniApp(null)} />
      )}
      {openMiniApp === 'timer' && (
        <PomodoroTimer onClose={() => setOpenMiniApp(null)} />
      )}

      {/* Default Pomodoro Timer - always visible */}
      {showTimer && (
        <PomodoroTimer onClose={() => setShowTimer(false)} />
      )}

      {/* Default Flip Clock - always visible */}
      {showFlipClock && (
        <FlipClock onClose={() => setShowFlipClock(false)} />
      )}

      {/* Landmark Navigator - top center */}
      <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 1500 }}>
        <LandmarkNavigator onNavigate={handleNavigateToLandmark} />
      </div>

      {/* Clear All Button - top right */}
      <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 1500 }}>
        <button
          onClick={() => {
            if (confirm('Delete all cards? This cannot be undone.')) {
              deleteAllCards()
            }
          }}
          className="button"
          style={{ fontSize: 14, fontWeight: 600, background: '#ff4444', color: 'white' }}
        >
          Clear All Cards
        </button>
      </div>

      {/* Instructions overlay - Kinopio style */}
      <div
        className="dialog"
        style={{
          position: 'fixed',
          top: 20,
          left: 20,
          width: instructionsExpanded ? 300 : 'auto',
          padding: '16px',
          maxWidth: '90vw',
          zIndex: 1000,
          transition: 'width 0.2s ease',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: instructionsExpanded ? 12 : 0,
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 600,
              fontFamily: 'var(--sans-serif-font)',
              color: 'var(--primary)',
            }}
          >
            Halcyon Spatial Canvas
          </h3>
          <button
            onClick={() => setInstructionsExpanded(!instructionsExpanded)}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '18px',
              cursor: 'pointer',
              padding: '4px 8px',
              color: 'var(--secondary)',
            }}
            title={instructionsExpanded ? 'Collapse' : 'Expand'}
          >
            {instructionsExpanded ? '−' : '+'}
          </button>
        </div>

        {instructionsExpanded && (
          <div
            style={{
              lineHeight: 1.5,
              color: 'var(--secondary)',
              fontSize: '13px',
              fontFamily: 'var(--sans-serif-font)',
            }}
          >
            <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: 'var(--primary)' }}>
              <strong>Entity Types</strong>
            </p>
            <div style={{ marginBottom: '12px', fontSize: '12px' }}>
              <div className="badge" style={{ background: '#FF9A1A', color: 'white', marginRight: '4px' }}>⚡</div> High focus
              <div className="badge" style={{ background: '#FF8B7B', color: 'white', marginRight: '4px' }}>👥</div> Social
              <div className="badge" style={{ background: '#C4C9FF', color: '#333', marginRight: '4px' }}>☁️</div> Low energy
              <div className="badge" style={{ background: '#FFC48C', color: '#333' }}>○</div> Medium
            </div>

            <p style={{ margin: '12px 0 8px 0', fontSize: '14px', color: 'var(--primary)' }}>
              <strong>Controls</strong>
            </p>
            <p style={{ margin: '0 0 6px 0' }}>
              <strong style={{ color: 'var(--primary)' }}>Click</strong> empty space → Create card
            </p>
            <p style={{ margin: '0 0 6px 0' }}>
              <strong style={{ color: 'var(--primary)' }}>Drag</strong> card → Move it
            </p>
            <p style={{ margin: '0 0 6px 0' }}>
              <strong style={{ color: 'var(--primary)' }}>Double-click</strong> → Edit text
            </p>
            <p style={{ margin: '0 0 6px 0' }}>
              <strong style={{ color: 'var(--primary)' }}>Scroll</strong> → Zoom
            </p>
            <p style={{ margin: '0 0 6px 0' }}>
              <strong style={{ color: 'var(--primary)' }}>Drag background</strong> → Pan
            </p>
            <p style={{ margin: '0 0 6px 0' }}>
              <strong style={{ color: 'var(--primary)' }}>Escape</strong> → Clear selection
            </p>
            <div
              className="badge info"
              style={{ marginTop: 12, fontSize: 11, display: 'inline-block' }}
            >
              Auto-saves to IndexedDB
            </div>
          </div>
        )}
      </div>
    </>
  )
}
