// Connection Component - SVG path between cards
// Follows Kinopio's "patch cable" aesthetic

import { useMemo } from 'react'
import type { Connection as ConnectionType, Card } from '../../types/spatial'
import { getCardCenter, getConnectionPath } from '../../utils/geometry'

interface ConnectionProps {
  connection: ConnectionType
  startCard: Card
  endCard: Card
  isSelected: boolean
  onSelect: () => void
}

export function Connection({
  connection,
  startCard,
  endCard,
  isSelected,
  onSelect,
}: ConnectionProps) {
  const path = useMemo(() => {
    const start = getCardCenter(startCard)
    const end = getCardCenter(endCard)
    return getConnectionPath(start, end, connection.path === 'curved')
  }, [startCard, endCard, connection.path])

  const color = connection.color || 'var(--connection-color, #94a3b8)'
  const arrowId = `arrowhead-${connection.id}`

  return (
    <g className="spatial-connection">
      {/* Arrow head marker definition */}
      <defs>
        <marker
          id={arrowId}
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <polygon
            points="0 0, 10 3, 0 6"
            fill={isSelected ? 'var(--accent-color, #3b82f6)' : color}
          />
        </marker>
      </defs>

      <path
        d={path}
        stroke={isSelected ? 'var(--accent-color, #3b82f6)' : color}
        strokeWidth={isSelected ? 3 : 2}
        fill="none"
        markerEnd={`url(#${arrowId})`}
        onClick={(e) => {
          e.stopPropagation()
          onSelect()
        }}
        style={{
          cursor: 'pointer',
          transition: 'stroke 0.15s, stroke-width 0.15s',
        }}
      />
      {connection.label && (
        <text
          x={(getCardCenter(startCard).x + getCardCenter(endCard).x) / 2}
          y={(getCardCenter(startCard).y + getCardCenter(endCard).y) / 2}
          fill={color}
          fontSize={12}
          textAnchor="middle"
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          {connection.label}
        </text>
      )}
    </g>
  )
}
