/**
 * DOMInspector - VisBug-style element inspector for Halcyon
 *
 * Hover to highlight elements, click to select, shows element info
 * Built with Konva overlay for clean separation from app DOM
 */

import { useEffect, useRef, useState } from 'react'
import { Stage, Layer, Rect, Text, Line } from 'react-konva'
import type Konva from 'konva'

interface ElementInfo {
  element: HTMLElement
  bounds: DOMRect
  tag: string
  classes: string[]
  id?: string
}

interface DOMInspectorProps {
  isActive: boolean
  onElementSelect?: (info: ElementInfo) => void
}

export function DOMInspector({ isActive, onElementSelect }: DOMInspectorProps) {
  const stageRef = useRef<Konva.Stage>(null)
  const [hoveredElement, setHoveredElement] = useState<ElementInfo | null>(null)
  const [selectedElement, setSelectedElement] = useState<ElementInfo | null>(null)

  useEffect(() => {
    if (!isActive) {
      setHoveredElement(null)
      return
    }

    const handleMouseMove = (e: MouseEvent) => {
      // Find element under cursor
      const element = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement
      if (!element || element === document.body) {
        setHoveredElement(null)
        return
      }

      // Skip the inspector canvas itself
      if (element.closest('.dom-inspector')) {
        setHoveredElement(null)
        return
      }

      const bounds = element.getBoundingClientRect()
      const info: ElementInfo = {
        element,
        bounds,
        tag: element.tagName.toLowerCase(),
        classes: Array.from(element.classList),
        id: element.id || undefined,
      }

      setHoveredElement(info)
    }

    const handleClick = (e: MouseEvent) => {
      if (hoveredElement) {
        e.preventDefault()
        e.stopPropagation()
        setSelectedElement(hoveredElement)
        onElementSelect?.(hoveredElement)
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('click', handleClick, true) // Capture phase

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('click', handleClick, true)
    }
  }, [isActive, hoveredElement, onElementSelect])

  if (!isActive) return null

  const renderHighlight = (info: ElementInfo | null, color: string, label: string) => {
    if (!info) return null

    const { bounds, tag, classes, id } = info
    const labelText = id
      ? `#${id}`
      : `${tag}${classes.length > 0 ? `.${classes[0]}` : ''}`

    return (
      <>
        {/* Highlight box */}
        <Rect
          x={bounds.left}
          y={bounds.top}
          width={bounds.width}
          height={bounds.height}
          stroke={color}
          strokeWidth={2}
          fill={`${color}20`} // 20% opacity
          listening={false}
        />

        {/* Element label */}
        <Rect
          x={bounds.left}
          y={bounds.top - 24}
          width={labelText.length * 8 + 16}
          height={20}
          fill={color}
          cornerRadius={4}
          listening={false}
        />
        <Text
          x={bounds.left + 8}
          y={bounds.top - 20}
          text={labelText}
          fontSize={12}
          fill="#fff"
          fontFamily="monospace"
          listening={false}
        />

        {/* Size indicator */}
        <Text
          x={bounds.left + 8}
          y={bounds.top + 8}
          text={`${Math.round(bounds.width)} × ${Math.round(bounds.height)}`}
          fontSize={11}
          fill={color}
          fontFamily="monospace"
          fontStyle="bold"
          listening={false}
        />
      </>
    )
  }

  return (
    <div className="dom-inspector" style={{ pointerEvents: 'none' }}>
      <Stage
        ref={stageRef}
        width={window.innerWidth}
        height={window.innerHeight}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 9999,
          pointerEvents: 'none',
        }}
      >
        <Layer>
          {/* Hovered element (blue) */}
          {renderHighlight(hoveredElement, '#00aaff', 'hover')}

          {/* Selected element (green) */}
          {renderHighlight(selectedElement, '#00ff88', 'selected')}

          {/* Crosshair cursor */}
          {hoveredElement && (
            <>
              <Line
                points={[0, hoveredElement.bounds.top + hoveredElement.bounds.height / 2, window.innerWidth, hoveredElement.bounds.top + hoveredElement.bounds.height / 2]}
                stroke="#00aaff"
                strokeWidth={1}
                dash={[5, 5]}
                opacity={0.3}
                listening={false}
              />
              <Line
                points={[hoveredElement.bounds.left + hoveredElement.bounds.width / 2, 0, hoveredElement.bounds.left + hoveredElement.bounds.width / 2, window.innerHeight]}
                stroke="#00aaff"
                strokeWidth={1}
                dash={[5, 5]}
                opacity={0.3}
                listening={false}
              />
            </>
          )}
        </Layer>
      </Stage>
    </div>
  )
}
