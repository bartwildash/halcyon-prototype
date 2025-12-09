// Halcyon Spatial Workspace
// Infinite canvas for spatial thinking with entity cards

import { useEffect, useState, useRef, useCallback } from 'react'
import { Space } from '../components/spatial/Space'
import { useSpatialStore } from '../stores/spatialStore'
import { ToolButton } from '../components/ui/ToolButton'
import { LandmarkNavigator } from '../components/ui/LandmarkNavigator'
import { SyncIndicator } from '../components/ui/SyncIndicator'
import { CommandPalette } from '../components/ui/CommandPalette'
import { KeyboardGuide } from '../components/ui/KeyboardGuide'
import { NotificationBell } from '../components/ui/NotificationBell'
import { GraphView } from '../components/miniapps/GraphView'
import { Weather } from '../components/miniapps/Weather'
import { PomodoroTimer } from '../components/gadgets/pomodoro/PomodoroTimer'
import { FlipClock } from '../components/gadgets/flip-clock/FlipClock'
import { PlanBoard } from '../components/spatial/PlanBoard'
import { useSync } from '../hooks/useSync'
import { exportSpace, importSpace, pickImportFile } from '../utils/exportImport'
import { LANDMARKS } from '../config/landmarks'
import '../styles/spatial.css'

const SPACE_ID = 'demo-space'

