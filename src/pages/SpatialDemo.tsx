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
import { CrumpitBoard } from '../components/spatial/CrumpitBoard'
import { PlanBoard } from '../components/spatial/PlanBoard'
import { useSync } from '../hooks/useSync'
import { exportSpace, importSpace, pickImportFile } from '../utils/exportImport'
import '../styles/spatial.css'

// Landmark positions
const LANDMARKS = [
  { name: 'Lake', x: 500, y: 300 },
  { name: 'Mt. Crumpit', x: -200, y: -400 },
  { name: 'Canyon', x: 800, y: -200 },
  { name: 'Meadow', x: -400, y: 500 },
]

const SPACE_ID = 'demo-space'

type MiniApp = 'graph' | 'weather' | 'timer' | 'clock'

export function SpatialDemo() {
  const { space, createCard, updateCard, setPan, setZoom, deleteAllCards, toolMode, setToolMode } = useSpatialStore()
  const [openMiniApp, setOpenMiniApp] = useState<MiniApp | null>(null)
  const [instructionsExpanded, setInstructionsExpanded] = useState(false)
  const [showTimer, setShowTimer] = useState(true)
  const [showFlipClock, setShowFlipClock] = useState(true)
  const [showCrumpit, setShowCrumpit] = useState(false)
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
      const modalOpen = showCommandPalette || showKeyboardGuide || showCrumpit || showPlan
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
          setShowCrumpit(false)
          setShowPlan(false)
          break
        case '2':
          e.preventDefault()
          // CRUMPIT mode
          setShowPlan(false)
          setShowCrumpit(true)
          break
        case '3':
          e.preventDefault()
          // PLAN mode
          setShowCrumpit(false)
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
          } else if (showCrumpit) {
            setShowCrumpit(false)
          } else if (showPlan) {
            setShowPlan(false)
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [space, showCommandPalette, showKeyboardGuide, showCrumpit, showPlan, setToolMode, createCard, setZoom])

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
  const handleNavigateToLandmark = (x: number, y: number) => {
    if (!space) return

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

  // Initialize bench demo on first load
  useEffect(() => {
    if (!space || hasInitialized.current) return

    // Check if demo already exists - prevent re-initialization
    const hasBenchDemo = space.cards.some(card => card.name === 'The Bench')
    if (hasBenchDemo || space.cards.length > 0) return

    // Mark as initialized to prevent re-running
    hasInitialized.current = true

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
      <Space spaceId={SPACE_ID} />

      {/* Floating Tool Button - tap to open, hold to move */}
      <ToolButton onRecenter={handleRecenter} />

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
          title="Open Plan - today view"
        >
          Plan
        </button>
        <button
          onClick={() => setShowCrumpit(true)}
          className="button"
          style={{ fontSize: 14, fontWeight: 600, background: '#000', color: 'white' }}
          title="Open Crumpit task triage board"
        >
          Crumpit
        </button>
        <button
          onClick={handleExport}
          className="button"
          style={{ fontSize: 14, fontWeight: 600, background: '#3b82f6', color: 'white' }}
          title="Export space to JSON"
        >
          Export
        </button>
        <button
          onClick={handleImport}
          className="button"
          style={{ fontSize: 14, fontWeight: 600, background: '#8b5cf6', color: 'white' }}
          title="Import space from JSON"
        >
          Import
        </button>
        <button
          onClick={() => {
            if (confirm('Delete all cards? This cannot be undone.')) {
              deleteAllCards()
            }
          }}
          className="button"
          style={{ fontSize: 14, fontWeight: 600, background: '#ff4444', color: 'white' }}
        >
          Clear All
        </button>
      </div>

      {/* Crumpit Board modal */}
      {showCrumpit && (
        <CrumpitBoard onClose={() => setShowCrumpit(false)} />
      )}

      {/* Plan Board modal */}
      {showPlan && (
        <PlanBoard onClose={() => setShowPlan(false)} />
      )}

      {/* Command Palette */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onShowCrumpit={() => setShowCrumpit(true)}
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
