/**
 * HalcyonDocsLayout - Fumadocs layout with primitive toolbar aesthetic
 *
 * Features:
 * - Zen monochrome color scheme
 * - Floating pill sidebar (like primitives palette)
 * - Minimal, calm documentation interface
 */

import { ReactNode } from 'react'
import { HalcyonDocsSidebar } from './HalcyonDocsSidebar'
import './HalcyonDocsLayout.css'

interface HalcyonDocsLayoutProps {
  children: ReactNode
  tree?: DocsTreeItem[]
}

export interface DocsTreeItem {
  title: string
  url?: string
  icon?: string
  items?: DocsTreeItem[]
  separator?: boolean
}

export function HalcyonDocsLayout({ children, tree = [] }: HalcyonDocsLayoutProps) {
  return (
    <div className="halcyon-docs-layout">
      {/* Floating sidebar (left) */}
      <HalcyonDocsSidebar tree={tree} />

      {/* Main content */}
      <main className="halcyon-docs-content">
        <div className="docs-content-wrapper">
          {children}
        </div>
      </main>
    </div>
  )
}
