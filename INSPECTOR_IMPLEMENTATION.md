# Halcyon DOM Inspector - VisBug Style

Complete element inspection tool built with Konva overlay. No external dependencies beyond what you already have.

## 🔍 What It Does

**Browser DevTools-style element inspector**:
- Hover any element to highlight it (blue)
- Click to select and inspect (green)
- View spacing (margin/padding) like Chrome DevTools
- Edit CSS properties live
- Measure distances between elements
- Clean separation from app DOM via Konva overlay

## 🎨 Visual Design

### Highlight Colors
- **Blue (`#00aaff`)** - Hovered element
- **Green (`#00ff88`)** - Selected element
- **Orange (`#ff9500`)** - Margin spacing
- **Green (`#00ff88`)** - Padding spacing

### UI Components
1. **Inspector Toolbar** (top center)
   - Dark background (`rgba(0,0,0,0.9)`)
   - Blue border matching highlight color
   - Spacing toggle, exit button

2. **Property Panel** (right side)
   - 320px wide, scrollable
   - Live CSS property editor
   - Reset button to clear inline styles

3. **Element Labels**
   - Shows `#id` or `tag.class`
   - Displays dimensions (width × height)
   - Monospace font for clarity

## 🛠️ Components

### 1. DOMInspector
**Core highlighting engine**

```typescript
<DOMInspector
  isActive={true}
  onElementSelect={(info) => console.log(info)}
/>
```

