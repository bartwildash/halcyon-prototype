/**
 * HalcyonDocsSidebar - Primitive-style navigation sidebar
 *
 * Styled to match FloatingToolbar aesthetic:
 * - Pill-shaped frosted glass
 * - Vertically centered on left edge
 * - Icons with tooltips
 * - Zen monochrome palette
 */

import { useState } from 'react'
import * as Tooltip from '@radix-ui/react-tooltip'
import type { DocsTreeItem } from './HalcyonDocsLayout'
import './HalcyonDocsSidebar.css'

interface HalcyonDocsSidebarProps {
  tree: DocsTreeItem[]
}

export function HalcyonDocsSidebar({ tree }: HalcyonDocsSidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())

  const toggleSection = (title: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(title)) {
        next.delete(title)
      } else {
        next.add(title)
      }
      return next
    })
  }

  // FAB on mobile
  if (collapsed) {
    return (
      <div className="docs-sidebar-fab">
        <button
          className="docs-fab-button"
          onClick={() => setCollapsed(false)}
          aria-label="Open navigation"
        >
          <span className="docs-fab-icon">☰</span>
        </button>
      </div>
    )
  }

  return (
    <Tooltip.Provider delayDuration={300}>
      <aside className="halcyon-docs-sidebar">
        {/* Close button (mobile) */}
        {window.innerWidth < 768 && (
          <button
            className="sidebar-close"
            onClick={() => setCollapsed(true)}
            aria-label="Close navigation"
          >
            ✕
          </button>
        )}

        {/* Navigation items */}
        <nav className="sidebar-nav">
          {tree.map((item, index) => (
            <div key={`${item.title}-${index}`}>
              {item.items ? (
                // Section with subitems
                <div className="sidebar-section">
                  <button
                    className={`sidebar-section-button ${expandedSections.has(item.title) ? 'expanded' : ''}`}
                    onClick={() => toggleSection(item.title)}
                  >
                    {item.icon && <span className="sidebar-icon">{item.icon}</span>}
                    <span className="sidebar-label">{item.title}</span>
                    <span className="sidebar-chevron">
                      {expandedSections.has(item.title) ? '▼' : '▶'}
                    </span>
                  </button>

                  {expandedSections.has(item.title) && (
                    <div className="sidebar-subitems">
                      {item.items.map((subitem, subIndex) => (
                        <NavItem key={`${subitem.title}-${subIndex}`} item={subitem} nested />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                // Single nav item
                <NavItem item={item} />
              )}

              {item.separator && <div className="sidebar-separator" />}
            </div>
          ))}
        </nav>
      </aside>
    </Tooltip.Provider>
  )
}

// Individual navigation item
function NavItem({ item, nested = false }: { item: DocsTreeItem; nested?: boolean }) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <a
          href={item.url || '#'}
          className={`sidebar-nav-item ${nested ? 'nested' : ''}`}
          aria-label={item.title}
        >
          {item.icon && <span className="sidebar-icon">{item.icon}</span>}
          <span className="sidebar-label">{item.title}</span>
        </a>
      </Tooltip.Trigger>

      <Tooltip.Portal>
        <Tooltip.Content className="sidebar-tooltip" side="right" sideOffset={8}>
          {item.title}
          <Tooltip.Arrow className="sidebar-tooltip-arrow" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  )
}
