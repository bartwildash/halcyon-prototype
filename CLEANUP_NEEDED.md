# Cleanup Needed - Spatial Refactoring

## Issues Found

### 1. **App.tsx still uses mode-based rendering**

**Current (Lines 115-118):**
```tsx
{currentMode === 'think' && <ThinkMode />}
{currentMode === 'plan' && <ThinkMode />}
{currentMode === 'crumpit' && <CrumpitMode />}
{currentMode === 'log' && <LogMode />}
```

**Problem:** We switched to spatial landmarks but still conditionally render based on mode.

**Solution:** Either:
- A) Show all content at once (everything is on the infinite canvas at different coordinates)
- B) Calculate which content to show based on camera position and viewport
- C) Remove mode components entirely and use a single spatial canvas with entities

**Recommendation:** Option A - render all entities on a single spatial canvas, no conditional rendering by mode.

---

### 2. **Mode state still referenced**

**Current (Line 22):**
```tsx
const { entities, currentMode, setMode, createTask, ... } = useHalcyonStore()
```

**Problem:** `currentMode` and `setMode` are legacy from mode-switching paradigm.

**Solution:** Remove from store and App, rely solely on camera position.

---

### 3. **Default mode initialization**

**Current (Lines 28-33):**
```tsx
useEffect(() => {
  if (currentMode === 'think' && config.preferences.defaultMode !== 'think') {
    setMode(config.preferences.defaultMode)
  }
}, [])
```

**Problem:** Initializing to a "mode" doesn't make sense in spatial model.

**Solution:** Initialize camera to a default landmark position instead:
```tsx
useEffect(() => {
  // Start at Lake (center)
  panTo(0, 0, 0) // No animation on first load
}, [])
```

---

### 4. **Tool Rail still mode-based**

**Current (ToolRail.tsx):**
```tsx
const currentMode = useHalcyonStore((state) => state.currentMode)
const tools = MODE_TOOLS[currentMode] || MEADOW_TOOLS
```

**Problem:** Tool Rail uses mode instead of camera position.

**Solution:** Calculate closest landmark based on camera position:
```tsx
const { camera } = useCamera()
const centerX = camera.offsetX + window.innerWidth / 2
const centerY = camera.offsetY + window.innerHeight / 2
const closestLandmark = getClosestLandmark(centerX, centerY)
const tools = LANDMARK_TOOLS[closestLandmark.id] || MEADOW_TOOLS
```

---

### 5. **Sample data coordinates**

**Current:** Sample entities have arbitrary x/y coordinates (200, 500, 800, etc.)

**Problem:** Not aligned to landmark locations.

**Solution:** Place sample entities at landmark coordinates:
```tsx
// Place tasks near Mt. Crumpit (2400, 400)
{ title: 'Fix critical bug', x: 2300, y: 350 },
{ title: 'Triage inbox', x: 2450, y: 420 },

// Place notes near Lake (0, 0)
{ content: 'Design thoughts...', x: -50, y: 50 },

// Place logs near Canyon (-1200, 0)
{ content: 'Daily reflection...', x: -1150, y: 20 },
```

---

## Recommendations

### Quick Win (30 min):
1. Update ToolRail to use camera position instead of mode
2. Remove default mode initialization
3. Start camera at Lake (0, 0)

### Medium Refactor (2 hours):
1. Remove `currentMode` and `setMode` from store entirely
2. Render all content on single spatial canvas
3. Update sample data to use landmark coordinates
4. Remove mode-based conditional rendering

### Full Spatial (4 hours):
1. All of above
2. Add "region indicators" showing which landmark you're near
3. Smooth terrain transitions as you pan
4. Visual cues when entering/leaving landmark regions

---

## Current Status

✅ **Working:**
- Spatial terrain blending based on camera position
- Landmarks defined with coordinates
- Spatial navigator for jumping between locations
- Camera pan/zoom with touch gestures

❌ **Needs Cleanup:**
- Mode-based content rendering
- Tool Rail still uses mode
- Store still has mode state
- Sample data not aligned to landmarks
