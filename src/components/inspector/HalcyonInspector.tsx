/**
 * HalcyonInspector - Complete element inspection tool
 *
 * Combines:
 * - DOM element highlighting
 * - Spacing visualization
 * - Property panel
 * - Measurement tools
 */

import { useState } from 'react'
import { DOMInspector } from './DOMInspector'
import { PropertyPanel } from './PropertyPanel'
import './HalcyonInspector.css'

interface HalcyonInspectorProps {
  isActive: boolean
  onClose?: () => void
}

interface ElementInfo {
  element: HTMLElement
  bounds: DOMRect
  tag: string
  classes: string[]
  id?: string
}

export function HalcyonInspector({ isActive, onClose }: HalcyonInspectorProps) {
  const [selectedElement, setSelectedElement] = useState<ElementInfo | null>(null)
  const [showSpacing, setShowSpacing] = useState(true)
  const [showProperties, setShowProperties] = useState(false)

  const handleElementSelect = (info: ElementInfo) => {
    setSelectedElement(info)
    setShowProperties(true)
  }

  if (!isActive) return null

  return (
    <div className="halcyon-inspector">
      {/* Inspector overlay */}
      <DOMInspector
        isActive={isActive}
        onElementSelect={handleElementSelect}
      />

      {/* Inspector toolbar */}
      <div className="inspector-toolbar">
        <div className="inspector-mode">
          <span className="inspector-icon">🔍</span>
          <span>Inspector Mode</span>
        </div>

        <div className="inspector-controls">
          <button
            className={`inspector-btn ${showSpacing ? 'active' : ''}`}
            onClick={() => setShowSpacing(!showSpacing)}
            title="Toggle spacing guides"
          >
            📏 Spacing
          </button>

          <button
            className="inspector-btn"
            onClick={onClose}
            title="Exit inspector (Esc)"
          >
            ✕ Exit
          </button>
        </div>
      </div>

      {/* Property panel (right side) */}
      {showProperties && selectedElement && (
        <PropertyPanel
          element={selectedElement.element}
          onClose={() => setShowProperties(false)}
        />
      )}

      {/* Instructions */}
      <div className="inspector-hint">
        Hover to inspect • Click to select • Esc to exit
      </div>
    </div>
  )
}
