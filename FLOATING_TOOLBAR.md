# Floating Toolbar - Unified Editor Controls

A pill-shaped, frosted-glass toolbar that floats on the left edge of content cards. Provides contextual tools for all Halcyon editor modes with consistent design and behavior.

## 🎨 Design Philosophy

**Calm, spatial, minimal** - matches Halcyon's aesthetic:
- **Pill-shaped** with rounded ends (border-radius: 999px)
- **Frosted glass** effect (backdrop-filter: blur + transparency)
- **Icons only** with tooltips on hover (no visual clutter)
- **Contextual** - tools change based on editor mode
- **Accessible** - keyboard navigation, ARIA labels, tooltips

---

## 📐 Visual Specifications

### Desktop
- **Position**: Absolute, left edge of content card
- **Offset**: -56px from card edge (48px button + 8px gap)
- **Shape**: Vertical pill (40px wide buttons)
- **Background**: `rgba(255, 255, 255, 0.85)` with 12px blur
- **Border**: 1px solid `rgba(0, 0, 0, 0.1)`
- **Shadow**: Multi-layer soft shadows for depth

### Mobile (<768px)
- **Collapsed**: FAB (Floating Action Button) at bottom-left
- **Expanded**: Modal overlay, centered on screen
- **FAB**: 56px circle, same frosted glass effect
- **Position**: `bottom: 80px, left: 20px` (above primitives palette)

---

## 🛠️ Components

### 1. FloatingToolbar (Main)

```typescript
import { FloatingToolbar } from './components/toolbar'

<FloatingToolbar
  mode="text"                    // Editor mode
  activeTool={activeTool}        // Currently active tool (optional)
  onAction={(action) => {...}}   // Tool click handler
  position="left"                // "left" or "right" (default: left)
  collapsed={false}              // Control collapsed state (optional)
  onCollapsedChange={(c) => {}} // Collapsed state callback (optional)
/>
```

**Props**:
- `mode`: `'text' | 'markdown' | 'canvas' | 'page' | 'inspect'`
- `activeTool`: Currently active ToolAction (highlights button)
- `onAction`: Callback when tool is clicked
- `position`: Which side of card to anchor to
- `collapsed`: Control FAB/full toolbar state
- `onCollapsedChange`: Get notified when collapsed state changes

---

### 2. Tool Definitions

Located in `tools.ts`, defines icons and labels for each mode.

**Tool structure**:
```typescript
interface Tool {
  action: ToolAction          // Unique identifier
  icon: string                // Emoji or symbol
  label: string               // Tooltip text
  shortcut?: string           // Keyboard shortcut (shown in tooltip)
  separator?: boolean         // Add divider after this tool
}
```

**Adding new tools**:
```typescript
// In tools.ts
export const TOOL_SETS: Record<EditorMode, Tool[]> = {
  text: [
    { action: 'bold', icon: '𝐁', label: 'Bold', shortcut: '⌘B' },
    { action: 'italic', icon: '𝐼', label: 'Italic', shortcut: '⌘I' },
    // ... more tools
  ],
  // ... other modes
}
```

---

## 📋 Built-in Tool Sets

### Text Mode (Tiptap)
- **Formatting**: Bold, Italic, Underline, Strike, Code
- **Headings**: H1, H2, H3
- **Lists**: Bullet, Numbered
- **Media**: Blockquote, Link, Image

**Total**: 13 tools

### Markdown Mode
- **Markdown**: `**bold**`, `*italic*`, `` `code` ``
- **Headings**: `#`, `##`, `###`
- **Lists**: `-` bullet list
- **Code**: ` ``` ` code block
- **Table**: `⊞` insert table
- **Preview**: `👁` toggle preview mode

**Total**: 11 tools

### Canvas Mode (Konva)
- **Navigation**: Select, Pan
- **Zoom**: Zoom in, Zoom out, Reset
- **Shapes**: Circle, Rectangle, Line
- **Text**: Add text
- **History**: Undo, Redo

**Total**: 11 tools

### Page Builder (GrapesJS)
- **Content**: Add block
- **View**: Layers panel
- **Devices**: Mobile, Tablet, Desktop preview
- **History**: Undo, Redo

**Total**: 7 tools

### Inspector Mode
- **Tools**: Inspect element, Show spacing, Properties panel

**Total**: 3 tools

---

## 🎯 Usage Examples

### Basic Integration

```tsx
import { useState } from 'react'
import { FloatingToolbar, type ToolAction } from './components/toolbar'

