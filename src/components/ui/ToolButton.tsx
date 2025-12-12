/**
 * ToolButton - Floating draggable tool menu
 * Tap to open, hold to move
 * Consolidates tools from ControlPanel, PrimitivesPalette, and MiniAppsPalette
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { useSpatialStore } from '../../stores/spatialStore'
import { MIN_ZOOM, MAX_ZOOM } from '../../utils/geometry'
import './ToolButton.css'

// Tool categories
type ToolCategory = 'modes' | 'shapes' | 'apps' | 'view' | 'data'

interface ToolButtonProps {
  onRecenter?: () => void
  onExport?: () => void
  onImport?: () => void
  onClearAll?: () => void
  // App visibility toggles
  showTimer?: boolean
  onToggleTimer?: () => void
  showFlipClock?: boolean
  onToggleFlipClock?: () => void
  showWeather?: boolean
  onToggleWeather?: () => void
  showGraph?: boolean
  onToggleGraph?: () => void
}

export function ToolButton({
  onRecenter,
  onExport,
  onImport,
  onClearAll,
  showTimer,
  onToggleTimer,
  showFlipClock,
  onToggleFlipClock,
  showWeather,
  onToggleWeather,
  showGraph,
  onToggleGraph,
}: ToolButtonProps) {
  const { toolMode, setToolMode, space, setZoom } = useSpatialStore()

  const [isOpen, setIsOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  // Position in bottom-left corner with inset
  const [position, setPosition] = useState({ x: 20, y: window.innerHeight - 80 })
  const [activeCategory, setActiveCategory] = useState<ToolCategory | null>(null)

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
  const handleModeChange = (mode: 'hand' | 'select' | 'draw') => {
    setToolMode(mode)
  }

  const handleZoom = (delta: number) => {
    const currentZoom = space?.zoom || 1
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, currentZoom + delta))
    setZoom(newZoom)
  }

  // Mode icons
  const modeIcon = {
    hand: '✋',
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

      {/* Expanded menu - opens upward when near bottom of screen */}
      {isOpen && (
        <div className={`tool-button-menu ${position.y > window.innerHeight / 2 ? 'tool-button-menu--upward' : ''}`}>
          {/* Category tabs */}
          <div className="tool-button-categories">
            <button
              className={`tool-category-tab ${activeCategory === 'modes' ? 'tool-category-tab--active' : ''}`}
              onClick={() => setActiveCategory(activeCategory === 'modes' ? null : 'modes')}
              title="Interaction modes"
            >
              {modeIcon[toolMode]}
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
              title="Mini apps & gadgets"
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
            <button
              className={`tool-category-tab ${activeCategory === 'data' ? 'tool-category-tab--active' : ''}`}
              onClick={() => setActiveCategory(activeCategory === 'data' ? null : 'data')}
              title="Import/Export"
            >
              💾
            </button>
          </div>

          {/* Category content */}
          {activeCategory === 'modes' && (
            <div className="tool-button-panel">
              <div className="tool-panel-title">Mode</div>
              <div className="tool-button-grid">
                <button
                  className={`tool-item ${toolMode === 'hand' ? 'tool-item--active' : ''}`}
                  onClick={() => handleModeChange('hand')}
                >
                  ✋ Pan
                </button>
                <button
                  className={`tool-item ${toolMode === 'select' ? 'tool-item--active' : ''}`}
                  onClick={() => handleModeChange('select')}
                >
                  👆 Select
                </button>
                <button
                  className={`tool-item ${toolMode === 'draw' ? 'tool-item--active' : ''}`}
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
              <div className="tool-panel-title">Gadgets</div>
              <div className="tool-button-grid">
                <button
                  className={`tool-item ${showTimer ? 'tool-item--active' : ''}`}
                  onClick={onToggleTimer}
                >
                  ⏱️ Pomodoro
                </button>
                <button
                  className={`tool-item ${showFlipClock ? 'tool-item--active' : ''}`}
                  onClick={onToggleFlipClock}
                >
                  🕐 Flip Clock
                </button>
                <button
                  className={`tool-item ${showWeather ? 'tool-item--active' : ''}`}
                  onClick={onToggleWeather}
                >
                  🌤️ Weather
                </button>
                <button
                  className={`tool-item ${showGraph ? 'tool-item--active' : ''}`}
                  onClick={onToggleGraph}
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

          {activeCategory === 'data' && (
            <div className="tool-button-panel">
              <div className="tool-panel-title">Data</div>
              <div className="tool-button-grid">
                <button className="tool-item" onClick={onExport}>
                  📤 Export
                </button>
                <button className="tool-item" onClick={onImport}>
                  📥 Import
                </button>
                <button
                  className="tool-item tool-item--danger"
                  onClick={onClearAll}
                >
                  🗑️ Clear All
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
