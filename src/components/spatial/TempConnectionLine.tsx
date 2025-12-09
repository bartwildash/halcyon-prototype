// TempConnectionLine - Shows temporary line while dragging to create connection
// Renders a dashed animated line from source card to cursor position

import { useState, useEffect } from 'react'
import { tempConnectionState } from './ConnectionHandle'
import { getConnectionPath } from '../../utils/geometry'

export function TempConnectionLine() {
  const [state, setState] = useState({
    isActive: tempConnectionState.isActive,
    startX: tempConnectionState.startX,
    startY: tempConnectionState.startY,
    endX: tempConnectionState.endX,
    endY: tempConnectionState.endY,
    targetCardId: tempConnectionState.targetCardId,
  })

  useEffect(() => {
    const unsubscribe = tempConnectionState.subscribe(() => {
      setState({
        isActive: tempConnectionState.isActive,
        startX: tempConnectionState.startX,
        startY: tempConnectionState.startY,
        endX: tempConnectionState.endX,
        endY: tempConnectionState.endY,
        targetCardId: tempConnectionState.targetCardId,
      })
    })
    return unsubscribe
  }, [])

  if (!state.isActive) return null

  const path = getConnectionPath(
    { x: state.startX, y: state.startY },
    { x: state.endX, y: state.endY },
    true // curved
  )

  const hasTarget = !!state.targetCardId

  return (
    <g className="temp-connection-line">
      {/* Glow effect when targeting */}
      {hasTarget && (
        <path
          d={path}
          stroke="#3b82f6"
          strokeWidth={6}
          fill="none"
          opacity={0.3}
        />
      )}

      {/* Main line */}
      <path
        d={path}
        stroke={hasTarget ? '#3b82f6' : '#94a3b8'}
        strokeWidth={2}
        strokeDasharray={hasTarget ? 'none' : '8 4'}
        fill="none"
        style={{
          animation: hasTarget ? 'none' : 'dash 0.5s linear infinite',
        }}
      />

      {/* End dot */}
      <circle
        cx={state.endX}
        cy={state.endY}
        r={hasTarget ? 8 : 6}
        fill={hasTarget ? '#3b82f6' : '#94a3b8'}
        stroke="white"
        strokeWidth={2}
      />

      {/* Animation keyframes */}
      <style>{`
        @keyframes dash {
          to {
            stroke-dashoffset: -12;
          }
        }
      `}</style>
    </g>
  )
}
