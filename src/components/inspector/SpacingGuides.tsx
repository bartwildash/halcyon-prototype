/**
 * SpacingGuides - Visualize margin and padding like browser DevTools
 *
 * Orange = margin
 * Green = padding
 * Blue = content
 */

import { Layer, Rect, Text } from 'react-konva'

interface SpacingGuidesProps {
  element: HTMLElement | null
}

export function SpacingGuides({ element }: SpacingGuidesProps) {
  if (!element) return null

  const bounds = element.getBoundingClientRect()
  const styles = window.getComputedStyle(element)

  // Parse spacing values
  const margin = {
    top: parseFloat(styles.marginTop),
    right: parseFloat(styles.marginRight),
    bottom: parseFloat(styles.marginBottom),
    left: parseFloat(styles.marginLeft),
  }

  const padding = {
    top: parseFloat(styles.paddingTop),
    right: parseFloat(styles.paddingRight),
    bottom: parseFloat(styles.paddingBottom),
    left: parseFloat(styles.paddingLeft),
  }

  return (
    <Layer>
      {/* Margin (orange) */}
      {margin.top > 0 && (
        <Rect
          x={bounds.left}
          y={bounds.top - margin.top}
          width={bounds.width}
          height={margin.top}
          fill="#ff9500"
          opacity={0.3}
          listening={false}
        />
      )}
      {margin.right > 0 && (
        <Rect
          x={bounds.right}
          y={bounds.top}
          width={margin.right}
          height={bounds.height}
          fill="#ff9500"
          opacity={0.3}
          listening={false}
        />
      )}
      {margin.bottom > 0 && (
        <Rect
          x={bounds.left}
          y={bounds.bottom}
          width={bounds.width}
          height={margin.bottom}
          fill="#ff9500"
          opacity={0.3}
          listening={false}
        />
      )}
      {margin.left > 0 && (
        <Rect
          x={bounds.left - margin.left}
          y={bounds.top}
          width={margin.left}
          height={bounds.height}
          fill="#ff9500"
          opacity={0.3}
          listening={false}
        />
      )}

      {/* Padding (green) */}
      {padding.top > 0 && (
        <Rect
          x={bounds.left}
          y={bounds.top}
          width={bounds.width}
          height={padding.top}
          fill="#00ff88"
          opacity={0.3}
          listening={false}
        />
      )}
      {padding.right > 0 && (
        <Rect
          x={bounds.right - padding.right}
          y={bounds.top}
          width={padding.right}
          height={bounds.height}
          fill="#00ff88"
          opacity={0.3}
          listening={false}
        />
      )}
      {padding.bottom > 0 && (
        <Rect
          x={bounds.left}
          y={bounds.bottom - padding.bottom}
          width={bounds.width}
          height={padding.bottom}
          fill="#00ff88"
          opacity={0.3}
          listening={false}
        />
      )}
      {padding.left > 0 && (
        <Rect
          x={bounds.left}
          y={bounds.top}
          width={padding.left}
          height={bounds.height}
          fill="#00ff88"
          opacity={0.3}
          listening={false}
        />
      )}

      {/* Spacing labels */}
      {margin.top > 5 && (
        <Text
          x={bounds.left + bounds.width / 2 - 15}
          y={bounds.top - margin.top / 2 - 6}
          text={`${Math.round(margin.top)}`}
          fontSize={11}
          fill="#ff9500"
          fontFamily="monospace"
          fontStyle="bold"
          listening={false}
        />
      )}
      {padding.top > 5 && (
        <Text
          x={bounds.left + bounds.width / 2 - 15}
          y={bounds.top + padding.top / 2 - 6}
          text={`${Math.round(padding.top)}`}
          fontSize={11}
          fill="#00ff88"
          fontFamily="monospace"
          fontStyle="bold"
          listening={false}
        />
      )}
    </Layer>
  )
}
