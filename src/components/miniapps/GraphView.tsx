/**
 * GraphView - Network visualization of card connections
 *
 * Shows all cards and their relationships as a force-directed graph
 */

import { useEffect, useRef } from 'react'
import { useSpatialStore } from '../../stores/spatialStore'

interface GraphViewProps {
  onClose: () => void
}

export function GraphView({ onClose }: GraphViewProps) {
  const { space } = useSpatialStore()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!space || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Simple force-directed layout simulation
    const nodes = space.cards.map((card) => ({
      id: card.id,
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: 0,
      vy: 0,
      label: card.name || card.id.slice(0, 8),
    }))

    const edges = space.connections.map((conn) => ({
      source: nodes.find((n) => n.id === conn.startCardId),
      target: nodes.find((n) => n.id === conn.endCardId),
    }))

    // Animation loop
    let animationId: number
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Simple physics
      nodes.forEach((node) => {
        // Apply velocity
        node.x += node.vx
        node.y += node.vy
        // Damping
        node.vx *= 0.9
        node.vy *= 0.9
        // Bounds
        if (node.x < 20) node.x = 20
        if (node.x > canvas.width - 20) node.x = canvas.width - 20
        if (node.y < 20) node.y = 20
        if (node.y > canvas.height - 20) node.y = canvas.height - 20
      })

      // Repulsion between nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x
          const dy = nodes[j].y - nodes[i].y
          const dist = Math.sqrt(dx * dx + dy * dy) || 1
          const force = 500 / (dist * dist)
          nodes[i].vx -= (dx / dist) * force
          nodes[i].vy -= (dy / dist) * force
          nodes[j].vx += (dx / dist) * force
          nodes[j].vy += (dx / dist) * force
        }
      }

      // Attraction along edges
      edges.forEach((edge) => {
        if (!edge.source || !edge.target) return
        const dx = edge.target.x - edge.source.x
        const dy = edge.target.y - edge.source.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        const force = dist * 0.01
        edge.source.vx += (dx / dist) * force
        edge.source.vy += (dy / dist) * force
        edge.target.vx -= (dx / dist) * force
        edge.target.vy -= (dy / dist) * force
      })

      // Draw edges
      ctx.strokeStyle = '#ccc'
      ctx.lineWidth = 1
      edges.forEach((edge) => {
        if (!edge.source || !edge.target) return
        ctx.beginPath()
        ctx.moveTo(edge.source.x, edge.source.y)
        ctx.lineTo(edge.target.x, edge.target.y)
        ctx.stroke()
      })

      // Draw nodes
      nodes.forEach((node) => {
        ctx.fillStyle = '#4A90E2'
        ctx.beginPath()
        ctx.arc(node.x, node.y, 6, 0, Math.PI * 2)
        ctx.fill()

        // Label
        ctx.fillStyle = '#333'
        ctx.font = '10px system-ui'
        ctx.textAlign = 'center'
        ctx.fillText(node.label, node.x, node.y - 12)
      })

      animationId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationId) cancelAnimationFrame(animationId)
    }
  }, [space])

  return (
    <div
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '600px',
        height: '400px',
        background: 'var(--primary-background)',
        border: '2px solid var(--primary-border)',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
        zIndex: 2000,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--primary-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>
          🕸️ Graph View
        </h3>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '18px',
            cursor: 'pointer',
            padding: '4px 8px',
          }}
        >
          ×
        </button>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={600}
        height={350}
        style={{
          flex: 1,
          borderRadius: '0 0 12px 12px',
        }}
      />
    </div>
  )
}