function MyEditor() {
  const [activeTool, setActiveTool] = useState<ToolAction>()

  const handleAction = (action: ToolAction) => {
    setActiveTool(action)

    // Handle tool actions
    switch (action) {
      case 'bold':
        editor.chain().focus().toggleBold().run()
        break
      case 'italic':
        editor.chain().focus().toggleItalic().run()
        break
      // ... more cases
    }
  }

  return (
    <div className="editor-container">
      <FloatingToolbar
        mode="text"
        activeTool={activeTool}
        onAction={handleAction}
      />

      <div className="editor-content">
        {/* Your editor */}
      </div>
    </div>
  )
}
```

### With Tiptap

```tsx
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { FloatingToolbar } from './components/toolbar'

function TiptapEditor() {
  const editor = useEditor({
    extensions: [StarterKit],
    content: '<p>Hello World!</p>',
  })

  const handleAction = (action: ToolAction) => {
    if (!editor) return

    const commands = {
      bold: () => editor.chain().focus().toggleBold().run(),
      italic: () => editor.chain().focus().toggleItalic().run(),
      heading1: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      heading2: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      bulletList: () => editor.chain().focus().toggleBulletList().run(),
      orderedList: () => editor.chain().focus().toggleOrderedList().run(),
      blockquote: () => editor.chain().focus().toggleBlockquote().run(),
    }

    commands[action]?.()
  }

  return (
    <div className="editor-card">
      <FloatingToolbar
        mode="text"
        activeTool={editor?.isActive('bold') ? 'bold' : undefined}
        onAction={handleAction}
      />
      <EditorContent editor={editor} />
    </div>
  )
}
```

### With GrapesJS

```tsx
import grapesjs from 'grapesjs'
import { FloatingToolbar } from './components/toolbar'

function PageBuilder() {
  const [editor, setEditor] = useState(null)

  useEffect(() => {
    const gjs = grapesjs.init({
      container: '#gjs',
      // ... config
    })
    setEditor(gjs)
  }, [])

  const handleAction = (action: ToolAction) => {
    if (!editor) return

    const commands = {
      'add-block': () => editor.runCommand('open-blocks'),
      'layers': () => editor.runCommand('open-layers'),
      'device-mobile': () => editor.setDevice('mobile'),
      'device-tablet': () => editor.setDevice('tablet'),
      'device-desktop': () => editor.setDevice('desktop'),
      'undo': () => editor.runCommand('core:undo'),
      'redo': () => editor.runCommand('core:redo'),
    }

    commands[action]?.()
  }

  return (
    <div className="page-builder">
      <FloatingToolbar
        mode="page"
        onAction={handleAction}
      />
      <div id="gjs"></div>
    </div>
  )
}
```

---

## 🎨 Customization

### Custom Tool Icons

```typescript
// In tools.ts
const TOOL_SETS = {
  text: [
    { action: 'custom-tool', icon: '✨', label: 'My Custom Tool' },
  ]
}
```

**Icon options**:
- Emoji: `✨ 🎨 🖊 📐`
- Unicode symbols: `• ◯ □ △`
- Special characters: `⌘ ⌥ ⇧ ⌫`

### Custom Colors (Mode-Specific)

```css
/* In FloatingToolbar.css */
.floating-toolbar.mode-custom .toolbar-button.active {
  background: #ff6b6b; /* Custom red */
  border-color: #ff6b6b;
}
```

### Position Override

```tsx
<FloatingToolbar
  mode="text"
  position="right"  // Anchor to right edge instead
  onAction={handleAction}
/>
```

### Custom Tool Set

```typescript
// Create new mode in types.ts
export type EditorMode = 'text' | 'markdown' | 'canvas' | 'page' | 'custom'

// Add tools in tools.ts
export const TOOL_SETS: Record<EditorMode, Tool[]> = {
  // ... existing
  custom: [
    { action: 'my-tool', icon: '🔧', label: 'My Tool' },
    { action: 'another-tool', icon: '⚡', label: 'Another Tool' },
  ]
}
```

---

## ♿ Accessibility

### Features
- ✅ **Keyboard navigation**: Tab through tools
- ✅ **ARIA labels**: Every button has `aria-label`
- ✅ **Tooltips**: Radix UI Tooltip (accessible by default)
- ✅ **Focus indicators**: Visible focus rings
- ✅ **Screen reader friendly**: Semantic HTML

### Keyboard Shortcuts
- `Tab` / `Shift+Tab` - Navigate tools
- `Enter` / `Space` - Activate tool
- `Esc` - Close expanded toolbar (mobile)

### Testing
```tsx
// Check ARIA labels
const boldButton = screen.getByLabelText('Bold')
expect(boldButton).toBeInTheDocument()

