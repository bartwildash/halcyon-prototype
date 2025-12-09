/**
 * ToolButton - Floating draggable tool menu
 * Tap to open, hold to move
 * Consolidates tools from ControlPanel, PrimitivesPalette, and MiniAppsPalette
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { useSpatialStore } from '../../stores/spatialStore'
import './ToolButton.css'

// Tool categories
type ToolCategory = 'modes' | 'shapes' | 'apps' | 'view'

interface ToolButtonProps {
  onRecenter?: () => void
}

export function ToolButton({ onRecenter }: ToolButtonProps) {
  const { interactionMode, setInteractionMode, space, setZoom } = useSpatialStore()

  const [isOpen, setIsOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState({ x: 20, y: 100 })
  const [activeCategory, setActiveCategory] = useState<ToolCategory | null>(null)
  const [activeApps, setActiveApps] = useState<Set<string>>(new Set())

  const buttonRef = useRef<HTMLDivElement>(null)
  const holdTimer = useRef<number | null>(null)
  const dragStart = useRef({ x: 0, y: 0, buttonX: 0, buttonY: 0 })
  const hasMoved = useRef(false)

  const HOLD_DURATION = 300 // ms to trigger drag mode

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (holdTimer.current) {
        clearTimeout(holdTimer.current)
      }
    }
  }, [])

  // Handle pointer down - start hold timer for drag
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    hasMoved.current = false

    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      buttonX: position.x,
      buttonY: position.y,
    }

    // Start hold timer
    holdTimer.current = window.setTimeout(() => {
      setIsDragging(true)
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    }, HOLD_DURATION)
  }, [position])

  // Handle pointer move - drag if in drag mode
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const dx = e.clientX - dragStart.current.x
    const dy = e.clientY - dragStart.current.y

    // If moved before hold timer, cancel it (user is tapping, not holding)
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      hasMoved.current = true
      if (holdTimer.current && !isDragging) {
        clearTimeout(holdTimer.current)
        holdTimer.current = null
      }
    }

    if (isDragging) {
      const newX = Math.max(0, Math.min(window.innerWidth - 60, dragStart.current.buttonX + dx))
      const newY = Math.max(0, Math.min(window.innerHeight - 60, dragStart.current.buttonY + dy))
      setPosition({ x: newX, y: newY })
    }
  }, [isDragging])

  // Handle pointer up - toggle menu or end drag
  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current)
      holdTimer.current = null
    }

    if (isDragging) {
      setIsDragging(false)
      ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
    } else if (!hasMoved.current) {
      // Tap - toggle menu
      setIsOpen(prev => !prev)
      setActiveCategory(null)
    }
  }, [isDragging])

  // Close menu when clicking outside
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setActiveCategory(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Tool actions
  const handleModeChange = (mode: 'pan' | 'select' | 'draw') => {
    setInteractionMode(mode)
  }

  const handleZoom = (delta: number) => {
    const currentZoom = space?.zoom || 1
    const newZoom = Math.max(0.25, Math.min(2, currentZoom + delta))
    setZoom(newZoom)
  }

  const toggleApp = (appId: string) => {
    setActiveApps(prev => {
      const next = new Set(prev)
      if (next.has(appId)) {
        next.delete(appId)
      } else {
        next.add(appId)
      }
      return next
    })
  }

  // Mode icons
  const modeIcon = {
    pan: '✋',
    select: '👆',
    draw: '✏️',
  }

  return (
    <div
      ref={buttonRef}
      className={`tool-button-container ${isOpen ? 'tool-button-container--open' : ''}`}
      style={{ left: position.x, top: position.y }}
    >
      {/* Main hammer button */}
      <button
        className={`tool-button-main ${isDragging ? 'tool-button-main--dragging' : ''}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        title="Tools (hold to move)"
      >
        🔨
      </button>

      {/* Expanded menu */}
      {isOpen && (
        <div className="tool-button-menu">
          {/* Category tabs */}
          <div className="tool-button-categories">
            <button
              className={`tool-category-tab ${activeCategory === 'modes' ? 'tool-category-tab--active' : ''}`}
              onClick={() => setActiveCategory(activeCategory === 'modes' ? null : 'modes')}
              title="Interaction modes"
            >
              {modeIcon[interactionMode]}
            </button>
            <button
              className={`tool-category-tab ${activeCategory === 'shapes' ? 'tool-category-tab--active' : ''}`}
              onClick={() => setActiveCategory(activeCategory === 'shapes' ? null : 'shapes')}
              title="Drawing shapes"
            >
              ○
            </button>
            <button
              className={`tool-category-tab ${activeCategory === 'apps' ? 'tool-category-tab--active' : ''}`}
              onClick={() => setActiveCategory(activeCategory === 'apps' ? null : 'apps')}
              title="Mini apps"
            >
              📱
            </button>
            <button
              className={`tool-category-tab ${activeCategory === 'view' ? 'tool-category-tab--active' : ''}`}
              onClick={() => setActiveCategory(activeCategory === 'view' ? null : 'view')}
              title="View controls"
            >
              🔍
            </button>
          </div>

          {/* Category content */}
          {activeCategory === 'modes' && (
            <div className="tool-button-panel">
              <div className="tool-panel-title">Mode</div>
              <div className="tool-button-grid">
                <button
                  className={`tool-item ${interactionMode === 'pan' ? 'tool-item--active' : ''}`}
                  onClick={() => handleModeChange('pan')}
                >
                  ✋ Pan
                </button>
                <button
                  className={`tool-item ${interactionMode === 'select' ? 'tool-item--active' : ''}`}
                  onClick={() => handleModeChange('select')}
                >
                  👆 Select
                </button>
                <button
                  className={`tool-item ${interactionMode === 'draw' ? 'tool-item--active' : ''}`}
                  onClick={() => handleModeChange('draw')}
                >
                  ✏️ Draw
                </button>
              </div>
            </div>
          )}

          {activeCategory === 'shapes' && (
            <div className="tool-button-panel">
              <div className="tool-panel-title">Shapes</div>
              <div className="tool-button-grid tool-button-grid--shapes">
                <button className="tool-item tool-item--shape" title="Circle">○</button>
                <button className="tool-item tool-item--shape" title="Line">―</button>
                <button className="tool-item tool-item--shape" title="Spiral">🌀</button>
                <button className="tool-item tool-item--shape" title="Dot">●</button>
                <button className="tool-item tool-item--shape" title="Wave">〰</button>
                <button className="tool-item tool-item--shape" title="Sun">☀</button>
              </div>
              <div className="tool-panel-hint">Tap shape then draw on canvas</div>
            </div>
          )}

          {activeCategory === 'apps' && (
            <div className="tool-button-panel">
              <div className="tool-panel-title">Mini Apps</div>
              <div className="tool-button-grid">
                <button
                  className={`tool-item ${activeApps.has('timer') ? 'tool-item--active' : ''}`}
                  onClick={() => toggleApp('timer')}
                >
                  ⏱️ Timer
                </button>
                <button
                  className={`tool-item ${activeApps.has('clock') ? 'tool-item--active' : ''}`}
                  onClick={() => toggleApp('clock')}
                >
                  🕐 Clock
                </button>
                <button
                  className={`tool-item ${activeApps.has('weather') ? 'tool-item--active' : ''}`}
                  onClick={() => toggleApp('weather')}
                >
                  🌤️ Weather
                </button>
                <button
                  className={`tool-item ${activeApps.has('graph') ? 'tool-item--active' : ''}`}
                  onClick={() => toggleApp('graph')}
                >
                  📊 Graph
                </button>
              </div>
            </div>
          )}

          {activeCategory === 'view' && (
            <div className="tool-button-panel">
              <div className="tool-panel-title">View</div>
              <div className="tool-button-grid">
                <button className="tool-item" onClick={() => handleZoom(-0.25)}>
                  ➖ Zoom Out
                </button>
                <button className="tool-item">
                  {Math.round((space?.zoom || 1) * 100)}%
                </button>
                <button className="tool-item" onClick={() => handleZoom(0.25)}>
                  ➕ Zoom In
                </button>
                <button className="tool-item" onClick={onRecenter}>
                  🎯 Recenter
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
