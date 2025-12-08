/**
 * Zoom Controls Component
 *
 * UI buttons for camera zoom control
 * Shows current zoom level
 */

import './ZoomControls.css'

interface ZoomControlsProps {
  zoom: number
  onZoomIn: () => void
  onZoomOut: () => void
  onReset: () => void
}

export function ZoomControls({ zoom, onZoomIn, onZoomOut, onReset }: ZoomControlsProps) {
  const zoomPercent = Math.round(zoom * 100)

  return (
    <div className="zoom-controls">
      <button
        className="zoom-button"
        onClick={onZoomIn}
        title="Zoom in (+)"
        aria-label="Zoom in"
      >
        +
      </button>

      <button
        className="zoom-reset"
        onClick={onReset}
        title="Reset zoom (0)"
        aria-label="Reset zoom"
      >
        {zoomPercent}%
      </button>

      <button
        className="zoom-button"
        onClick={onZoomOut}
        title="Zoom out (-)"
        aria-label="Zoom out"
      >
        −
      </button>
    </div>
  )
}
