/**
 * Spatial Navigator
 *
 * Replaces mode switcher. Shows landmarks on the infinite canvas
 * and lets you jump to different locations (Lake, Crumpit, Canyon, Meadow).
 */

import { LANDMARKS } from '../../config/landmarks'
import './SpatialNavigator.css'

interface SpatialNavigatorProps {
  onNavigate: (x: number, y: number) => void
}

export function SpatialNavigator({ onNavigate }: SpatialNavigatorProps) {
  return (
    <nav className="spatial-navigator">
      {LANDMARKS.map((landmark) => (
        <button
          key={landmark.id}
          className="landmark-button"
          onClick={() => onNavigate(landmark.x, landmark.y)}
          title={landmark.description}
          style={{
            borderColor: landmark.color || 'var(--color-border)',
          }}
        >
          <span className="landmark-name">{landmark.name}</span>
          <span className="landmark-coords">
            {landmark.x > 0 ? '+' : ''}{Math.round(landmark.x / 100) / 10}k,{' '}
            {landmark.y > 0 ? '+' : ''}{Math.round(landmark.y / 100) / 10}k
          </span>
        </button>
      ))}
    </nav>
  )
}
