# Component Suitability Audit - Touch-Screen Infinite Canvas

**Date:** 2025-12-07
**Context:** Refactoring from mode-switching to spatial infinite canvas with touch-first interaction

---

## ✅ SUITABLE - Small Floating Widgets

These components are **perfect** for the infinite canvas paradigm. They use fixed positioning and stay in viewport.

### UI Components (src/components/ui/)

| Component | Status | Notes |
|-----------|--------|-------|
| **ConfigInfo** | ✅ Perfect | Collapsible widget, right side (16rem), magnetic screen fitting on mobile |
| **ThemeToggle** | ✅ Perfect | Top-right corner (1rem), snaps to edge on mobile portrait |
| **StorageSettings** | ✅ Perfect | Below theme toggle (6rem), stacks vertically on mobile |
| **ZoomControls** | ✅ Perfect | Right side with magnetic edge fitting, controls camera zoom |
| **SpatialNavigator** | ✅ Perfect | Bottom navigation grid, animates camera to landmarks |
| **KeyboardGuide** | ✅ Perfect | Modal overlay, toggleable with `?` key |

**Why they work:**
- All use `position: fixed` - independent of canvas scroll/pan
- Have touch-friendly tap targets (44px minimum)
- Magnetic screen fitting on mobile (border-radius: 0 on edges)
- Don't block canvas content
- Respond to camera state but don't transform with it

---

## ⚠️ NEEDS ADAPTATION - Entity Cards

These components work but **need camera transform integration** to position correctly on infinite canvas.

### Entity Cards (src/components/entities/)

| Component | Current State | Issues | Fix Required |
|-----------|---------------|--------|--------------|
| **TaskCard** | Renders card UI | No positioning logic | ✅ OK (presentational only) |
| **NoteCard** | Renders card UI | No positioning logic | ✅ OK (presentational only) |
| **PersonCard** | Renders card UI | No positioning logic | ✅ OK (presentational only) |

### Primitives (src/components/primitives/)

| Component | Current State | Issues | Fix Required |
|-----------|---------------|--------|--------------|
| **BaseCard** | ✅ Has touch gestures | Uses absolute positioning without camera transform | 🔧 Add camera transform |
| **RelationLine** | SVG path between entities | Calculates coordinates without camera transform | 🔧 Add camera transform |

**Current rendering (ThinkMode.tsx - removed from App):**
```tsx
<BaseCard
  entity={task}
  style={{
    position: 'absolute',
    left: task.position.x,     // ❌ Doesn't account for camera.offsetX
    top: task.position.y,      // ❌ Doesn't account for camera.offsetY
  }}
>
  <TaskCard task={task} />
</BaseCard>
```

**Required fix - Apply camera transform:**
```tsx
<BaseCard
  entity={task}
  style={{
    position: 'absolute',
    left: task.position.x - camera.offsetX,        // ✅ Subtract camera offset
    top: task.position.y - camera.offsetY,         // ✅ Subtract camera offset
    transform: `scale(${camera.zoom})`,            // ✅ Apply zoom
    transformOrigin: 'top left',
  }}
>
  <TaskCard task={task} />
</BaseCard>
```

**Touch gesture compatibility:**
- BaseCard.tsx already has two-finger rotation (lines 38-67) ✅
- BaseCard.tsx already has pinch-to-scale (lines 70-80) ✅
- Context menu pin (•••) visible on touch devices (line 111) ✅
- Tap targets meet 44px minimum (task checkbox: 28px, could be larger)

---

## ❌ NOT SUITABLE - Large Blocking Components

These components **block the infinite canvas** and assume fixed viewport. Status of removal:

### Mode Components (src/components/modes/)

| Component | Size | Status | Action Taken |
|-----------|------|--------|--------------|
| **ThinkMode** | Full-height with header | ❌ Removed | ✅ Removed from App.tsx |
| **CrumpitMode** | Full-height with header + board | ❌ Removed | ✅ Removed from App.tsx |
| **LogMode** | Full-height with header + timeline | ❌ Removed | ✅ Removed from App.tsx |
| **WriteSurface** | Full-screen modal | ⚠️ Acceptable | Modal overlays OK, but unused |

**Why they don't work:**
- Full-height layouts (`.think-mode { height: 100vh }`)
- Headers block top of canvas (`.think-header { padding: 1.25rem 2rem }`)
- Fixed grid layouts incompatible with infinite canvas
- Designed for mode-switching, not spatial navigation

**Status:** ✅ All removed from App.tsx (lines 93-132), only terrain and floating tools remain

---

## 🔧 NEEDS REFACTORING - Container Components

These components have interesting concepts but **need rethinking** for infinite canvas.

### Containers (src/components/containers/)

| Component | Purpose | Issues | Recommendation |
|-----------|---------|--------|----------------|
| **ThreadContainer** | Desk-mat style narrative container | Fixed min-width (800px), assumes viewport positioning | Refactor as spatial entity with camera transform |
| **ZoneRegion** | Large background regions with landmarks | Uses absolute positioning without camera, pointer-events: none | Could work as background layer if camera-aware |

**ThreadContainer** (desk mat concept):
- **Good:** Visual grouping with faint boundaries, title ribbon
- **Problem:** `min-width: 800px`, `min-height: 600px` - doesn't scale with zoom
- **Fix needed:** Render as transformed entity, scale with zoom
```tsx
// Current: Fixed dimensions
.thread-container {
  min-width: 800px;
  min-height: 600px;
  position: relative;
}

// Needed: Camera transform + dynamic sizing
<div style={{
  position: 'absolute',
  left: thread.x - camera.offsetX,
  top: thread.y - camera.offsetY,
  transform: `scale(${camera.zoom})`,
  transformOrigin: 'top left',
}}>
```

