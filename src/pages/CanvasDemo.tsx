/**
 * CanvasDemo - Test page for new Halcyon infinite canvas
 *
 * Demonstrates:
 * - Pan/zoom/pinch working smoothly
 * - Entity drag in world space
 * - Terrain shader switching
 * - 10 demo entities spread across canvas
 */

import { useEffect, useState } from 'react'
import { useHalcyonStore } from '../store/halcyonStore'
import { HalcyonCanvas } from '../components/canvas/HalcyonCanvas'

export function CanvasDemo() {
  const { entities, createTask, createNote, createPerson, createSticker } = useHalcyonStore()
  const [mode, setMode] = useState<'lake' | 'meadow' | 'crumpit' | 'canyon'>('lake')

  // Create demo entities on first load
  useEffect(() => {
    if (entities.size > 0) return // Already have entities

    // Center cluster
    createNote('Welcome to Halcyon! 🌅\n\nPan, zoom, and drag cards.\n\nClick terrain buttons to switch modes.', 0, 0)

    createTask('Fix the infinite canvas', -300, -200)
    createTask('Add terrain shaders', 300, -200)

    // Spread around
    createPerson('Alice Chen', -600, 400)
    createPerson('Bob Martinez', 600, 400)

    createSticker('⚡', -400, 600, 'large')
    createSticker('🎨', 400, 600, 'medium')
    createSticker('💭', 0, -400, 'small')

    createNote('Try pinch-zoom on mobile', -800, -400)
    createNote('Drag me around!', 800, -400)
  }, [entities.size, createTask, createNote, createPerson, createSticker])

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      {/* Terrain mode switcher */}
      <div
        style={{
          position: 'fixed',
          top: 24,
          left: 24,
          zIndex: 2000,
          display: 'flex',
          gap: 8,
          background: 'rgba(255,255,255,0.9)',
          padding: 12,
          borderRadius: 8,
          border: '2px solid #000',
        }}
      >
        <button
          onClick={() => setMode('lake')}
          style={{
            padding: '8px 16px',
            border: mode === 'lake' ? '2px solid #000' : '1px solid #ccc',
            background: mode === 'lake' ? '#f0f0f0' : '#fff',
            cursor: 'pointer',
            fontWeight: mode === 'lake' ? 'bold' : 'normal',
          }}
        >
          Lake
        </button>
        <button
          onClick={() => setMode('meadow')}
          style={{
            padding: '8px 16px',
            border: mode === 'meadow' ? '2px solid #000' : '1px solid #ccc',
            background: mode === 'meadow' ? '#f0f0f0' : '#fff',
            cursor: 'pointer',
            fontWeight: mode === 'meadow' ? 'bold' : 'normal',
          }}
        >
          Meadow
        </button>
        <button
          onClick={() => setMode('crumpit')}
          style={{
            padding: '8px 16px',
            border: mode === 'crumpit' ? '2px solid #000' : '1px solid #ccc',
            background: mode === 'crumpit' ? '#f0f0f0' : '#fff',
            cursor: 'pointer',
            fontWeight: mode === 'crumpit' ? 'bold' : 'normal',
          }}
        >
          Crumpit
        </button>
        <button
          onClick={() => setMode('canyon')}
          style={{
            padding: '8px 16px',
            border: mode === 'canyon' ? '2px solid #000' : '1px solid #ccc',
            background: mode === 'canyon' ? '#f0f0f0' : '#fff',
            cursor: 'pointer',
            fontWeight: mode === 'canyon' ? 'bold' : 'normal',
          }}
        >
          Canyon
        </button>
      </div>

      {/* Canvas */}
      <HalcyonCanvas mode={mode} />
    </div>
  )
}
