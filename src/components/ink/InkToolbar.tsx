/**
 * InkToolbar - Drawing tools and brush controls
 *
 * Provides mode switching (pan vs draw) and brush customization
 */

import { useState } from 'react'
import type { InkBrush } from '../../types/ink'
import { BRUSH_PRESETS } from '../../types/ink'
import './InkToolbar.css'

export type CanvasMode = 'pan' | 'draw' | 'select'

interface InkToolbarProps {
  mode: CanvasMode
  onModeChange: (mode: CanvasMode) => void
  brush: InkBrush
  onBrushChange: (brush: InkBrush) => void
  onUndo?: () => void
  onClear?: () => void
}

export function InkToolbar({
  mode,
  onModeChange,
  brush,
  onBrushChange,
  onUndo,
  onClear,
}: InkToolbarProps) {
  const [showBrushMenu, setShowBrushMenu] = useState(false)

  return (
    <div className="ink-toolbar">
      {/* Mode buttons */}
      <div className="ink-toolbar-section">
        <button
          className={`ink-tool-button ${mode === 'pan' ? 'active' : ''}`}
          onClick={() => onModeChange('pan')}
          title="Pan & zoom (Space)"
        >
          ✋
        </button>

        <button
          className={`ink-tool-button ${mode === 'draw' ? 'active' : ''}`}
          onClick={() => onModeChange('draw')}
          title="Draw (D)"
        >
          ✏️
        </button>

        <button
          className={`ink-tool-button ${mode === 'select' ? 'active' : ''}`}
          onClick={() => onModeChange('select')}
          title="Select (V)"
        >
          ↖️
        </button>
      </div>

      {/* Brush tools (only show in draw mode) */}
      {mode === 'draw' && (
        <>
          <div className="ink-toolbar-divider" />

          <div className="ink-toolbar-section">
            {/* Brush preset buttons */}
            <button
              className={`ink-tool-button ${brush.tool === 'pen' ? 'active' : ''}`}
              onClick={() => onBrushChange(BRUSH_PRESETS.pen)}
              title="Pen"
            >
              🖊️
            </button>

            <button
              className={`ink-tool-button ${brush.tool === 'marker' ? 'active' : ''}`}
              onClick={() => onBrushChange(BRUSH_PRESETS.marker)}
              title="Marker"
            >
              🖍️
            </button>

            <button
              className={`ink-tool-button ${brush.tool === 'pencil' ? 'active' : ''}`}
              onClick={() => onBrushChange(BRUSH_PRESETS.pencil)}
              title="Pencil"
            >
              ✎
            </button>

            {/* Brush width */}
            <div className="ink-slider-group">
              <label>Width</label>
              <input
                type="range"
                min="1"
                max="20"
                value={brush.width}
                onChange={(e) => onBrushChange({ ...brush, width: Number(e.target.value) })}
                className="ink-slider"
              />
              <span className="ink-value">{brush.width}px</span>
            </div>

            {/* Brush opacity */}
            <div className="ink-slider-group">
              <label>Opacity</label>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={brush.opacity}
                onChange={(e) => onBrushChange({ ...brush, opacity: Number(e.target.value) })}
                className="ink-slider"
              />
              <span className="ink-value">{Math.round(brush.opacity * 100)}%</span>
            </div>

            {/* Color picker */}
            <div className="ink-color-picker">
              <input
                type="color"
                value={brush.color}
                onChange={(e) => onBrushChange({ ...brush, color: e.target.value })}
                title="Brush color"
              />
            </div>
          </div>

          <div className="ink-toolbar-divider" />

          {/* Drawing actions */}
          <div className="ink-toolbar-section">
            <button
              className="ink-tool-button"
              onClick={onUndo}
              title="Undo (Cmd+Z)"
            >
              ↶
            </button>

            <button
              className="ink-tool-button"
              onClick={onClear}
              title="Clear all"
            >
              🗑️
            </button>
          </div>
        </>
      )}
    </div>
  )
}
