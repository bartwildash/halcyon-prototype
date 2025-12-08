/**
 * ToolbarDemo - Example usage of FloatingToolbar
 * Shows all editor modes with live switching
 */

import { useState } from 'react'
import { FloatingToolbar } from './FloatingToolbar'
import type { EditorMode, ToolAction } from './types'
import './ToolbarDemo.css'

export function ToolbarDemo() {
  const [mode, setMode] = useState<EditorMode>('text')
  const [activeTool, setActiveTool] = useState<ToolAction | undefined>()
  const [actionLog, setActionLog] = useState<string[]>([])

  const handleAction = (action: ToolAction) => {
    setActiveTool(action)
    setActionLog(prev => [...prev.slice(-9), `${new Date().toLocaleTimeString()}: ${action}`])
    console.log('Tool action:', action)
  }

  return (
    <div className="toolbar-demo">
      {/* Mode switcher */}
      <div className="demo-header">
        <h2>Floating Toolbar Demo</h2>
        <div className="mode-switcher">
          {(['text', 'markdown', 'canvas', 'page', 'inspect'] as EditorMode[]).map(m => (
            <button
              key={m}
              className={`mode-button ${mode === m ? 'active' : ''}`}
              onClick={() => setMode(m)}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Content card with toolbar */}
      <div className="demo-content-card">
        <FloatingToolbar
          mode={mode}
          activeTool={activeTool}
          onAction={handleAction}
          position="left"
        />

        <div className="demo-editor">
          <h3>Editor: {mode}</h3>
          <p className="demo-instruction">
            The toolbar floats on the left edge. Hover over tools to see tooltips.
          </p>

          {/* Mode-specific content */}
          {mode === 'text' && (
            <div className="editor-content">
              <h1>Rich Text Editor</h1>
              <p>
                This is a <strong>bold</strong> and <em>italic</em> example.
                Click toolbar buttons to format text.
              </p>
            </div>
          )}

          {mode === 'markdown' && (
            <div className="editor-content">
              <code># Markdown Editor</code>
              <br />
              <code>This is **bold** and *italic*</code>
            </div>
          )}

          {mode === 'canvas' && (
            <div className="editor-content canvas-placeholder">
              <div className="canvas-shape circle"></div>
              <div className="canvas-shape rectangle"></div>
              <div className="canvas-shape line"></div>
            </div>
          )}

          {mode === 'page' && (
            <div className="editor-content page-builder-placeholder">
              <div className="page-block">Header Block</div>
              <div className="page-block">Content Block</div>
              <div className="page-block">Footer Block</div>
            </div>
          )}

          {mode === 'inspect' && (
            <div className="editor-content inspect-placeholder">
              <div className="inspect-element">
                <code>&lt;div class="example"&gt;</code>
                <div className="spacing-viz">Margin: 16px | Padding: 8px</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action log */}
      <div className="demo-action-log">
        <h4>Action Log</h4>
        <div className="log-entries">
          {actionLog.length === 0 ? (
            <div className="log-empty">Click toolbar buttons to see actions</div>
          ) : (
            actionLog.map((entry, i) => (
              <div key={i} className="log-entry">
                {entry}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
