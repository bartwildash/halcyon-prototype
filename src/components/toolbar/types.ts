/**
 * Floating Toolbar Types
 * Unified toolbar system for all Halcyon editors
 */

export type EditorMode = 'text' | 'markdown' | 'canvas' | 'page' | 'inspect'

export type ToolAction =
  // Text formatting
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strike'
  | 'code'
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'bulletList'
  | 'orderedList'
  | 'blockquote'
  | 'link'
  | 'image'

  // Markdown
  | 'preview'
  | 'codeBlock'
  | 'table'

  // Canvas
  | 'select'
  | 'pan'
  | 'zoom-in'
  | 'zoom-out'
  | 'zoom-reset'
  | 'add-circle'
  | 'add-rectangle'
  | 'add-line'
  | 'add-text'

  // Page builder
  | 'add-block'
  | 'layers'
  | 'device-mobile'
  | 'device-tablet'
  | 'device-desktop'
  | 'undo'
  | 'redo'

  // Inspector
  | 'inspect-element'
  | 'spacing'
  | 'properties'

export interface Tool {
  action: ToolAction
  icon: string           // Emoji or symbol
  label: string          // Tooltip text
  shortcut?: string      // Keyboard shortcut
  separator?: boolean    // Add visual separator after this tool
  active?: boolean       // Is this tool currently active
}

export interface FloatingToolbarProps {
  mode: EditorMode
  activeTool?: ToolAction
  onAction: (action: ToolAction) => void
  position?: 'left' | 'right'
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
}
