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
export function screenToCanvas(
  screenX: number,
  screenY: number,
  zoom: number,
  scrollX: number,
  scrollY: number
): Position {
  return {
    x: (screenX - scrollX) / zoom,
    y: (screenY - scrollY) / zoom,
  }
}

// Convert canvas coordinates to screen coordinates
export function canvasToScreen(
  canvasX: number,
  canvasY: number,
  zoom: number,
  scrollX: number,
  scrollY: number
): Position {
  return {
    x: canvasX * zoom + scrollX,
    y: canvasY * zoom + scrollY,
  }
}

// Clamp zoom level to valid range
export function clampZoom(zoom: number): number {
  return Math.max(0.1, Math.min(3, zoom))
}

// Viewport culling - check if card is visible in viewport
export function isCardInViewport(
  card: Card,
  viewportX: number,
  viewportY: number,
  viewportWidth: number,
  viewportHeight: number,
  zoom: number,
  margin: number = 200 // Render cards slightly outside viewport
): boolean {
  const cardWidth = card.width || 200
  const cardHeight = card.height || 100

  // Convert viewport bounds to canvas coordinates
  const viewportLeft = -viewportX / zoom - margin
  const viewportTop = -viewportY / zoom - margin
  const viewportRight = (-viewportX + viewportWidth) / zoom + margin
  const viewportBottom = (-viewportY + viewportHeight) / zoom + margin

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
export function zoomTowardPoint(
  cursorX: number,
  cursorY: number,
  oldZoom: number,
  newZoom: number,
  oldScrollX: number,
  oldScrollY: number
): Position {
  // Formula: newScroll = cursorPos - (cursorPos - oldScroll) * (newZoom / oldZoom)
  const zoomRatio = newZoom / oldZoom
  return {
    x: cursorX - (cursorX - oldScrollX) * zoomRatio,
    y: cursorY - (cursorY - oldScrollY) * zoomRatio,
  }
}
