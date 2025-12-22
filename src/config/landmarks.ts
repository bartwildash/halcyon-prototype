/**
 * Halcyon Spatial Landmarks
 *
 * Instead of "modes", Halcyon has physical locations on an infinite canvas.
 * Each landmark has coordinates and defines the terrain/tools for that region.
 *
 * Canvas Layout (4000 x 2500 px, centered in 10000 x 10000 space):
 * - Lake (center): Writing, documents, calm thinking
 * - Mountain NE: Crumpit board, task triage, priorities
 * - Meadow NW: Browser, 3D models, exploration
 * - Canyon W: Timeline, logs, history
 * - Workshop S: Settings, tools, configuration
 */

export interface Landmark {
  id: string
  name: string
  description: string
  /** Center coordinates (relative to canvas center at 5000,5000) */
  x: number
  y: number
  /** Zone bounds */
  width: number
  height: number
  /** Radius of influence for terrain blending */
  radius: number
  /** Terrain shader for this region */
  terrain: 'meadow' | 'mountain' | 'lake' | 'canyon' | 'workshop'
  /** Color for minimap/visual accent */
  color: string
  /** Icon/emoji for landmark nav */
  icon: string
  /** Fixed app at this location (if any) */
  fixedApp?: 'crumpit' | 'drawing' | 'browser' | 'timeline' | 'settings'
}

/**
 * Core Halcyon landmarks
 * Coordinates are relative to the viewport center (0,0)
 * The zone background uses absolute coords (3000-7000 x 3750-6250 in 10000x10000 space)
 */
export const LANDMARKS: Landmark[] = [
  {
    id: 'lake',
    name: 'Lake',
    description: 'Quiet writing surface at the center',
    x: 0,
    y: 0,
    width: 1200,
    height: 900,
    radius: 600,
    terrain: 'lake',
    color: '#60a5fa',
    icon: '🏞️',
    fixedApp: 'drawing',
  },
  {
    id: 'mountain',
    name: 'Mt. Crumpit',
    description: 'Priority triage on the mountain slope',
    x: 1200,
    y: -600,
    width: 1400,
    height: 1000,
    radius: 700,
    terrain: 'mountain',
    color: '#9ca3af',
    icon: '⛰️',
    fixedApp: 'crumpit',
  },
  {
    id: 'meadow',
    name: 'Meadow',
    description: 'Open exploration and 3D space',
    x: -1200,
    y: -600,
    width: 1400,
    height: 1000,
    radius: 700,
    terrain: 'meadow',
    color: '#6ee7b7',
    icon: '🌿',
    fixedApp: 'browser',
  },
  {
    id: 'canyon',
    name: 'Canyon',
    description: 'Timeline of logs and history',
    x: -1500,
    y: 200,
    width: 1000,
    height: 800,
    radius: 500,
    terrain: 'canyon',
    color: '#fdba74',
    icon: '🏜️',
    fixedApp: 'timeline',
  },
  {
    id: 'workshop',
    name: 'Workshop',
    description: 'Tools, settings, and configuration',
    x: 0,
    y: 850,
    width: 1600,
    height: 700,
    radius: 500,
    terrain: 'workshop',
    color: '#78716c',
    icon: '🔧',
    fixedApp: 'settings',
  },
]

/**
 * Get landmark by ID
 */
export function getLandmarkById(id: string): Landmark | undefined {
  return LANDMARKS.find(l => l.id === id)
}

/**
 * Get the closest landmark to a given position
 */
export function getClosestLandmark(x: number, y: number): Landmark {
  let closest = LANDMARKS[0]
  let minDistance = Infinity

  for (const landmark of LANDMARKS) {
    const dx = x - landmark.x
    const dy = y - landmark.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance < minDistance) {
      minDistance = distance
      closest = landmark
    }
  }

  return closest
}

/**
 * Get the landmark containing a position (if any)
 */
export function getLandmarkAtPosition(x: number, y: number): Landmark | null {
  for (const landmark of LANDMARKS) {
    // Ellipse hit test using landmark bounds
    const dx = (x - landmark.x) / (landmark.width / 2)
    const dy = (y - landmark.y) / (landmark.height / 2)
    if (dx * dx + dy * dy <= 1) {
      return landmark
    }
  }
  return null
}

/**
 * Get terrain blend weights for a position
 * Returns array of {landmark, weight} sorted by influence
 */
export function getTerrainBlend(x: number, y: number): Array<{ landmark: Landmark; weight: number }> {
  const influences = LANDMARKS.map((landmark) => {
    const dx = x - landmark.x
    const dy = y - landmark.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    // Smooth falloff using inverse square with radius
    const weight = distance < landmark.radius
      ? Math.pow(1 - (distance / landmark.radius), 2)
      : 0

    return { landmark, weight }
  }).filter(({ weight }) => weight > 0.01)

  // Normalize weights
  const totalWeight = influences.reduce((sum, { weight }) => sum + weight, 0)
  const normalized = influences.map(({ landmark, weight }) => ({
    landmark,
    weight: totalWeight > 0 ? weight / totalWeight : 0,
  }))

  // Sort by weight descending
  return normalized.sort((a, b) => b.weight - a.weight)
}

/**
 * Convert viewport-relative coords to canvas absolute coords
 * Canvas is 4000x2500, positioned at 3000,3750 in the 10000x10000 space
 */
export function viewportToCanvasCoords(x: number, y: number): { canvasX: number; canvasY: number } {
  return {
    canvasX: 5000 + x, // Center of 10000 + offset
    canvasY: 5000 + y,
  }
}

/**
 * Convert canvas absolute coords to viewport-relative coords
 */
export function canvasToViewportCoords(canvasX: number, canvasY: number): { x: number; y: number } {
  return {
    x: canvasX - 5000,
    y: canvasY - 5000,
  }
}