export function SpatialDemo() {
  const { space, createCard, updateCard, setPan, setZoom, deleteAllCards, toolMode, setToolMode } = useSpatialStore()
  const [instructionsExpanded, setInstructionsExpanded] = useState(false)
  const [showTimer, setShowTimer] = useState(false)
  const [showFlipClock, setShowFlipClock] = useState(false)
  const [showWeather, setShowWeather] = useState(false)
  const [showGraph, setShowGraph] = useState(false)
  const [showPlan, setShowPlan] = useState(false)
  const [showCommandPalette, setShowCommandPalette] = useState(false)
  const [showKeyboardGuide, setShowKeyboardGuide] = useState(false)

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in an input or textarea
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return
      }

      // Skip if any modal is open (except for Escape)
      const modalOpen = showCommandPalette || showKeyboardGuide || showPlan
      if (modalOpen && e.key !== 'Escape') {
        return
      }

      // Cmd+K or Ctrl+K to open command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setShowCommandPalette(true)
        return
      }

      // Single key shortcuts (only when no modifier keys)
      if (e.metaKey || e.ctrlKey || e.altKey) return

      switch (e.key.toLowerCase()) {
        // ? - Show keyboard guide
        case '?':
          e.preventDefault()
          setShowKeyboardGuide(true)
          break

        // Tool shortcuts
        case 'h':
          e.preventDefault()
          setToolMode('hand')
          break
        case 's':
          e.preventDefault()
          setToolMode('select')
          break
        case 'd':
          e.preventDefault()
          setToolMode('draw')
          break

        // Create shortcuts
        case 'n':
          e.preventDefault()
          if (space) {
            const x = 200 + Math.random() * 400
            const y = 200 + Math.random() * 400
            createCard(x, y, '')
          }
          break
        case 't':
          e.preventDefault()
          if (space) {
            const x = 200 + Math.random() * 400
            const y = 200 + Math.random() * 400
            createCard(x, y, '[ ] New task')
          }
          break

        // View shortcuts
        case '1':
          e.preventDefault()
          // THINK mode (close modals, stay on canvas)
          setShowPlan(false)
          break
        case '2':
          e.preventDefault()
          // PLAN mode
          setShowPlan(true)
          break

        // Zoom shortcuts
        case '+':
        case '=':
          e.preventDefault()
          handleZoomIn()
          break
        case '-':
          e.preventDefault()
          handleZoomOut()
          break
        case '0':
          e.preventDefault()
          // Reset zoom to 100%
          if (space) {
            setZoom(1)
          }
          break

        // Escape to close modals
        case 'escape':
          if (showKeyboardGuide) {
            setShowKeyboardGuide(false)
          } else if (showCommandPalette) {
            setShowCommandPalette(false)
          } else if (showPlan) {
            setShowPlan(false)
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [space, showCommandPalette, showKeyboardGuide, showPlan, setToolMode, createCard, setZoom])

  // Export handler
  const handleExport = useCallback(() => {
    if (space) {
      exportSpace(space)
    }
  }, [space])

  // Import handler
  const handleImport = useCallback(async () => {
    const file = await pickImportFile()
    if (!file) return

    try {
      const importedSpace = await importSpace(file)
      // Replace current space with imported data
      // Note: In a full implementation, you'd want to merge or prompt user
      alert(`Imported space: ${importedSpace.name} with ${importedSpace.cards.length} cards`)
    } catch (err) {
      alert(`Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }, [])

  // Sync with backend
  const { syncState, forceSync } = useSync(SPACE_ID)

  const isNavigating = useRef(false)
  const hasInitialized = useRef(false)

  // Navigate to landmark with smooth animation
  // Landmarks use viewport-relative coords (0,0 = canvas center at 5000,5000)
  const handleNavigateToLandmark = (x: number, y: number) => {
    if (!space) return

    isNavigating.current = true

    // Convert viewport-relative landmark coords to absolute canvas coords
    const canvasX = 5000 + x
    const canvasY = 5000 + y

    // Calculate scroll position to center this point on screen
    // scroll = -(canvasPos * zoom - viewportCenter)
    const targetX = -(canvasX * space.zoom - window.innerWidth / 2)
    const targetY = -(canvasY * space.zoom - window.innerHeight / 2)

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

    // Get current viewport center in canvas coordinates
    // The scroll is negative, so: canvasPos = (viewportPos - scrollPos) / zoom
    const viewportCenterCanvasX = (window.innerWidth / 2 - space.scrollX) / space.zoom
    const viewportCenterCanvasY = (window.innerHeight / 2 - space.scrollY) / space.zoom

    // Convert to viewport-relative coords (landmarks use 0,0 = center at 5000,5000)
    const viewportRelX = viewportCenterCanvasX - 5000
    const viewportRelY = viewportCenterCanvasY - 5000

    // Find nearest landmark
    let nearestLandmark = LANDMARKS[0]
    let minDistance = Infinity

    for (const landmark of LANDMARKS) {
      const dx = landmark.x - viewportRelX
      const dy = landmark.y - viewportRelY
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

  // Initialize Halcyon spatial zones demo on first load
  useEffect(() => {
    if (!space || hasInitialized.current) return

    // Check if demo already exists - prevent re-initialization
    const hasHalcyonDemo = space.cards.some(card => card.name === 'Welcome to Halcyon')
    if (hasHalcyonDemo || space.cards.length > 0) return

    // Mark as initialized to prevent re-running
    hasInitialized.current = true

    // Canvas center is at 5000,5000 in the 10000x10000 space
    // Landmarks use viewport-relative coords (0,0 = center)
    // To place cards in zones, we use: 5000 + landmark.x, 5000 + landmark.y

    // ========== LAKE ZONE (CENTER) - Writing & Reflection ==========
    const lakeX = 5000 // center
    const lakeY = 5000

    setTimeout(() => {
      const cardId = createCard(lakeX - 100, lakeY - 200, 'Welcome to Halcyon')
      updateCard(cardId, {
        cardType: 'note',
        color: '#E0F2FE', // Lake blue
        width: 280,
        height: 70,
      })
    }, 50)

    setTimeout(() => {
      const cardId = createCard(lakeX - 100, lakeY - 100, '🏞️ The Lake')
      updateCard(cardId, {
        cardType: 'note',
        color: '#BAE6FD',
        width: 220,
      })
    }, 80)

    setTimeout(() => {
      const cardId = createCard(lakeX - 100, lakeY, 'Quiet surface for writing,\ndrafting documents,\ncalm thinking.')
      updateCard(cardId, {
        cardType: 'note',
        color: '#F0F9FF',
        width: 240,
      })
    }, 110)

    setTimeout(() => {
      const cardId = createCard(lakeX + 200, lakeY - 50, '✏️')
      updateCard(cardId, { cardType: 'sticker', icon: '✏️', size: 'large' })
    }, 140)

    // ========== MOUNTAIN ZONE (NE) - Crumpit Task Triage ==========
    const mountainX = 5000 + 1200
    const mountainY = 5000 - 600

    setTimeout(() => {
      const cardId = createCard(mountainX - 150, mountainY - 150, '⛰️ Mt. Crumpit')
      updateCard(cardId, {
        cardType: 'note',
        color: '#E5E7EB', // Mountain gray
        width: 240,
        height: 60,
      })
    }, 170)

    setTimeout(() => {
      const cardId = createCard(mountainX - 150, mountainY - 60, 'Task triage on the mountain slope.\nPrioritize what matters NOW.')
      updateCard(cardId, {
        cardType: 'note',
        color: '#F3F4F6',
        width: 260,
      })
    }, 200)

    setTimeout(() => {
      const cardId = createCard(mountainX + 150, mountainY - 100, '📋')
      updateCard(cardId, { cardType: 'sticker', icon: '📋', size: 'large' })
    }, 230)

    // Sample tasks in mountain zone
    setTimeout(() => {
      const cardId = createCard(mountainX - 200, mountainY + 80, 'Review sprint priorities')
      updateCard(cardId, {
        cardType: 'task',
        completed: false,
        energy: 'high_focus',
        signal: 'loud',
      })
    }, 260)

    setTimeout(() => {
      const cardId = createCard(mountainX + 50, mountainY + 80, 'Clear blocked items')
      updateCard(cardId, {
        cardType: 'task',
        completed: false,
        energy: 'medium',
        signal: 'normal',
      })
    }, 290)

    // ========== MEADOW ZONE (NW) - Exploration & 3D ==========
    const meadowX = 5000 - 1200
    const meadowY = 5000 - 600

    setTimeout(() => {
      const cardId = createCard(meadowX - 100, meadowY - 150, '🌿 The Meadow')
      updateCard(cardId, {
        cardType: 'note',
        color: '#D1FAE5', // Meadow green
        width: 200,
        height: 60,
      })
    }, 320)

    setTimeout(() => {
      const cardId = createCard(meadowX - 100, meadowY - 60, 'Open exploration space.\nBrowser, 3D models,\nfreeform discovery.')
      updateCard(cardId, {
        cardType: 'note',
        color: '#ECFDF5',
        width: 220,
      })
    }, 350)

    setTimeout(() => {
      const cardId = createCard(meadowX + 150, meadowY - 100, '🔍')
      updateCard(cardId, { cardType: 'sticker', icon: '🔍', size: 'large' })
    }, 380)

    setTimeout(() => {
      const cardId = createCard(meadowX - 50, meadowY + 60, '🌐')
      updateCard(cardId, { cardType: 'sticker', icon: '🌐', size: 'medium' })
    }, 410)

    // ========== CANYON ZONE (W) - Timeline & History ==========
    const canyonX = 5000 - 1500
    const canyonY = 5000 + 200

    setTimeout(() => {
      const cardId = createCard(canyonX - 100, canyonY - 150, '🏜️ The Canyon')
      updateCard(cardId, {
        cardType: 'note',
        color: '#FED7AA', // Canyon orange
        width: 200,
        height: 60,
      })
    }, 440)

    setTimeout(() => {
      const cardId = createCard(canyonX - 100, canyonY - 60, 'Timeline of logs and history.\nLayers of the past.')
      updateCard(cardId, {
        cardType: 'note',
        color: '#FFF7ED',
        width: 220,
      })
    }, 470)

    setTimeout(() => {
      const cardId = createCard(canyonX + 140, canyonY - 100, '📅')
      updateCard(cardId, { cardType: 'sticker', icon: '📅', size: 'large' })
    }, 500)

    // ========== WORKSHOP ZONE (S) - Settings & Tools ==========
    const workshopX = 5000
    const workshopY = 5000 + 850

    setTimeout(() => {
      const cardId = createCard(workshopX - 100, workshopY - 150, '🔧 The Workshop')
      updateCard(cardId, {
        cardType: 'note',
        color: '#D6D3D1', // Workshop stone
        width: 200,
        height: 60,
      })
    }, 530)

    setTimeout(() => {
      const cardId = createCard(workshopX - 100, workshopY - 60, 'Tools, settings, and configuration.\nTune your workspace.')
      updateCard(cardId, {
        cardType: 'note',
        color: '#F5F5F4',
        width: 240,
      })
    }, 560)

    setTimeout(() => {
      const cardId = createCard(workshopX + 180, workshopY - 100, '⚙️')
      updateCard(cardId, { cardType: 'sticker', icon: '⚙️', size: 'large' })
    }, 590)

    // ========== NAVIGATION HINTS ==========
    setTimeout(() => {
      const cardId = createCard(lakeX - 100, lakeY + 150, 'Use the navigation bar above\nto jump between zones.')
      updateCard(cardId, {
        cardType: 'note',
        color: '#EBEBEB',
        width: 260,
      })
    }, 620)

    setTimeout(() => {
      const cardId = createCard(lakeX - 100, lakeY + 260, 'Pan: drag canvas\nZoom: scroll/pinch\nCreate: double-click')
      updateCard(cardId, {
        cardType: 'note',
        color: '#F8F8F8',
        width: 200,
      })
    }, 650)

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [space])

  // Clear all handler with confirmation
  const handleClearAll = useCallback(() => {
    if (confirm('Delete all cards? This cannot be undone.')) {
      deleteAllCards()
    }
  }, [deleteAllCards])

  return (
    <>
      {/* Main spatial canvas */}
      <Space spaceId={SPACE_ID} />

      {/* Floating Tool Button - tap to open, hold to move */}
      <ToolButton
        onRecenter={handleRecenter}
        onExport={handleExport}
        onImport={handleImport}
        onClearAll={handleClearAll}
        showTimer={showTimer}
        onToggleTimer={() => setShowTimer(prev => !prev)}
        showFlipClock={showFlipClock}
        onToggleFlipClock={() => setShowFlipClock(prev => !prev)}
        showWeather={showWeather}
        onToggleWeather={() => setShowWeather(prev => !prev)}
        showGraph={showGraph}
        onToggleGraph={() => setShowGraph(prev => !prev)}
      />

      {/* Gadget windows - toggled from ToolButton */}
      {showTimer && (
        <PomodoroTimer onClose={() => setShowTimer(false)} />
      )}
      {showFlipClock && (
        <FlipClock onClose={() => setShowFlipClock(false)} />
      )}
      {showWeather && (
        <Weather onClose={() => setShowWeather(false)} />
      )}
      {showGraph && (
        <GraphView onClose={() => setShowGraph(false)} />
      )}

      {/* Landmark Navigator - top center */}
      <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 1500 }}>
        <LandmarkNavigator onNavigate={handleNavigateToLandmark} />
      </div>

      {/* Sync indicator and buttons - top right */}
      <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 1500, display: 'flex', gap: 12, alignItems: 'center' }}>
        <NotificationBell />
        <button
          onClick={() => setShowKeyboardGuide(true)}
          className="button"
          style={{ fontSize: 14, fontWeight: 600, background: '#6b7280', color: 'white', minWidth: 32 }}
          title="Keyboard shortcuts (?)"
        >
          ?
        </button>
        <SyncIndicator
          isSyncing={syncState.isSyncing}
          isOnline={syncState.isOnline}
          lastSyncAt={syncState.lastSyncAt}
          error={syncState.syncError}
          onForceSync={forceSync}
        />
        <button
          onClick={() => setShowPlan(true)}
          className="button"
          style={{ fontSize: 14, fontWeight: 600, background: '#22c55e', color: 'white' }}
          title="Open Plan - today view (2)"
        >
          Plan
        </button>
      </div>

      {/* Plan Board modal */}
      {showPlan && (
        <PlanBoard onClose={() => setShowPlan(false)} />
      )}

      {/* Command Palette */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onShowPlan={() => setShowPlan(true)}
      />

      {/* Keyboard Guide */}
      {showKeyboardGuide && (
        <KeyboardGuide onClose={() => setShowKeyboardGuide(false)} />
      )}

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
              <strong>Tools (left toolbar)</strong>
            </p>
            <p style={{ margin: '0 0 6px 0' }}>
              <strong style={{ color: 'var(--primary)' }}>✋ Hand</strong> → Drag to pan canvas
            </p>
            <p style={{ margin: '0 0 6px 0' }}>
              <strong style={{ color: 'var(--primary)' }}>⬚ Select</strong> → Drag to select cards
            </p>

            <p style={{ margin: '12px 0 8px 0', fontSize: '14px', color: 'var(--primary)' }}>
              <strong>Controls</strong>
            </p>
            <p style={{ margin: '0 0 6px 0' }}>
              <strong style={{ color: 'var(--primary)' }}>Drag</strong> card → Move it
            </p>
            <p style={{ margin: '0 0 6px 0' }}>
              <strong style={{ color: 'var(--primary)' }}>Double-click</strong> card → Edit text
            </p>
            <p style={{ margin: '0 0 6px 0' }}>
              <strong style={{ color: 'var(--primary)' }}>Scroll/Pinch</strong> → Zoom
            </p>
            <p style={{ margin: '0 0 6px 0' }}>
              <strong style={{ color: 'var(--primary)' }}>Escape</strong> → Clear selection
            </p>
            <div
              className="badge info"
              style={{ marginTop: 12, fontSize: 11, display: 'inline-block' }}
            >
              Auto-saves locally + syncs to server
            </div>
          </div>
        )}
      </div>
    </>
  )
}
