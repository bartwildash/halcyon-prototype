// Geometry utilities for spatial canvas
// Position calculations, collision detection, path generation

import type { Position, Card } from '../types/spatial'

// Get center point of a card
export function getCardCenter(card: Card): Position {
  const width = card.width || 200
  const height = card.height || 100
  return {
    x: card.x + width / 2,
    y: card.y + height / 2,
  }
}

// Generate SVG path for connection between two positions
export function getConnectionPath(
  start: Position,
  end: Position,
  curved: boolean = true
): string {
  if (!curved) {
    return `M ${start.x} ${start.y} L ${end.x} ${end.y}`
  }

  const dx = end.x - start.x
  const dy = end.y - start.y
  const distance = Math.sqrt(dx * dx + dy * dy)

  // Calculate control point for smooth curve
  // Offset perpendicular to the line for a natural curve
  const midX = (start.x + end.x) / 2
  const midY = (start.y + end.y) / 2
  const offset = Math.min(distance * 0.2, 100)

  // Perpendicular offset for curve
  const controlX = midX - (dy / distance) * offset
  const controlY = midY + (dx / distance) * offset

  return `M ${start.x} ${start.y} Q ${controlX} ${controlY} ${end.x} ${end.y}`
}

// Check if a point is inside a card's bounds
export function isPointInCard(point: Position, card: Card): boolean {
  const width = card.width || 200
  const height = card.height || 100
  return (
    point.x >= card.x &&
    point.x <= card.x + width &&
    point.y >= card.y &&
    point.y <= card.y + height
  )
}

// Calculate distance between two points
export function distance(p1: Position, p2: Position): number {
  const dx = p2.x - p1.x
  const dy = p2.y - p1.y
  return Math.sqrt(dx * dx + dy * dy)
}

// Convert screen coordinates to canvas coordinates
// CSS transform is: scale(zoom) translate(scrollX, scrollY)
// So: screenPos = (canvasPos + scroll) * zoom
// Therefore: canvasPos = screenPos / zoom - scroll
export function screenToCanvas(
  screenX: number,
  screenY: number,
  zoom: number,
  scrollX: number,
  scrollY: number
): Position {
  return {
    x: screenX / zoom - scrollX,
    y: screenY / zoom - scrollY,
  }
}

// Convert canvas coordinates to screen coordinates
// CSS transform is: scale(zoom) translate(scrollX, scrollY)
// So: screenPos = (canvasPos + scroll) * zoom
export function canvasToScreen(
  canvasX: number,
  canvasY: number,
  zoom: number,
  scrollX: number,
  scrollY: number
): Position {
  return {
    x: (canvasX + scrollX) * zoom,
    y: (canvasY + scrollY) * zoom,
  }
}

// Zoom constraints - prevent extreme zoom levels
// Min 0.5 (50%) - can see a nice area but not the entire 10000x10000 canvas
// Max 2.0 (200%) - can zoom in for detail but not excessively
export const MIN_ZOOM = 0.5
export const MAX_ZOOM = 2.0

// Clamp zoom level to valid range
export function clampZoom(zoom: number): number {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom))
}

// Viewport culling - check if card is visible in viewport
// Uses screenToCanvas to convert viewport corners to canvas coordinates
export function isCardInViewport(
  card: Card,
  scrollX: number,
  scrollY: number,
  viewportWidth: number,
  viewportHeight: number,
  zoom: number,
  margin: number = 200 // Render cards slightly outside viewport (in canvas coordinates)
): boolean {
  const cardWidth = card.width || 200
  const cardHeight = card.height || 100

  // Convert viewport screen bounds to canvas coordinates
  // screenToCanvas: canvasPos = screenPos / zoom - scroll
  // Screen (0, 0) -> canvas (-scrollX, -scrollY)
  // Screen (viewportWidth, viewportHeight) -> canvas (viewportWidth/zoom - scrollX, viewportHeight/zoom - scrollY)
  const viewportLeft = -scrollX - margin
  const viewportTop = -scrollY - margin
  const viewportRight = viewportWidth / zoom - scrollX + margin
  const viewportBottom = viewportHeight / zoom - scrollY + margin

  // Check if card bounds intersect with viewport bounds
  const cardLeft = card.x
  const cardTop = card.y
  const cardRight = card.x + cardWidth
  const cardBottom = card.y + cardHeight

  return !(
    cardRight < viewportLeft ||
    cardLeft > viewportRight ||
    cardBottom < viewportTop ||
    cardTop > viewportBottom
  )
}

// Calculate new scroll position when zooming toward a point
// The cursor screen position should map to the same canvas position before and after zoom
// Before: canvasPos = cursorX / oldZoom - oldScroll
// After:  canvasPos = cursorX / newZoom - newScroll
// Setting equal: cursorX / oldZoom - oldScroll = cursorX / newZoom - newScroll
// Solving: newScroll = cursorX / newZoom - cursorX / oldZoom + oldScroll
//                    = cursorX * (1/newZoom - 1/oldZoom) + oldScroll
export function zoomTowardPoint(
  cursorX: number,
  cursorY: number,
  oldZoom: number,
  newZoom: number,
  oldScrollX: number,
  oldScrollY: number
): Position {
  return {
    x: cursorX * (1 / newZoom - 1 / oldZoom) + oldScrollX,
    y: cursorY * (1 / newZoom - 1 / oldZoom) + oldScrollY,
  }
}