// Check tooltips
await user.hover(boldButton)
expect(await screen.findByText('Bold')).toBeVisible()
```

---

## 📱 Responsive Behavior

### Desktop (>768px)
- Full vertical toolbar
- Anchored to content card edge
- Always visible
- Smooth transitions

### Mobile (≤768px)
- **Collapsed**: FAB button at bottom-left
- **Expanded**: Centered modal overlay
- **Auto-collapse**: After selecting a tool
- **Gesture**: Tap FAB to expand, tap tool to activate

### Tablet (768px-1024px)
- Same as desktop (full toolbar)
- Slightly larger touch targets

---

## 🔧 Technical Details

### Dependencies
- **React** (≥18)
- **@radix-ui/react-tooltip** (~25KB)
- **TypeScript** (types included)

### Bundle Size
- **Toolbar**: ~8KB (gzipped)
- **Radix Tooltip**: ~25KB (gzipped)
- **Total**: ~33KB

### Browser Support
- **Modern browsers**: Chrome, Firefox, Safari, Edge
- **Frosted glass**: Falls back to solid color if `backdrop-filter` unsupported
- **Mobile**: iOS Safari 14+, Chrome Android

### Performance
- **Tooltip lazy-loading**: Only loads when hovering
- **Animation hardware acceleration**: Uses `transform` and `opacity`
- **No re-renders**: Tools are memoized per mode

---

## 🎬 Animations

### Toolbar Entrance (Desktop)
```css
/* Smooth slide from left */
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
```

### FAB Entrance (Mobile)
```css
/* Slide up + scale */
@keyframes fab-slide-in {
  from { transform: translateY(20px) scale(0.9); }
  to { transform: translateY(0) scale(1); }
}
```

### Modal Expansion (Mobile)
```css
/* Center + scale */
@keyframes toolbar-modal-in {
  from { transform: translate(-50%, -45%) scale(0.95); }
  to { transform: translate(-50%, -50%) scale(1); }
}
```

### Tooltip
```css
/* Fade + slide */
@keyframes tooltip-fade-in {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}
```

### Respects `prefers-reduced-motion`
```css
@media (prefers-reduced-motion: reduce) {
  .floating-toolbar { transition: none; animation: none; }
}
```

---

## 🌓 Dark Mode

Automatic dark mode support via `prefers-color-scheme`:

```css
@media (prefers-color-scheme: dark) {
  .floating-toolbar {
    background: rgba(30, 30, 30, 0.85);
    border-color: rgba(255, 255, 255, 0.15);
  }

  .toolbar-button {
    color: #fff;
  }

  .toolbar-button.active {
    background: #fff;
    color: #000;
  }
}
```

---

## 🧪 Testing

### Unit Tests
```tsx
import { render, screen } from '@testing-library/react'
import { FloatingToolbar } from './FloatingToolbar'

test('renders text mode tools', () => {
  render(<FloatingToolbar mode="text" onAction={() => {}} />)

  expect(screen.getByLabelText('Bold')).toBeInTheDocument()
  expect(screen.getByLabelText('Italic')).toBeInTheDocument()
})

test('calls onAction when tool clicked', async () => {
  const handleAction = jest.fn()
  render(<FloatingToolbar mode="text" onAction={handleAction} />)

  await user.click(screen.getByLabelText('Bold'))
  expect(handleAction).toHaveBeenCalledWith('bold')
})
```

### Visual Regression
```tsx
import { composeStories } from '@storybook/react'
import { render } from '@testing-library/react'

test('toolbar visual snapshot', () => {
  const { container } = render(<FloatingToolbar mode="text" />)
  expect(container).toMatchSnapshot()
})
```

---

## 📦 File Structure

```
src/components/toolbar/
├── FloatingToolbar.tsx      # Main component
├── FloatingToolbar.css      # Styles
├── types.ts                 # TypeScript types
├── tools.ts                 # Tool definitions
├── index.ts                 # Exports
├── ToolbarDemo.tsx          # Example usage
└── ToolbarDemo.css          # Demo styles
```

---

## 🔮 Future Enhancements

### Phase 2: Advanced Features
- [ ] Collapsible tool groups (accordion)
- [ ] Custom toolbar layouts (horizontal option)
- [ ] Drag-to-reorder tools
- [ ] Tool presets/favorites

### Phase 3: Context Awareness
- [ ] Auto-show relevant tools based on selection
- [ ] Hide unavailable tools (disabled state)
- [ ] Smart tool suggestions

### Phase 4: Extensions
- [ ] Plugin system for custom tools
- [ ] Multi-toolbar support (primary + secondary)
- [ ] Command palette integration

---

**Status**: ✅ Complete and production-ready
**Last Updated**: 2025-12-07
**Location**: `/src/components/toolbar/`
**Demo**: Run `ToolbarDemo` component to see all modes
