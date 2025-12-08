/**
 * Tool Definitions
 * Contextual tools for each editor mode
 */

import type { Tool, EditorMode } from './types'

export const TOOL_SETS: Record<EditorMode, Tool[]> = {
  // Rich text editor (Tiptap)
  text: [
    { action: 'bold', icon: '𝐁', label: 'Bold', shortcut: '⌘B' },
    { action: 'italic', icon: '𝐼', label: 'Italic', shortcut: '⌘I' },
    { action: 'underline', icon: 'U̲', label: 'Underline', shortcut: '⌘U' },
    { action: 'strike', icon: 'S̶', label: 'Strikethrough' },
    { action: 'code', icon: '</>', label: 'Inline code', shortcut: '⌘E', separator: true },

    { action: 'heading1', icon: 'H1', label: 'Heading 1' },
    { action: 'heading2', icon: 'H2', label: 'Heading 2' },
    { action: 'heading3', icon: 'H3', label: 'Heading 3', separator: true },

    { action: 'bulletList', icon: '•', label: 'Bullet list' },
    { action: 'orderedList', icon: '1.', label: 'Numbered list', separator: true },

    { action: 'blockquote', icon: '"', label: 'Quote' },
    { action: 'link', icon: '🔗', label: 'Link', shortcut: '⌘K' },
    { action: 'image', icon: '🖼', label: 'Image' },
  ],

  // Markdown editor
  markdown: [
    { action: 'bold', icon: '**', label: 'Bold', shortcut: '⌘B' },
    { action: 'italic', icon: '*', label: 'Italic', shortcut: '⌘I' },
    { action: 'code', icon: '`', label: 'Inline code', separator: true },

    { action: 'heading1', icon: '#', label: 'Heading 1' },
    { action: 'heading2', icon: '##', label: 'Heading 2' },
    { action: 'heading3', icon: '###', label: 'Heading 3', separator: true },

    { action: 'bulletList', icon: '-', label: 'List' },
    { action: 'link', icon: '[]()', label: 'Link', separator: true },

    { action: 'codeBlock', icon: '```', label: 'Code block' },
    { action: 'table', icon: '⊞', label: 'Table' },
    { action: 'preview', icon: '👁', label: 'Preview', separator: true },
  ],

  // Canvas/drawing mode (Konva)
  canvas: [
    { action: 'select', icon: '↖', label: 'Select', shortcut: 'V' },
    { action: 'pan', icon: '✋', label: 'Pan', shortcut: 'Space' },
    { action: 'zoom-in', icon: '+', label: 'Zoom in', shortcut: '⌘+' },
    { action: 'zoom-out', icon: '−', label: 'Zoom out', shortcut: '⌘−' },
    { action: 'zoom-reset', icon: '⊙', label: 'Reset zoom', shortcut: '⌘0', separator: true },

    { action: 'add-circle', icon: '○', label: 'Circle' },
    { action: 'add-rectangle', icon: '□', label: 'Rectangle' },
    { action: 'add-line', icon: '/', label: 'Line' },
    { action: 'add-text', icon: 'T', label: 'Text', separator: true },

    { action: 'undo', icon: '↶', label: 'Undo', shortcut: '⌘Z' },
    { action: 'redo', icon: '↷', label: 'Redo', shortcut: '⌘⇧Z' },
  ],

  // Page builder (GrapesJS)
  page: [
    { action: 'add-block', icon: '+', label: 'Add block' },
    { action: 'layers', icon: '☰', label: 'Layers' },
    { action: 'device-mobile', icon: '📱', label: 'Mobile view' },
    { action: 'device-tablet', icon: '📱', label: 'Tablet view' },
    { action: 'device-desktop', icon: '💻', label: 'Desktop view', separator: true },

    { action: 'undo', icon: '↶', label: 'Undo', shortcut: '⌘Z' },
    { action: 'redo', icon: '↷', label: 'Redo', shortcut: '⌘⇧Z' },
  ],

  // Element inspector
  inspect: [
    { action: 'inspect-element', icon: '🔍', label: 'Inspect element' },
    { action: 'spacing', icon: '📏', label: 'Show spacing' },
    { action: 'properties', icon: '⚙', label: 'Properties panel' },
  ],
}

// Get tools for a specific mode
export function getToolsForMode(mode: EditorMode): Tool[] {
  return TOOL_SETS[mode] || []
}

// Find tool by action
export function getToolByAction(mode: EditorMode, action: string): Tool | undefined {
  return TOOL_SETS[mode].find(tool => tool.action === action)
}
