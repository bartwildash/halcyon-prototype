/**
 * PropertyPanel - Live CSS property editor
 *
 * Edit selected element's styles in real-time
 */

import { useState, useEffect } from 'react'

interface PropertyPanelProps {
  element: HTMLElement
  onClose: () => void
}

const COMMON_PROPERTIES = [
  'display',
  'position',
  'width',
  'height',
  'margin',
  'padding',
  'background',
  'color',
  'font-size',
  'font-weight',
  'border',
  'border-radius',
  'opacity',
  'transform',
  'z-index',
]

export function PropertyPanel({ element, onClose }: PropertyPanelProps) {
  const [properties, setProperties] = useState<Record<string, string>>({})

  useEffect(() => {
    const styles = window.getComputedStyle(element)
    const props: Record<string, string> = {}

    COMMON_PROPERTIES.forEach(prop => {
      props[prop] = styles.getPropertyValue(prop)
    })

    setProperties(props)
  }, [element])

  const handlePropertyChange = (property: string, value: string) => {
    element.style.setProperty(property, value)
    setProperties(prev => ({ ...prev, [property]: value }))
  }

  const elementLabel = element.id
    ? `#${element.id}`
    : `${element.tagName.toLowerCase()}${element.classList.length > 0 ? `.${element.classList[0]}` : ''}`

  return (
    <div className="property-panel">
      <div className="property-panel-header">
        <h3>{elementLabel}</h3>
        <button onClick={onClose} className="property-panel-close">
          ✕
        </button>
      </div>

      <div className="property-panel-content">
        {COMMON_PROPERTIES.map(prop => (
          <div key={prop} className="property-row">
            <label className="property-label">{prop}</label>
            <input
              type="text"
              className="property-input"
              value={properties[prop] || ''}
              onChange={(e) => handlePropertyChange(prop, e.target.value)}
              placeholder="auto"
            />
          </div>
        ))}
      </div>

      <div className="property-panel-footer">
        <button
          onClick={() => {
            // Reset all inline styles
            element.removeAttribute('style')
            setProperties({})
          }}
          className="property-reset-btn"
        >
          Reset Styles
        </button>
      </div>
    </div>
  )
}
