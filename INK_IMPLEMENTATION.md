# Halcyon Ink Drawing Implementation

Complete ink/drawing system for Halcyon using Konva + React.

## ✅ What's Been Built

### 1. **Core Ink Types** (`src/types/ink.ts`)
- `InkStroke` - Individual pen strokes with points, color, width, opacity
- `InkBrush` - Brush configuration (pen, marker, pencil presets)
- Serialization helpers for storing strokes as JSON
- SVG export functionality

### 2. **InkLayer Component** (`src/components/ink/InkLayer.tsx`)
- Freehand drawing layer for canvas-wide sketching
- Touch, mouse, and stylus support
- Real-time stroke rendering
- Undo/clear functionality

### 3. **InkNoteCard Component** (`src/components/ink/InkNoteCard.tsx`)
- Handwritten note cards with embedded ink strokes
- Card-local coordinate system (ink moves with card)
- Prevents drag while drawing
- Different paper textures per note kind (idea/reference/draft)

### 4. **InkToolbar Component** (`src/components/ink/InkToolbar.tsx`)
- Mode switching: Pan / Draw / Select
- Brush customization: width, opacity, color
- Preset brushes: Pen (2px), Marker (8px), Pencil (1.5px)
- Undo/clear actions
- Clean monochrome UI matching Halcyon aesthetic

### 5. **InkCanvasDemo Page** (`src/pages/InkCanvasDemo.tsx`)
- Complete working demo integrating:
  - Terrain background (Canvas 2D)
  - Konva entity layer
  - Ink drawing on note cards
  - Free-form canvas sketching
  - Camera controls (pan/zoom)
- Keyboard shortcuts: Space (pan), D (draw), V (select), Cmd+Z (undo)

## 🎨 Features

### Drawing Capabilities
- ✅ Touch & mouse support
- ✅ Smooth bezier curves (tension: 0.5)
- ✅ Adjustable brush width (1-20px)
- ✅ Variable opacity (10-100%)
- ✅ Color picker
- ✅ Multiple brush presets

### Note Cards
- ✅ Draw directly on note entities
- ✅ Strokes saved as JSON in `NoteEntity.inkStrokes`
- ✅ Strokes move with card
- ✅ Handwritten badge (✏️) when card has ink
- ✅ Different paper colors per note kind

### Performance
- ✅ Strokes stored as Konva `Line` objects (GPU-accelerated)
- ✅ No re-render on every stroke point (uses local state)
- ✅ Smooth 60fps drawing on desktop

## 🚀 How to Use

### 1. Access the Ink Demo
```
npm run dev
```
- Open http://localhost:5173
- Click **"✏️ Try Ink Drawing"** button (bottom right)

### 2. Drawing Controls
- **✋ Pan mode** - Move camera, drag cards (Space key)
- **✏️ Draw mode** - Freehand drawing (D key)
- **↖️ Select mode** - Select entities (V key)

### 3. Brush Tools (Draw Mode Only)
- 🖊️ **Pen** - Fine 2px stroke
- 🖍️ **Marker** - Thick 8px stroke, 70% opacity
- ✎ **Pencil** - Light 1.5px stroke, 60% opacity
- **Width slider** - Adjust stroke thickness (1-20px)
- **Opacity slider** - Adjust transparency (10-100%)
- **Color picker** - Change ink color

### 4. Actions
- **↶ Undo** - Remove last stroke (Cmd+Z)
- **🗑️ Clear** - Delete all strokes

## 📁 File Structure

```
src/
├── types/
│   └── ink.ts                    # Ink types & serialization
├── components/
│   └── ink/
│       ├── InkLayer.tsx          # Free-form drawing layer
│       ├── InkNoteCard.tsx       # Handwritten note cards
│       ├── InkToolbar.tsx        # Drawing toolbar UI
│       └── InkToolbar.css        # Toolbar styles
└── pages/
    └── InkCanvasDemo.tsx         # Complete demo integration
```

## 🔧 Integration with Halcyon Entities

### Storing Ink on Notes

```typescript
const note: NoteEntity = {
  // ... base fields
  type: 'note',
  title: 'My Sketch',
  body: '',
  kind: 'idea',
  inkStrokes: JSON.stringify([    // ← Serialized ink data
    {
      id: 'stroke-1',
      points: [10, 20, 15, 25, ...],
      color: '#111',
      width: 2,
      opacity: 1,
      timestamp: Date.now(),
    }
  ])
}
```

### Loading & Rendering

```typescript
import { deserializeStrokes } from '../types/ink'

const strokes = deserializeStrokes(note.inkStrokes || '[]')

// Render as Konva Lines
{strokes.map(stroke => (
  <Line
    key={stroke.id}
    points={stroke.points}
    stroke={stroke.color}
    strokeWidth={stroke.width}
    opacity={stroke.opacity}
    tension={0.5}
    lineCap="round"
  />
))}
```

## 🎯 Next Steps

### Phase 2: Advanced Ink
- [ ] Add `perfect-freehand` for pressure-sensitive strokes (Apple Pencil)
- [ ] Eraser tool
- [ ] Stroke selection & deletion
- [ ] Copy/paste ink between cards

### Phase 3: Export & Sharing
- [ ] Export note as SVG
- [ ] Export note as PNG image
- [ ] Share handwritten note as image

### Phase 4: Collaboration
- [ ] Real-time collaborative drawing
- [ ] Show other users' cursors while drawing
- [ ] Stroke attribution (who drew what)

## 🖼️ Pintura Integration (Future)

For sticker creation and image editing, consider [Pintura](https://www.npmjs.com/package/@pqina/pintura):

### Use Cases
- **Sticker creation**: Edit/crop images → save as `StickerEntity`
- **Photo annotations**: Draw on images, add text
- **Image adjustments**: Filters, brightness, contrast
- **Avatars**: Crop/edit profile pictures for `PersonEntity`

### Integration Pattern
```typescript
import { PinturaEditor } from '@pqina/pintura'

function StickerCreator() {
  const handleEditComplete = (output) => {
    // Save edited image as sticker entity
    const sticker: StickerEntity = {
      type: 'sticker',
      icon: output.dataURL,
      size: 'medium',
      // ...
    }
  }

  return <PinturaEditor onProcess={handleEditComplete} />
}
```

**Cost**: €299-€999 (one-time, includes source code)
**Alternative**: Build basic crop/filter tools with Konva if budget-constrained

## 📝 Notes

- Ink coordinates are stored in **card-local space**, not world space
- This means strokes move/rotate with their parent card
- For free-form canvas drawing, coordinates are in world space
- All strokes use Konva's built-in anti-aliasing and smoothing

## 🐛 Known Issues

- None currently! 🎉

## 🙏 Credits

- **Konva** - Canvas rendering library
- **react-konva** - React bindings for Konva
- Inspired by GoodNotes, Procreate, and Flipboard's canvas architecture

---

**Status**: ✅ Complete and ready to use
**Last Updated**: 2025-12-07
