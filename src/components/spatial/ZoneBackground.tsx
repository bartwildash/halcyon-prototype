/**
 * ZoneBackground - Terrain zones for the spatial canvas
 *
 * Creates 5 distinct zones with wavy gradient boundaries:
 * - Lake (center): Blue tones, calm water feeling
 * - Mountain (NE): Rocky grays and earth tones
 * - Meadow (NW): Soft greens, pastoral
 * - Canyon (W): Warm oranges and terracotta
 * - Workshop (S): Industrial grays, workbench feel
 *
 * Canvas dimensions: 4000 x 2500 px (~10 sqm if a card is A4)
 */

import './ZoneBackground.css'

// Zone definitions with positions and colors
export interface Zone {
  id: string
  name: string
  // Center position in canvas coordinates
  x: number
  y: number
  // Zone bounds (elliptical)
  width: number
  height: number
  // Colors for gradient
  colorPrimary: string
  colorSecondary: string
  // Noise/texture intensity (0-1)
  noiseIntensity: number
}

export const ZONES: Zone[] = [
  {
    id: 'lake',
    name: 'Lake',
    // Absolute canvas coords (5000,5000 is center of 10000x10000)
    x: 5000,
    y: 5000,
    width: 1200,
    height: 900,
    colorPrimary: 'rgba(96, 165, 250, 0.35)', // Light blue - more visible
    colorSecondary: 'rgba(59, 130, 246, 0.15)',
    noiseIntensity: 0.3,
  },
  {
    id: 'mountain',
    name: 'Mt. Crumpit',
    // NE: 1200 right, 600 up from center
    x: 5000 + 1200,
    y: 5000 - 600,
    width: 1400,
    height: 1000,
    colorPrimary: 'rgba(156, 163, 175, 0.30)', // Cool gray - more visible
    colorSecondary: 'rgba(107, 114, 128, 0.15)',
    noiseIntensity: 0.5,
  },
  {
    id: 'meadow',
    name: 'Meadow',
    // NW: 1200 left, 600 up from center
    x: 5000 - 1200,
    y: 5000 - 600,
    width: 1400,
    height: 1000,
    colorPrimary: 'rgba(110, 231, 183, 0.30)', // Soft green - more visible
    colorSecondary: 'rgba(52, 211, 153, 0.12)',
    noiseIntensity: 0.2,
  },
  {
    id: 'canyon',
    name: 'Canyon',
    // W: 1500 left, 200 down from center
    x: 5000 - 1500,
    y: 5000 + 200,
    width: 1000,
    height: 800,
    colorPrimary: 'rgba(251, 146, 60, 0.30)', // Warm orange - more visible
    colorSecondary: 'rgba(249, 115, 22, 0.12)',
    noiseIntensity: 0.4,
  },
  {
    id: 'workshop',
    name: 'Workshop',
    // S: center, 850 down
    x: 5000,
    y: 5000 + 850,
    width: 1600,
    height: 700,
    colorPrimary: 'rgba(120, 113, 108, 0.25)', // Stone gray - more visible
    colorSecondary: 'rgba(87, 83, 78, 0.10)',
    noiseIntensity: 0.35,
  },
]

interface ZoneBackgroundProps {
  /** Current zoom level - affects noise visibility */
  zoom?: number
  /** Optional: only show specific zones */
  visibleZones?: string[]
}

