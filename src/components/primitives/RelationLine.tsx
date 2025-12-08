// RelationLine - Cognitive graph connections
// Faint curved lines between entities

import { useMemo } from 'react'
import type { SpatialCoords } from '../../types/entities'
import './RelationLine.css'

interface RelationLineProps {
  id: string
  from: SpatialCoords
  to: SpatialCoords
  isDirected?: boolean // Has arrow?
  isSelected?: boolean
  label?: string
  onSelect?: (id: string) => void
}

export function RelationLine({
  id,
  from,
  to,
  isDirected = false,
  isSelected = false,
  label,
  onSelect,
}: RelationLineProps) {
  // Calculate smooth curve path
  const path = useMemo(() => {
    const dx = to.x - from.x
    const dy = to.y - from.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    // Control points for smooth curve
    const curvature = Math.min(distance * 0.25, 100)
    const midX = (from.x + to.x) / 2
    const midY = (from.y + to.y) / 2

    // Perpendicular offset for curve
    const offsetX = (-dy / distance) * curvature
    const offsetY = (dx / distance) * curvature

    const controlX = midX + offsetX
    const controlY = midY + offsetY

    return `M ${from.x} ${from.y} Q ${controlX} ${controlY} ${to.x} ${to.y}`
  }, [from, to])

  // Calculate viewBox to contain the entire path
  const viewBox = useMemo(() => {
    const minX = Math.min(from.x, to.x) - 50
    const minY = Math.min(from.y, to.y) - 50
    const maxX = Math.max(from.x, to.x) + 50
    const maxY = Math.max(from.y, to.y) + 50
    const width = maxX - minX
    const height = maxY - minY

    return { x: minX, y: minY, width, height }
  }, [from, to])

  // Label position (midpoint of curve)
  const labelPos = useMemo(() => {
    const dx = to.x - from.x
    const dy = to.y - from.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    const curvature = Math.min(distance * 0.25, 100)
    const midX = (from.x + to.x) / 2
    const midY = (from.y + to.y) / 2
    const offsetX = (-dy / distance) * curvature
    const offsetY = (dx / distance) * curvature

    return {
      x: midX + offsetX,
      y: midY + offsetY,
    }
  }, [from, to])

  return (
    <div
      className={`relation-line ${isSelected ? 'selected' : ''}`}
      data-relation-id={id}
      onClick={() => onSelect?.(id)}
    >
      <svg
        width={viewBox.width}
        height={viewBox.height}
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
        className="relation-svg"
      >
        <defs>
          {/* Arrow marker for directed relations */}
          <marker
            id={`arrow-${id}`}
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L0,6 L9,3 z" fill="#666666" />
          </marker>
        </defs>

        {/* Main curve path */}
        <path
          d={path}
          className="relation-path"
          markerEnd={isDirected ? `url(#arrow-${id})` : undefined}
        />

        {/* Hit area for selection (wider invisible path) */}
        <path d={path} className="relation-hit-area" />
      </svg>

      {/* Optional label */}
      {label && (
        <div
          className="relation-label"
          style={{
            left: labelPos.x,
            top: labelPos.y,
          }}
        >
          {label}
        </div>
      )}
    </div>
  )
}
