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

  return (
    <div className="keyboard-guide-overlay" onClick={onClose}>
      <div className="keyboard-guide" onClick={(e) => e.stopPropagation()}>
        <h2>Keyboard Shortcuts</h2>

        <div className="keyboard-sections">
          <section>
            <h3>Navigation</h3>
            <div className="shortcut-row">
              <div className="shortcut-keys">
                <kbd>1</kbd>
              </div>
              <div className="shortcut-desc">THINK mode</div>
            </div>
            <div className="shortcut-row">
              <div className="shortcut-keys">
                <kbd>2</kbd>
              </div>
              <div className="shortcut-desc">CRUMPIT mode</div>
            </div>
            <div className="shortcut-row">
              <div className="shortcut-keys">
                <kbd>3</kbd>
              </div>
              <div className="shortcut-desc">LOG mode</div>
            </div>
            <div className="shortcut-row">
              <div className="shortcut-keys">
                <kbd>/</kbd>
              </div>
              <div className="shortcut-desc">Search (coming soon)</div>
            </div>
          </section>

          <section>
            <h3>Create (THINK mode)</h3>
            <div className="shortcut-row">
              <div className="shortcut-keys">
                <kbd>t</kbd>
              </div>
              <div className="shortcut-desc">Create task</div>
            </div>
            <div className="shortcut-row">
              <div className="shortcut-keys">
                <kbd>n</kbd>
              </div>
              <div className="shortcut-desc">Create note</div>
            </div>
            <div className="shortcut-row">
              <div className="shortcut-keys">
                <kbd>p</kbd>
              </div>
              <div className="shortcut-desc">Create person</div>
            </div>
          </section>

          <section>
            <h3>Actions</h3>
            <div className="shortcut-row">
              <div className="shortcut-keys">
                <kbd>?</kbd>
              </div>
              <div className="shortcut-desc">Show/hide this guide</div>
            </div>
            <div className="shortcut-row">
              <div className="shortcut-keys">
                <kbd>Esc</kbd>
              </div>
              <div className="shortcut-desc">Close modals / Blur input</div>
            </div>
            <div className="shortcut-row">
              <div className="shortcut-keys">
                <kbd>⌘</kbd>
                <kbd>K</kbd>
              </div>
              <div className="shortcut-desc">Command palette (coming soon)</div>
            </div>
          </section>

          <section>
            <h3>Edit</h3>
            <div className="shortcut-row">
              <div className="shortcut-keys">
                <kbd>⌘</kbd>
                <kbd>Z</kbd>
              </div>
              <div className="shortcut-desc">Undo (coming soon)</div>
            </div>
            <div className="shortcut-row">
              <div className="shortcut-keys">
                <kbd>⌘</kbd>
                <kbd>⇧</kbd>
                <kbd>Z</kbd>
              </div>
              <div className="shortcut-desc">Redo (coming soon)</div>
            </div>
          </section>
        </div>

        <div className="keyboard-guide-footer">
          <button onClick={onClose} className="keyboard-guide-close">
            Close
          </button>
          <p className="keyboard-guide-hint">
            Tip: Most shortcuts work globally, but creation shortcuts only work in THINK mode
          </p>
        </div>
      </div>
    </div>
  )
}
