/**
 * OrbitSystem - Solar system orbit visualization for Halcyon
 *
 * Based on the orbit graph with 3/8/24/60 friend distribution pattern.
 * Renders as an SVG overlay at the Lake (center) position.
 */

import { useEffect, useRef } from 'react'
import './OrbitSystem.css'

interface OrbitSystemProps {
  /** World coordinates for center */
  centerX?: number
  centerY?: number
  /** Camera offset for screen positioning */
  cameraOffsetX: number
  cameraOffsetY: number
}

export function OrbitSystem({
  centerX = 0,
  centerY = 0,
  cameraOffsetX,
  cameraOffsetY
}: OrbitSystemProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const nodesRef = useRef<SVGGElement>(null)
  const animationFrameRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (!svgRef.current || !nodesRef.current) return

    // Config from CSS
    const tilt = 0.42
    const gap = 40
    const baseRadius = 80
    const speedScale = 2.1

    // Eccentricity and rotation per ring
    const ecc: Record<number, number> = {
      0: 0.04, 1: 0.02, 2: 0.03, 3: 0.05,
      4: 0.04, 5: 0.06, 6: 0.05, 7: 0.01
    }
    const ringRotationDeg: Record<number, number> = { 5: -8, 7: 12 }
    const ringTilt: Record<number, number> = { 5: 0.40, 7: 0.44 }

    const toRad = (d: number) => d * Math.PI / 180

    // Kepler solver
    function solveKepler(M: number, e: number): number {
      let E = M
      for (let i = 0; i < 8; i++) {
        const d = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E))
        E -= d
        if (Math.abs(d) < 1e-6) break
      }
      return 2 * Math.atan2(
        Math.sqrt(1 + e) * Math.sin(E / 2),
        Math.sqrt(1 - e) * Math.cos(E / 2)
      )
    }

    // Position on ring i at mean anomaly M
    function posOnRing(i: number, M: number): { x: number; y: number } {
      const a = baseRadius + i * gap
      const e = ecc[i] || 0
      const b = a * (ringTilt[i] ?? tilt)
      const c = a * e
      const nu = e ? solveKepler(M, e) : M

      let x = -c + a * Math.cos(nu)
      let y = b * Math.sin(nu)

      const rot = toRad(ringRotationDeg[i] || 0)
      if (rot) {
        const X = x * Math.cos(rot) - y * Math.sin(rot)
        const Y = x * Math.sin(rot) + y * Math.cos(rot)
        x = X
        y = Y
      }

      return { x, y }
    }

    // Seed nodes with orbit data
    interface NodeOrbit {
      ring: number
      M: number
      n: number
    }

    const nodes: Array<{ element: SVGCircleElement; orbit: NodeOrbit }> = []

    function seedRing({
      ring,
      count,
      r,
      fill,
      baseN,
      jitterDeg = 10,
    }: {
      ring: number
      count: number
      r: number
      fill: string
      baseN: number
      jitterDeg?: number
    }) {
      const step = 360 / Math.max(1, count)
      for (let i = 0; i < count; i++) {
        const jitter = Math.random() * 2 * jitterDeg - jitterDeg
        const M = toRad(i * step + jitter)
        const n = baseN * (0.95 + Math.random() * 0.1) * speedScale

        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
        circle.setAttribute('r', r.toString())
        circle.setAttribute('fill', fill)

        const orbit: NodeOrbit = { ring, M, n }
        nodes.push({ element: circle, orbit })

        nodesRef.current?.appendChild(circle)
      }
    }

    // Typical friend distribution
    seedRing({ ring: 0, count: 3, r: 5.2, fill: '#FFCEBF', baseN: 0.03, jitterDeg: 14 })
    seedRing({ ring: 2, count: 8, r: 4.9, fill: '#FFDDBA', baseN: 0.02, jitterDeg: 16 })
    seedRing({ ring: 4, count: 24, r: 4.1, fill: '#B1B7FF', baseN: 0.01, jitterDeg: 18 })
    seedRing({ ring: 6, count: 60, r: 3.2, fill: '#A8D2FF', baseN: 0.004, jitterDeg: 20 })

    // Stragglers
    seedRing({ ring: 1, count: 2, r: 4.6, fill: 'rgba(255,196,140,0.95)', baseN: 0.014, jitterDeg: 28 })
    seedRing({ ring: 3, count: 4, r: 3.8, fill: 'rgba(196,201,255,0.95)', baseN: 0.008, jitterDeg: 32 })
    seedRing({ ring: 5, count: 6, r: 3.4, fill: 'rgba(131,185,255,0.95)', baseN: 0.005, jitterDeg: 36 })
    seedRing({ ring: 7, count: 10, r: 3.1, fill: 'rgba(131,185,255,0.85)', baseN: 0.003, jitterDeg: 40 })

    // Initial layout
    for (const { element, orbit } of nodes) {
      const p = posOnRing(orbit.ring, orbit.M)
      element.setAttribute('cx', p.x.toString())
      element.setAttribute('cy', p.y.toString())
    }

    // Animate
    function animate() {
      for (const { element, orbit } of nodes) {
        orbit.M = (orbit.M + orbit.n) % (Math.PI * 2)
        const p = posOnRing(orbit.ring, orbit.M)
        element.setAttribute('cx', p.x.toString())
        element.setAttribute('cy', p.y.toString())
      }
      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationFrameRef.current !== undefined) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  // Calculate screen position
  const screenX = centerX - cameraOffsetX
  const screenY = centerY - cameraOffsetY

  return (
    <div
      className="orbit-system"
      style={{
        position: 'absolute',
        left: screenX - 520,
        top: screenY - 320,
        pointerEvents: 'none',
      }}
    >
      <svg
        ref={svgRef}
        viewBox="-520 -320 1040 640"
        width="1040"
        height="640"
        role="img"
        aria-label="Orbit rings with friend distribution"
      >
        <defs>
          <linearGradient id="orbit-glow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF9A1A" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#FF9A1A" stopOpacity="0.2" />
          </linearGradient>
        </defs>

        {/* Rings */}
        <g>
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
            const a = 80 + i * 40
            const b = a * (i === 5 ? 0.4 : i === 7 ? 0.44 : 0.42)
            const c = a * ([0.04, 0.02, 0.03, 0.05, 0.04, 0.06, 0.05, 0.01][i] || 0)
            const rot = i === 5 ? -8 : i === 7 ? 12 : 0

            const isHeavy = i % 2 === 0
            const stroke = isHeavy
              ? ['#FF8B7B', '#FFC48C', '#C4C9FF', '#83B9FF'][i / 2] || '#1E2C4B'
              : [
                  'rgba(255,139,123,0.28)',
                  'rgba(255,196,140,0.26)',
                  'rgba(196,201,255,0.28)',
                  'rgba(131,185,255,0.26)',
                ][(i - 1) / 2] || 'rgba(255,255,255,0.15)'
            const strokeWidth = isHeavy ? 2 : 1

            return (
              <g key={i} transform={`rotate(${rot})`}>
                <ellipse
                  cx={-c}
                  cy={0}
                  rx={a}
                  ry={b}
                  fill="none"
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                />
              </g>
            )
          })}
        </g>

        {/* Sun */}
        <circle cx={0} cy={0} r={28} fill="url(#orbit-glow)" />

        {/* Nodes */}
        <g ref={nodesRef} />
      </svg>
    </div>
  )
}
