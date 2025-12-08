# Primitives Palette - Cave Painting Aesthetic

Floating tool palette inspired by ancient cave paintings and symbolic communication.

## 🎨 Design Philosophy

The Primitives Palette uses an **ancient cave painting aesthetic** to make drawing tools feel timeless and intuitive:

- **Earthy colors**: Ochre (`#e8d5c4`), dark brown (`#3d2817`), earth tones
- **Rough textures**: Simulated rock surface with subtle shadows
- **Symbolic icons**: Primitive shapes (circles, spirals, dots, waves)
- **Timeless feel**: Tools that could have been used 40,000 years ago

## 🛠️ Available Tools

| Tool | Symbol | Purpose |
|------|--------|---------|
| **Hand** | 🖐 | Navigate/pan the canvas |
| **Circle** | ◯ | Draw perfect circles |
| **Line** | — | Draw straight lines/arrows |
| **Spiral** | 🌀 | Draw organic spirals |
| **Dot** | • | Place markers/points |
| **Wave** | 〰 | Draw wavy/flowing lines |
| **Sun** | ☀ | Create radial bursts |
| **Hand Print** | 👋 | Stamp/mark areas |

## 📍 Location

**Fixed position**: Bottom-left corner
**z-index**: 1000 (above canvas, below modals)

## 🎯 Behavior

### Collapsed State
- Circular button showing active tool icon
- 60x60px on desktop, 50x50px on mobile
- Hover: slight scale up (1.05x)
- Click: expands to show all tools

### Expanded State
- 2×4 grid of primitive tools
- Smooth fade-in animation (0.2s)
- Click any tool to activate
- Auto-collapses after selecting a drawing tool
- "Hand" tool keeps palette expanded

### Active Tool Indication
- Dark background (`#3d2817`)
- Light-colored icon
- Slightly larger scale (1.1x)
- Bold label text

## 🎨 Styling

```css
/* Cave painting color palette */
--cave-bg: #e8d5c4;      /* Ochre/sand */
--cave-dark: #3d2817;    /* Dark earth */
--cave-border: #8b6f47;  /* Clay/mud */
--cave-shadow: rgba(61, 40, 23, 0.3);
```

### Effects
- **Texture overlay**: Diagonal hatching pattern (5% opacity)
- **Text shadow**: Simulated "painted on rock" effect
- **Rough borders**: 3px solid with earthy tones
- **Soft shadows**: Inset + drop shadows for depth

## 🌓 Dark Mode

Automatically adapts to dark mode with inverted palette:
- `--cave-bg: #2a1f17` (dark earth)
- `--cave-dark: #e8d5c4` (light ochre)
- Maintains the same ancient aesthetic

## 📱 Responsive Design

### Desktop (>768px)
- Button: 60×60px
- Grid: 160px min-width
- Icons: 24px
- Labels: 10px

### Mobile (≤768px)
- Button: 50×50px
- Grid: 140px min-width
- Icons: 20px
- Labels: 9px
- Positioned 10px from edges

## ♿ Accessibility

- **Keyboard navigation**: Tab through tools
- **ARIA labels**: Each tool has descriptive label
- **Reduced motion**: Respects `prefers-reduced-motion`
- **High contrast**: Strong color differentiation
- **Touch targets**: Minimum 50×50px tap areas

## 🔗 Integration

### Basic Usage

```tsx
import { PrimitivesPalette } from './components/ui/PrimitivesPalette'

function MyCanvas() {
  const [activeTool, setActiveTool] = useState<PrimitiveTool>('hand')

  return (
    <>
      <Canvas />
      <PrimitivesPalette
        activeTool={activeTool}
        onToolSelect={setActiveTool}
      />
    </>
  )
}
```

### With Drawing Modes

```tsx
const handleToolSelect = (tool: PrimitiveTool) => {
  setActiveTool(tool)

  // Map primitive to canvas mode
  if (tool === 'hand') {
    setCanvasMode('pan')
  } else {
    setCanvasMode('draw')
    // Set brush style based on primitive
    setBrush(getPrimitiveBrush(tool))
  }
}
```

## 🎨 Future Enhancements

### Phase 2: Smart Primitives
- **Circle tool**: Click-drag to draw perfect circles
- **Line tool**: Snap to 0°, 45°, 90° angles
- **Spiral tool**: Fibonacci spiral generation
- **Wave tool**: Smooth sinusoidal curves

### Phase 3: Primitive Presets
Each primitive could have preset brush styles:
```typescript
const PRIMITIVE_BRUSHES = {
  circle: { width: 3, color: '#111', fill: false },
  spiral: { width: 2, color: '#666', tension: 0.8 },
  dot: { width: 6, shape: 'circle' },
  wave: { width: 2, amplitude: 20, wavelength: 40 },
}
```

### Phase 4: Gesture Recognition
- Draw circle → automatically closes + smooths
- Draw line → automatically straightens
- Draw wave → automatically smooths to sine curve

## 🏛️ Historical Inspiration

The palette draws from actual cave painting techniques:

**Lascaux Caves** (France, ~17,000 BCE):
- Ochre, charcoal, hematite pigments
- Hand stencils (negative prints)
- Dots, lines, grids as symbols

**Chauvet Cave** (France, ~30,000 BCE):
- Finger drawings in soft clay
- Torch smudging for shading
- Geometric patterns alongside animals

**Altamira Cave** (Spain, ~14,000 BCE):
- Bison using cave wall contours
- Hand prints as signatures
- Charcoal outline + ochre fill

**Symbol meanings**:
- **Dots**: Stars, counting marks, territory markers
- **Lines**: Paths, rivers, spears
- **Spirals**: Time, cycles, journeys
- **Circles**: Sun, moon, wholeness
- **Hand prints**: "I was here", identity

## 📚 References

- Color palette inspired by natural pigments (ochre, charcoal, clay)
- Icons selected for universal symbolic meaning
- Button shapes echo pebbles and hand-held tools
- Textures simulate rough rock surfaces

---

**Status**: ✅ Complete
**Last Updated**: 2025-12-07
**Location**: `/src/components/ui/PrimitivesPalette.tsx`
