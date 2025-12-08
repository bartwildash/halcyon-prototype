/**
 * Config Info Component
 *
 * Shows current configuration status
 * Helps users understand if they're using custom config
 */

import { useState } from 'react'
import { hasCustomConfig, config } from '../../config'
import './ConfigInfo.css'

export function ConfigInfo() {
  const isCustom = hasCustomConfig()
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className={`config-info ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <button
        className="config-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
        title={isExpanded ? 'Hide config info' : 'Show config info'}
      >
        {isCustom ? (
          <>
            <span className="config-indicator custom">●</span>
            <span className="config-label-short">Custom</span>
          </>
        ) : (
          <>
            <span className="config-indicator default">●</span>
            <span className="config-label-short">Default</span>
          </>
        )}
      </button>

      {isExpanded && (
        <div className="config-expanded">
          <div className="config-details">
            <div className="config-detail">
              <span className="config-label">Default Mode:</span>
              <span className="config-value">{config.preferences.defaultMode.toUpperCase()}</span>
            </div>
            <div className="config-detail">
              <span className="config-label">Theme:</span>
              <span className="config-value">{config.preferences.defaultTheme}</span>
            </div>
            <div className="config-detail">
              <span className="config-label">Storage:</span>
              <span className="config-value">{config.preferences.defaultStorage}</span>
            </div>
            <div className="config-detail">
              <span className="config-label">Zones:</span>
              <span className="config-value">{config.zones.length} defined</span>
            </div>
          </div>

          {!isCustom && (
            <div className="config-hint">
              <p>To customize:</p>
              <code>cp src/config/personal.example.ts src/config/personal.ts</code>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
