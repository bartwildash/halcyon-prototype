/**
 * LandmarkNavigator - Quick navigation to spatial landmarks
 *
 * Allows users to quickly jump to different regions of the infinite canvas
 */

import { LANDMARKS } from '../../config/landmarks'
import './LandmarkNavigator.css'

interface LandmarkNavigatorProps {
  onNavigate: (x: number, y: number) => void
}

export function LandmarkNavigator({ onNavigate }: LandmarkNavigatorProps) {
  return (
    <div className="landmark-navigator">
      <div className="landmark-label">Jump to:</div>
      <div className="landmark-buttons">
        {LANDMARKS.map((landmark) => (
          <button
            key={landmark.id}
            className="landmark-button"
            onClick={() => onNavigate(landmark.x, landmark.y)}
            style={{
              borderColor: landmark.color,
            }}
            title={landmark.description}
          >
            <span className="landmark-icon">{landmark.icon}</span>
            <span className="landmark-name">{landmark.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