**ZoneRegion** (landmark regions):
- **Good:** Faint backgrounds, optional patterns, landmark icons
- **Problem:** Assumes it's rendered at exact bounds coordinates
- **Fix needed:** Apply camera transform to bounds
```tsx
// Current: Direct bounds
style={{ left: bounds.x, top: bounds.y }}

// Needed: Camera-aware bounds
style={{
  left: bounds.x - camera.offsetX,
  top: bounds.y - camera.offsetY,
  transform: `scale(${camera.zoom})`,
}}
```

---

## 📋 Touch-Screen Checklist

### Minimum Tap Targets (44×44px recommended)
- ✅ ZoomControls buttons: 48×48px
- ✅ SpatialNavigator buttons: Auto-sized, full-width on mobile
- ✅ ToolRail buttons: Block-level with padding
- ✅ ThemeToggle: 40×40px (acceptable on desktop, could be larger)
- ⚠️ TaskCard checkbox: 28×28px (below minimum, should be 44×44px)
- ✅ BaseCard context menu pin: 28×28px but always visible on touch (line 111)

### Touch Gestures Support
- ✅ Pinch-to-zoom on canvas (useCamera.ts lines 95-138)
- ✅ Pan with single finger (useCamera.ts lines 66-93)
- ✅ Two-finger rotation on cards (BaseCard.tsx lines 38-67)
- ✅ Prevent default on multi-touch (useCamera.ts line 111)
- ✅ Passive: false event handlers (useCamera.ts lines 186-189)
- ✅ Touch-action: pan-x pan-y (App.css line 30)

### Mobile Portrait Optimizations
- ✅ Magnetic screen fitting (all UI components)
- ✅ Border-radius: 0 on screen edges
- ✅ Full-width bottom navigation (SpatialNavigator)
- ✅ Stacked right-side widgets (theme, storage, config)
- ✅ Keyboard hints hidden on portrait (App.css lines 278-282)
- ✅ Tool Rail full-screen overlay (ToolRail.css portrait media query)

---

## 🎯 Recommendations

### Immediate (No Breaking Changes)
1. ✅ **Mode components removed** - already done
2. ✅ **Floating widgets optimized** - already done
3. ⚠️ **Increase TaskCard checkbox tap target** - 28px → 44px
4. ⚠️ **Increase ThemeToggle tap target** - 40px → 48px

### Short-term (Entity Rendering)
1. **Create SpatialCanvas component** - Wrapper that renders entities with camera transform
2. **Apply camera transform to BaseCard** - Account for offsetX, offsetY, zoom
3. **Apply camera transform to RelationLine** - Transform SVG coordinates
4. **Test rotation gestures with zoom** - Ensure two-finger twist works at all zoom levels

### Medium-term (Advanced Features)
1. **Refactor ThreadContainer** - Make camera-aware, render as spatial entity
2. **Refactor ZoneRegion** - Background layer with camera transform
3. **Viewport culling** - Only render entities within visible viewport + margin
4. **Gesture improvements** - Better conflict resolution between pan, zoom, rotate

### Example: SpatialCanvas Component

```tsx
// src/components/spatial/SpatialCanvas.tsx
import { useCamera } from '../../hooks/useCamera'
import { useHalcyonStore } from '../../store/halcyonStore'
import { BaseCard } from '../primitives/BaseCard'
import { TaskCard } from '../entities/TaskCard'

export function SpatialCanvas() {
  const { camera } = useCamera()
  const { entities } = useHalcyonStore()

  // Get viewport bounds for culling
  const viewportLeft = camera.offsetX
  const viewportTop = camera.offsetY
  const viewportRight = camera.offsetX + window.innerWidth / camera.zoom
  const viewportBottom = camera.offsetY + window.innerHeight / camera.zoom
  const margin = 500 // Render margin

  // Filter visible entities (viewport culling)
  const visibleEntities = Array.from(entities.values()).filter(entity => {
    return (
      entity.position.x > viewportLeft - margin &&
      entity.position.x < viewportRight + margin &&
      entity.position.y > viewportTop - margin &&
      entity.position.y < viewportBottom + margin
    )
  })

  return (
    <div className="spatial-canvas" style={{
      position: 'absolute',
      inset: 0,
      overflow: 'hidden',
    }}>
      {visibleEntities.map(entity => (
        <BaseCard
          key={entity.id}
          entity={entity}
          style={{
            position: 'absolute',
            left: entity.position.x - camera.offsetX,
            top: entity.position.y - camera.offsetY,
            transform: `scale(${camera.zoom})`,
            transformOrigin: 'top left',
          }}
        >
          {entity.type === 'task' && <TaskCard task={entity} />}
          {entity.type === 'note' && <NoteCard note={entity} />}
          {entity.type === 'person' && <PersonCard person={entity} />}
        </BaseCard>
      ))}
    </div>
  )
}
```

---

## 📊 Summary

| Category | Count | Status |
|----------|-------|--------|
| ✅ Suitable (floating widgets) | 6 | Ready to use |
| ⚠️ Needs adaptation (entity cards) | 5 | Requires camera transform |
| ❌ Not suitable (mode components) | 4 | Already removed |
| 🔧 Needs refactoring (containers) | 2 | Future work |

**Current state:** Canvas is ultraclean with only terrain and floating tools visible. Ready to add spatial entity rendering.

**Next step:** Implement SpatialCanvas component to render entity cards at landmark coordinates with camera transform.
