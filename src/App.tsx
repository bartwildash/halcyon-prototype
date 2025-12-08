import { useState } from 'react'
import { InkCanvasDemo } from './pages/InkCanvasDemo'
import { SpatialDemo } from './pages/SpatialDemo'
import './App.css'

function App() {
  const [currentView, setCurrentView] = useState<'spatial' | 'ink'>('spatial')

  if (currentView === 'ink') {
    return (
      <>
        <InkCanvasDemo />
        <button
          onClick={() => setCurrentView('spatial')}
          className="button"
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            zIndex: 2000,
          }}
        >
          ← Spatial Canvas
        </button>
      </>
    )
  }

  // Default: Spatial Canvas
  return (
    <>
      <SpatialDemo />

      {/* View Switcher */}
      <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 1500 }}>
        <button
          onClick={() => setCurrentView('ink')}
          className="button"
          style={{ fontSize: 14, fontWeight: 600 }}
        >
          🎨 Ink Drawing
        </button>
      </div>
    </>
  )
}

export default App
