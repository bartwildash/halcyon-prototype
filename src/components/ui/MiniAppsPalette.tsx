/**
 * MiniAppsPalette - Floating palette for mini applications
 *
 * Quick access to small, focused tools that enhance the spatial canvas
 */

import { useState } from 'react'
import './MiniAppsPalette.css'

export type MiniApp =
  | 'graph'      // Network graph view of connections
  | 'weather'    // Current weather conditions
  | 'timer'      // Pomodoro/focus timer
  | 'search'     // Search cards
  | 'capture'    // Quick capture inbox

interface MiniAppsPaletteProps {
  onAppLaunch: (app: MiniApp) => void
  onClose?: () => void
}

const MINI_APP_ICONS = {
  graph: '🕸️',
  weather: '🌡️',
  timer: '⏱️',
  search: '🔍',
  capture: '📝',
}

const MINI_APP_LABELS = {
  graph: 'Graph View',
  weather: 'Weather',
  timer: 'Timer',
  search: 'Search',
  capture: 'Capture',
}

export function MiniAppsPalette({ onAppLaunch, onClose }: MiniAppsPaletteProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  const handleAppLaunch = (app: MiniApp) => {
    onAppLaunch(app)
    setIsExpanded(false) // Collapse after launching
  }

  return (
    <div className={`miniapps-palette ${isExpanded ? 'expanded' : 'collapsed'}`}>
      {/* Main toggle button */}
      <button
        className="miniapps-toggle"
        onClick={toggleExpanded}
        title="Mini Apps"
        aria-label="Toggle mini apps palette"
      >
        <span className="miniapp-icon">
          {isExpanded ? '×' : '⚡'}
        </span>
      </button>

      {/* Expanded app grid */}
      {isExpanded && (
        <div className="miniapps-grid">
          {(Object.keys(MINI_APP_ICONS) as MiniApp[]).map((app) => (
            <button
              key={app}
              className="miniapp-button"
              onClick={() => handleAppLaunch(app)}
              title={MINI_APP_LABELS[app]}
              aria-label={MINI_APP_LABELS[app]}
            >
              <span className="miniapp-icon">{MINI_APP_ICONS[app]}</span>
              <span className="miniapp-label">{MINI_APP_LABELS[app]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
