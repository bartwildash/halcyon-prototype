/**
 * Tool Rail Component
 *
 * The "Workbench" - A VisBug-inspired manipulation layer for Halcyon.
 * Provides cognitive ergonomics tools for arranging, inspecting,
 * and understanding spatial structure.
 *
 * Toggleable with ⌘+\ or via Compass.
 */

import { getClosestLandmark } from '../../config/landmarks'
import type { CameraState } from '../../terrain/types'
import './ToolRail.css'

interface ToolRailProps {
  isOpen: boolean
  onClose: () => void
  camera: CameraState
}

interface Tool {
  id: string
  label: string
  icon: string
  description: string
  action: () => void
}

// Mode-specific tool sets
const MEADOW_TOOLS: Tool[] = [
  {
    id: 'select-circle',
    label: 'Circle Select',
    icon: '○',
    description: 'Select items in a circle',
    action: () => console.log('Circle select'),
  },
  {
    id: 'select-rectangle',
    label: 'Box Select',
    icon: '▢',
    description: 'Select items in a rectangle',
    action: () => console.log('Rectangle select'),
  },
  {
    id: 'align',
    label: 'Straighten Things',
    icon: '⫴',
    description: 'Align selected cards',
    action: () => console.log('Align'),
  },
  {
    id: 'cluster',
    label: 'Neaten Pile',
    icon: '◫',
    description: 'Auto-arrange cluster',
    action: () => console.log('Cluster'),
  },
  {
    id: 'links',
    label: 'Draw Lines',
    icon: '⟿',
    description: 'Show connections',
    action: () => console.log('Links'),
  },
  {
    id: 'distances',
    label: 'Show Room',
    icon: '⟷',
    description: 'Display spacing',
    action: () => console.log('Distances'),
  },
  {
    id: 'focus',
    label: 'Gentle Halo',
    icon: '◉',
    description: 'Highlight selection',
    action: () => console.log('Focus'),
  },
]

const MOUNTAIN_TOOLS: Tool[] = [
  {
    id: 'priority-viz',
    label: 'Show Slope',
    icon: '⟋',
    description: 'Visualize priority',
    action: () => console.log('Priority viz'),
  },
  {
    id: 'auto-sort',
    label: 'Sort by Energy',
    icon: '⚡',
    description: 'Auto-arrange by energy level',
    action: () => console.log('Auto-sort'),
  },
  {
    id: 'lift-peak',
    label: 'Lift Higher',
    icon: '△',
    description: 'Promote to NOW quadrant',
    action: () => console.log('Lift to peak'),
  },
  {
    id: 'bubble-size',
    label: 'Size by Weight',
    icon: '⬤',
    description: 'Scale cards by importance',
    action: () => console.log('Bubble size'),
  },
]

const LAKE_TOOLS: Tool[] = [
  {
    id: 'margins',
    label: 'Show Margins',
    icon: '⊞',
    description: 'Inspect spacing',
    action: () => console.log('Margins'),
  },
  {
    id: 'promote',
    label: 'Lift to Card',
    icon: '↑',
    description: 'Paragraph to card',
    action: () => console.log('Promote'),
  },
  {
    id: 'calm',
    label: 'Calm the Water',
    icon: '≈',
    description: 'Reset to defaults',
    action: () => console.log('Calm'),
  },
]

const CANYON_TOOLS: Tool[] = [
  {
    id: 'strata',
    label: 'Show Layers',
    icon: '☰',
    description: 'Visualize time strata',
    action: () => console.log('Strata'),
  },
  {
    id: 'collapse',
    label: 'Fold History',
    icon: '⊟',
    description: 'Collapse old entries',
    action: () => console.log('Collapse'),
  },
  {
    id: 'chains',
    label: 'See Threads',
    icon: '⋯',
    description: 'Highlight causal chains',
    action: () => console.log('Chains'),
  },
  {
    id: 'echo',
    label: 'Echo Past',
    icon: '◐',
    description: 'Timeline overlay',
    action: () => console.log('Echo'),
  },
]

const LANDMARK_TOOLS: Record<string, Tool[]> = {
  meadow: MEADOW_TOOLS,
  lake: LAKE_TOOLS,
  crumpit: MOUNTAIN_TOOLS,
  canyon: CANYON_TOOLS,
}

export function ToolRail({ isOpen, onClose, camera }: ToolRailProps) {
  // Calculate which landmark we're closest to
  const centerX = camera.offsetX + (typeof window !== 'undefined' ? window.innerWidth / 2 : 800)
  const centerY = camera.offsetY + (typeof window !== 'undefined' ? window.innerHeight / 2 : 600)
  const closestLandmark = getClosestLandmark(centerX, centerY)
  const tools = LANDMARK_TOOLS[closestLandmark.id] || MEADOW_TOOLS

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div className="tool-rail-backdrop" onClick={onClose} />

      {/* Rail */}
      <aside className="tool-rail">
        <header className="tool-rail-header">
          <h2 className="tool-rail-title">Workbench</h2>
          <button
            className="tool-rail-close"
            onClick={onClose}
            aria-label="Close workbench"
          >
            ×
          </button>
        </header>

        <div className="tool-rail-mode">
          {closestLandmark.name.toUpperCase()} TOOLS
        </div>

        <nav className="tool-rail-tools">
          {tools.map((tool) => (
            <button
              key={tool.id}
              className="tool-button"
              onClick={tool.action}
              title={tool.description}
            >
              <span className="tool-icon">{tool.icon}</span>
              <span className="tool-label">{tool.label}</span>
            </button>
          ))}
        </nav>

        <footer className="tool-rail-footer">
          <p className="tool-rail-hint">
            Press <kbd>⌘</kbd> + <kbd>\</kbd> to toggle
          </p>
        </footer>
      </aside>
    </>
  )
}
