/**
 * Keyboard Guide Component
 *
 * Visual reference for all keyboard shortcuts
 * Press ? to show/hide
 */

import './KeyboardGuide.css'

interface KeyboardGuideProps {
  isOpen: boolean
  onClose: () => void
}

export function KeyboardGuide({ isOpen, onClose }: KeyboardGuideProps) {
  if (!isOpen) return null

  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
  const cmdKey = isMac ? '⌘' : 'Ctrl'

  return (
    <div className="keyboard-guide-overlay" onClick={onClose}>
      <div className="keyboard-guide" onClick={(e) => e.stopPropagation()}>
        <div className="keyboard-guide-header">
          <h2>Keyboard Shortcuts</h2>
          <button className="keyboard-guide-close-btn" onClick={onClose}>x</button>
        </div>

        <div className="keyboard-sections">
          <section>
            <h3>General</h3>
            <div className="shortcut-row">
              <div className="shortcut-keys">
                <kbd>{cmdKey}</kbd><kbd>K</kbd>
              </div>
              <div className="shortcut-desc">Command palette</div>
            </div>
            <div className="shortcut-row">
              <div className="shortcut-keys">
                <kbd>?</kbd>
              </div>
              <div className="shortcut-desc">Show this guide</div>
            </div>
            <div className="shortcut-row">
              <div className="shortcut-keys">
                <kbd>Esc</kbd>
              </div>
              <div className="shortcut-desc">Close modals / Clear selection</div>
            </div>
          </section>

          <section>
            <h3>Edit</h3>
            <div className="shortcut-row">
              <div className="shortcut-keys">
                <kbd>{cmdKey}</kbd><kbd>Z</kbd>
              </div>
              <div className="shortcut-desc">Undo</div>
            </div>
            <div className="shortcut-row">
              <div className="shortcut-keys">
                <kbd>{cmdKey}</kbd><kbd>Shift</kbd><kbd>Z</kbd>
              </div>
              <div className="shortcut-desc">Redo</div>
            </div>
            <div className="shortcut-row">
              <div className="shortcut-keys">
                <kbd>Delete</kbd>
              </div>
              <div className="shortcut-desc">Delete selected cards</div>
            </div>
          </section>

          <section>
            <h3>Tools</h3>
            <div className="shortcut-row">
              <div className="shortcut-keys">
                <kbd>H</kbd>
              </div>
              <div className="shortcut-desc">Hand tool (pan)</div>
            </div>
            <div className="shortcut-row">
              <div className="shortcut-keys">
                <kbd>S</kbd>
              </div>
              <div className="shortcut-desc">Select tool</div>
            </div>
            <div className="shortcut-row">
              <div className="shortcut-keys">
                <kbd>D</kbd>
              </div>
              <div className="shortcut-desc">Draw tool (ink)</div>
            </div>
          </section>

          <section>
            <h3>Canvas</h3>
            <div className="shortcut-row">
              <div className="shortcut-keys">
                <kbd>N</kbd>
              </div>
              <div className="shortcut-desc">New card</div>
            </div>
            <div className="shortcut-row">
              <div className="shortcut-keys">
                <kbd>T</kbd>
              </div>
              <div className="shortcut-desc">New task</div>
            </div>
            <div className="shortcut-row">
              <div className="shortcut-keys">
                <kbd>+</kbd> / <kbd>-</kbd>
              </div>
              <div className="shortcut-desc">Zoom in / out</div>
            </div>
            <div className="shortcut-row">
              <div className="shortcut-keys">
                <kbd>0</kbd>
              </div>
              <div className="shortcut-desc">Reset zoom</div>
            </div>
          </section>

          <section>
            <h3>Views</h3>
            <div className="shortcut-row">
              <div className="shortcut-keys">
                <kbd>1</kbd>
              </div>
              <div className="shortcut-desc">Canvas view</div>
            </div>
            <div className="shortcut-row">
              <div className="shortcut-keys">
                <kbd>2</kbd>
              </div>
              <div className="shortcut-desc">CRUMPIT (triage)</div>
            </div>
            <div className="shortcut-row">
              <div className="shortcut-keys">
                <kbd>3</kbd>
              </div>
              <div className="shortcut-desc">PLAN (today)</div>
            </div>
          </section>
        </div>

        <div className="keyboard-guide-footer">
          <p>Press <kbd>?</kbd> to toggle this guide</p>
        </div>
      </div>
    </div>
  )
}