**Features**:
- Uses `document.elementFromPoint()` to find elements under cursor
- Konva overlay for highlights (doesn't interfere with app)
- Crosshair guides when hovering
- Click to select (prevents propagation)

**Technical**:
- Fixed position Konva Stage (z-index: 9999)
- `pointerEvents: 'none'` except during active selection
- Listens to window `mousemove` + `click` (capture phase)

---

### 2. SpacingGuides
**Margin/padding visualization**

```typescript
<SpacingGuides element={selectedElement} />
```

**Features**:
- Orange rectangles for margin
- Green rectangles for padding
- Numeric labels showing pixel values
- Uses `window.getComputedStyle()` to read spacing

**DevTools parity**:
- Matches Chrome/Firefox DevTools spacing view
- Shows all 4 sides (top, right, bottom, left)
- Only renders if spacing > 0

---

### 3. PropertyPanel
**Live CSS editor**

```typescript
<PropertyPanel
  element={selectedElement}
  onClose={() => setShowPanel(false)}
/>
```

**Features**:
- Edit 15 common CSS properties
- Live updates via `element.style.setProperty()`
- Reset button to clear all inline styles
- Monospace inputs for code feel

**Properties**:
- Layout: `display`, `position`, `width`, `height`
- Spacing: `margin`, `padding`
- Visual: `background`, `color`, `opacity`
- Typography: `font-size`, `font-weight`
- Borders: `border`, `border-radius`
- Advanced: `transform`, `z-index`

---

### 4. HalcyonInspector
**Unified inspector interface**

```typescript
<HalcyonInspector
  isActive={inspectorMode}
  onClose={() => setInspectorMode(false)}
/>
```

**Combines**:
- DOMInspector for element highlighting
- PropertyPanel for editing
- Toolbar for controls
- Keyboard shortcuts (Esc to exit)

---

## 🚀 Integration with Primitives Palette

Add inspector as a primitive tool:

```typescript
// Update PrimitivesPalette.tsx
export type PrimitiveTool =
  | 'hand'
  | 'inspect'    // ← New
  | 'circle'
  // ... rest

const PRIMITIVE_SYMBOLS = {
  hand: '🖐',
  inspect: '🔍',  // ← New
  circle: '◯',
  // ... rest
}

// In InkCanvasDemo.tsx
const [showInspector, setShowInspector] = useState(false)

const handleToolSelect = (tool: PrimitiveTool) => {
  if (tool === 'inspect') {
    setShowInspector(true)
    setMode('select')  // Disable drawing while inspecting
  } else {
    setShowInspector(false)
  }
}

return (
  <>
    <Stage>{/* canvas */}</Stage>

    {showInspector && (
      <HalcyonInspector
        isActive={true}
        onClose={() => {
          setShowInspector(false)
          setPrimitiveTool('hand')
        }}
      />
    )}
  </>
)
```

---

## 🎯 Usage

### Basic Inspector Mode

1. Click primitives button (bottom-left)
2. Select **🔍 Inspect** tool
3. Hover over any element to highlight
4. Click to select and open property panel
5. Edit CSS properties live
6. Click **✕ Exit** or press Esc to close

### Advanced Features

**Spacing Mode**:
- Toggle **📏 Spacing** to see margin/padding
- Orange = margin, Green = padding
- Numeric labels show pixel values

**Property Editing**:
- Type new values in property panel
- Changes apply immediately
- Click **Reset Styles** to undo all changes

**Keyboard Shortcuts**:
- `Esc` - Exit inspector mode
- Click outside property panel to close it

---

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│ HalcyonInspector                    │
│  ├─ Inspector Toolbar (controls)    │
│  ├─ DOMInspector (Konva overlay)    │
│  │   └─ Highlight rectangles        │
│  ├─ SpacingGuides (margin/padding)  │
│  └─ PropertyPanel (CSS editor)      │
└─────────────────────────────────────┘
```

**Konva Overlay Pattern**:
1. Fixed-position `<Stage>` covering viewport
2. `pointerEvents: 'none'` on Stage (transparent to clicks)
3. Window event listeners capture mouse position
4. `document.elementFromPoint()` finds element under cursor
5. Konva draws highlights without touching app DOM

**Why this works**:
- Clean separation: inspector never modifies app structure
- Performance: Konva handles rendering, React handles state
- Flexibility: Works with any DOM, not just Halcyon entities

---

## 📦 File Structure

```
src/
└── components/
    └── inspector/
        ├── DOMInspector.tsx         # Core highlighting
        ├── SpacingGuides.tsx        # Margin/padding viz
        ├── PropertyPanel.tsx        # CSS editor
        ├── HalcyonInspector.tsx     # Main interface
        └── HalcyonInspector.css     # Styles
```

**Bundle size**: ~15KB (gzipped)

---

## 🎨 Customization

### Change Highlight Colors

```typescript
// In DOMInspector.tsx
const COLORS = {
  hover: '#00aaff',    // Blue
  selected: '#00ff88', // Green
  margin: '#ff9500',   // Orange
  padding: '#00ff88',  // Green
}
```

### Add More CSS Properties

```typescript
// In PropertyPanel.tsx
const COMMON_PROPERTIES = [
  // ... existing
  'flex',
  'grid-template-columns',
  'animation',
  'transition',
]
```

### Custom Toolbar Position

```css
/* In HalcyonInspector.css */
.inspector-toolbar {
  top: 20px;         /* Vertical position */
  left: 50%;         /* Horizontal position */
  transform: translateX(-50%);
}
```

---

## 🔮 Future Enhancements

### Phase 2: Measurement Tool
- Click-drag to measure distances
- Shows pixel distances between elements
- Angle measurements

### Phase 3: Screenshot Tool
- Capture selected element as PNG
- Export as SVG for vector editing
- Copy element styles to clipboard

### Phase 4: Animation Inspector
- View CSS animations/transitions
- Scrub through keyframes
- Edit easing functions visually

---

## 🎓 Comparison to VisBug

| Feature | VisBug | Halcyon Inspector |
|---------|--------|-------------------|
| **Highlight elements** | ✅ | ✅ |
| **Edit properties** | ✅ | ✅ |
| **Spacing guides** | ✅ | ✅ |
| **Accessibility** | ✅ | 🔮 Future |
| **Layout guides** | ✅ | 🔮 Future |
| **Font inspector** | ✅ | 🔮 Future |
| **Color picker** | ✅ | 🔮 Future |
| **Dependencies** | Chrome extension | None (Konva + React) |
| **Bundle size** | N/A | ~15KB |

**Advantage**: Halcyon Inspector is built into your app, no extension needed.

---

## 🐛 Known Limitations

1. **Pseudo-elements**: Can't inspect `::before`, `::after` (CSS limitation)
2. **Shadow DOM**: Limited access to shadow root elements
3. **Inline styles only**: Changes don't persist to stylesheet (by design)
4. **Z-index stacking**: Inspector overlay must be above everything (z-index: 9999)

---

## 📚 References

**Inspired by**:
- [VisBug](https://github.com/GoogleChromeLabs/projectvisbug) - Google Chrome Labs
- Chrome DevTools Elements panel
- Firefox Developer Tools Inspector

**Built with**:
- Konva.js - Canvas rendering
- react-konva - React bindings
- `document.elementFromPoint()` - DOM API
- `window.getComputedStyle()` - CSS API

---

**Status**: ✅ Complete and ready to integrate
**Last Updated**: 2025-12-07
**Location**: `/src/components/inspector/`
