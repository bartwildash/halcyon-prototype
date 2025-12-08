/**
 * PrimitivesPalette - Floating tool palette with primitive/cave painting aesthetic
 *
 * Quick access to drawing primitives and spatial tools
 * Inspired by ancient cave paintings and early symbolic communication
 */

import { useState } from 'react'
import './PrimitivesPalette.css'

export type PrimitiveTool =
  | 'hand'      // Pan/navigate
  | 'circle'    // Draw circle
  | 'line'      // Draw line/arrow
  | 'spiral'    // Draw spiral/organic shape
  | 'dot'       // Place dot/marker
  | 'wave'      // Draw wavy line
  | 'sun'       // Radial burst
  | 'hand-print' // Stamp/mark

interface PrimitivesPaletteProps {
  activeTool?: PrimitiveTool
  onToolSelect: (tool: PrimitiveTool) => void
  onClose?: () => void
}

const PRIMITIVE_SYMBOLS = {
  hand: '🖐',
  circle: '◯',
  line: '—',
  spiral: '🌀',
  dot: '•',
  wave: '〰',
  sun: '☀',
  'hand-print': '👋',
}

const TOOL_LABELS = {
  hand: 'Navigate',
  circle: 'Circle',
  line: 'Line',
  spiral: 'Spiral',
  dot: 'Mark',
  wave: 'Wave',
  sun: 'Radial',
  'hand-print': 'Stamp',
}

export function PrimitivesPalette({
  activeTool = 'hand',
  onToolSelect,
  onClose,
}: PrimitivesPaletteProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  const handleToolSelect = (tool: PrimitiveTool) => {
    onToolSelect(tool)
    if (tool !== 'hand') {
      setIsExpanded(false) // Collapse after selecting a drawing tool
    }
  }

  return (
    <div className={`primitives-palette ${isExpanded ? 'expanded' : 'collapsed'}`}>
      {/* Main toggle button */}
      <button
        className="primitives-toggle"
        onClick={toggleExpanded}
        title="Primitives"
        aria-label="Toggle primitives palette"
      >
        <span className="primitive-icon cave-art">
          {isExpanded ? '×' : PRIMITIVE_SYMBOLS[activeTool]}
        </span>
      </button>

      {/* Expanded tool grid */}
      {isExpanded && (
        <div className="primitives-grid">
          {(Object.keys(PRIMITIVE_SYMBOLS) as PrimitiveTool[]).map((tool) => (
            <button
              key={tool}
              className={`primitive-button ${activeTool === tool ? 'active' : ''}`}
              onClick={() => handleToolSelect(tool)}
              title={TOOL_LABELS[tool]}
              aria-label={TOOL_LABELS[tool]}
            >
              <span className="primitive-icon cave-art">
                {PRIMITIVE_SYMBOLS[tool]}
              </span>
              <span className="primitive-label">{TOOL_LABELS[tool]}</span>
            </button>
          ))}
        </div>
      )}

      {/* Cave painting texture overlay */}
      <div className="cave-texture" aria-hidden="true" />
    </div>
  )
}
