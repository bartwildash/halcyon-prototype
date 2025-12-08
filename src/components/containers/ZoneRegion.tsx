// ZoneRegion - Spatial macro-areas with landmarks
// Implements Zone interface guidance

import type { SpatialBounds } from '../../types/entities'
import './ZoneRegion.css'

interface ZoneRegionProps {
  id: string
  title?: string
  bounds: SpatialBounds
  landmark?: string // emoji or icon
  pattern?: 'dots' | 'grid' | 'none'
  isActive?: boolean
  children?: React.ReactNode
}

export function ZoneRegion({
  id,
  title,
  bounds,
  landmark,
  pattern = 'dots',
  isActive = false,
  children,
}: ZoneRegionProps) {
  const landmarkIcons: Record<string, string> = {
    work: '🏔️',
    home: '🏡',
    projects: '⛰️',
    health: '🌲',
    learning: '📚',
    creative: '🎨',
    social: '👥',
    archive: '📦',
  }

  const icon = landmark ? landmarkIcons[landmark] || landmark : undefined

  return (
    <div
      className={`zone-region ${isActive ? 'active' : 'inactive'} pattern-${pattern}`}
      data-zone-id={id}
      style={{
        left: bounds.x,
        top: bounds.y,
        width: bounds.width,
        height: bounds.height,
      }}
    >
      {/* Faint background with optional pattern */}
      <div className="zone-background" />

      {/* Light border, no strong edges */}
      <div className="zone-border" />

      {/* Optional landmark icon for spatial memory */}
      {icon && (
        <div className="zone-landmark">
          <span className="landmark-icon">{icon}</span>
          {title && <span className="landmark-label">{title}</span>}
        </div>
      )}

      {/* Zone title (top-left) */}
      {title && !icon && (
        <div className="zone-title">
          <h3>{title}</h3>
        </div>
      )}

      {/* Zone content */}
      <div className="zone-content">{children}</div>

      {/* Fog overlay when inactive */}
      {!isActive && <div className="zone-fog" />}
    </div>
  )
}
