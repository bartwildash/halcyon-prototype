/**
 * Halcyon Spatial Landmarks
 *
 * Instead of "modes", Halcyon has physical locations on an infinite canvas.
 * Each landmark has coordinates and defines the terrain/tools for that region.
 */

export interface Landmark {
  id: string
  name: string
  description: string
  /** Center coordinates */
  x: number
  y: number
  /** Radius of influence for terrain blending */
  radius: number
  /** Terrain shader for this region */
  terrain: 'meadow' | 'mountain' | 'lake' | 'canyon'
  /** Color for minimap/visual accent */
  color?: string
}

/**
 * Core Halcyon landmarks
 */
export const LANDMARKS: Landmark[] = [
  {
    id: 'lake',
    name: 'Lake',
    description: 'Quiet writing surface at the center',
    x: 0,
    y: 0,
    radius: 800, // increased for wider influence
    terrain: 'lake',
    color: '#4c7fa4',
  },
  {
    id: 'crumpit',
    name: 'Mt. Crumpit',
    description: 'Priority triage on the mountain slope',
    x: 1400,
    y: 200,
    radius: 900, // increased for more dramatic mountain terrain
    terrain: 'mountain',
    color: '#8b6f4f',
  },
  {
    id: 'canyon',
    name: 'Canyon',
    description: 'Timeline of logs and history',
    x: -800,
    y: 0,
    radius: 700, // increased for visible strata
    terrain: 'canyon',
    color: '#99654a',
  },
  {
    id: 'meadow',
    name: 'Meadow',
    description: 'Open thinking space',
    x: 700,
    y: -600,
    radius: 900, // increased for horizon visibility
    terrain: 'meadow',
    color: '#6d9773',
  },
]

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