export function ZoneBackground({ zoom = 1, visibleZones }: ZoneBackgroundProps) {
  // Filter zones if specified
  const zones = visibleZones
    ? ZONES.filter(z => visibleZones.includes(z.id))
    : ZONES

  // Reduce noise at very zoomed out levels for clarity
  const noiseScale = Math.min(1, zoom * 1.5)

  return (
    <div className="zone-background" aria-hidden="true">
      {/* SVG filter for noise texture */}
      <svg className="zone-noise-filter" aria-hidden="true">
        <defs>
          <filter id="zone-noise">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.65"
              numOctaves="3"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
        </defs>
      </svg>

      {/* Render each zone */}
      {zones.map((zone) => (
        <ZoneRegion key={zone.id} zone={zone} noiseScale={noiseScale} />
      ))}

      {/* Zone labels (visible at certain zoom levels) */}
      {zoom >= 0.5 && zoom <= 1.5 && (
        <div className="zone-labels">
          {zones.map((zone) => (
            <div
              key={`label-${zone.id}`}
              className="zone-label"
              style={{
                left: zone.x,
                top: zone.y - zone.height / 2 - 30,
                opacity: Math.min(1, (zoom - 0.4) * 2),
              }}
            >
              {zone.name}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

interface ZoneRegionProps {
  zone: Zone
  noiseScale: number
}

function ZoneRegion({ zone, noiseScale }: ZoneRegionProps) {
  // Calculate wavy boundary using CSS clip-path with slight randomization
  // This creates organic-looking edges
  const clipPath = generateWavyClipPath(zone)

  return (
    <div
      className={`zone-region zone-region--${zone.id}`}
      style={{
        left: zone.x - zone.width / 2,
        top: zone.y - zone.height / 2,
        width: zone.width,
        height: zone.height,
        '--zone-primary': zone.colorPrimary,
        '--zone-secondary': zone.colorSecondary,
        '--zone-noise-opacity': zone.noiseIntensity * noiseScale,
        clipPath,
      } as React.CSSProperties}
    />
  )
}

/**
 * Generate a wavy clip-path polygon for organic zone boundaries
 * Uses sine waves with slight variations for natural look
 */
function generateWavyClipPath(zone: Zone): string {
  const points: string[] = []
  const segments = 24 // More segments = smoother waves

  // Seed based on zone id for consistent waves
  const seed = zone.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const pseudoRandom = (i: number) => Math.sin(seed * 0.1 + i * 0.7) * 0.5 + 0.5

  // Top edge (left to right)
  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const x = t * 100
    const wave = Math.sin(t * Math.PI * 3 + seed) * 3 * pseudoRandom(i)
    const y = wave
    points.push(`${x.toFixed(1)}% ${y.toFixed(1)}%`)
  }

  // Right edge (top to bottom)
  for (let i = 1; i <= segments; i++) {
    const t = i / segments
    const y = t * 100
    const wave = Math.sin(t * Math.PI * 2.5 + seed * 1.3) * 3 * pseudoRandom(i + 100)
    const x = 100 + wave
    points.push(`${x.toFixed(1)}% ${y.toFixed(1)}%`)
  }

  // Bottom edge (right to left)
  for (let i = segments - 1; i >= 0; i--) {
    const t = i / segments
    const x = t * 100
    const wave = Math.sin(t * Math.PI * 3.5 + seed * 0.8) * 3 * pseudoRandom(i + 200)
    const y = 100 + wave
    points.push(`${x.toFixed(1)}% ${y.toFixed(1)}%`)
  }

  // Left edge (bottom to top)
  for (let i = segments - 1; i > 0; i--) {
    const t = i / segments
    const y = t * 100
    const wave = Math.sin(t * Math.PI * 2 + seed * 1.5) * 3 * pseudoRandom(i + 300)
    const x = wave
    points.push(`${x.toFixed(1)}% ${y.toFixed(1)}%`)
  }

  return `polygon(${points.join(', ')})`
}

/**
 * Get the zone at a given canvas position
 */
export function getZoneAtPosition(x: number, y: number): Zone | null {
  for (const zone of ZONES) {
    // Ellipse hit test
    const dx = (x - zone.x) / (zone.width / 2)
    const dy = (y - zone.y) / (zone.height / 2)
    if (dx * dx + dy * dy <= 1) {
      return zone
    }
  }
  return null
}

/**
 * Get all zones (for minimap, etc.)
 */
export function getAllZones(): Zone[] {
  return ZONES
}
