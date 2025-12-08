# Halcyon Prototype

Interactive POC for Halcyon OS - A biology-aligned, spatial, monochrome-first thinking environment.

**Optimized for**: DC-1 Daylight Computer (60Hz RLCD display)

## 🌅 What is Halcyon?

Halcyon is a cognition-centric operating system that treats thoughts, tasks, and relationships as spatial objects. It's designed around how humans actually think, not how computers traditionally organize information.

### Core Philosophy

- **Biology-first**: Designed for human cognition, not computer architecture
- **Spatial**: Position is meaning - where you put things matters
- **Monochrome-first**: Perfect clarity on DC-1's reflective LCD
- **Handwriting-native**: Ink as a first-class input method
- **Local-first**: Everything works offline, persists locally

## 🖥️ DC-1 RLCD Optimization

This POC is specifically optimized for the **Daylight Computer DC-1** and its 60Hz reflective LCD (RLCD) display.

### Why Monochrome-First?

The DC-1's RLCD performs best with high-contrast, monochrome interfaces:

- **Maximum clarity** in direct sunlight
- **60Hz refresh rate** optimized animations
- **Reflective display** - no backlight needed
- **Battery efficiency** - monochrome reduces power draw

### Theme System

**Default (Monochrome)**: Pure black on white
- Optimized for DC-1 RLCD
- Maximum contrast
- All information conveyed through border weight, typography, spacing

**Optional (Calm)**: Warm paper-like tones
- For standard displays
- Gentle cream background (#f2f0e3)
- Coral accents (#f76f53)
- Never essential - purely decorative

Toggle between themes with the ◐/◑ button (top-right).

## 🚀 Quick Start

```bash
npm install
npm run dev
# Open http://localhost:5173
```

## 🎯 What's Implemented

### ✅ CRUMPIT Mode
- Energy-based task triage
- Four quadrants with enforced limits
- Drag-and-drop organization
- Instant-save persistence

### ✅ THINK Mode
- Infinite spatial canvas
- Zones, Threads, Relations
- BaseCard with gestures
- WriteSurface for notes

See full README in parent directory for details.

## 📦 Dependencies & Licenses

This project uses the following key dependencies:

- **zustand** (MIT) - State management
- **React** (MIT) - UI framework
- **Vite** (MIT) - Build tool

All dependencies are MIT licensed and included via npm.

**Note**: The spatial canvas uses DOM-based rendering with CSS transforms (Kinopio pattern), not react-zoom-pan-pinch or tldraw.

**Ink Canvas**: Konva.js (React Konva) for Canvas 2D rendering
- ✅ Optimized for freehand drawing and ink strokes
- ✅ Performance optimizations applied per [Konva docs](https://konvajs.org/docs/performance/All_Performance_Tips.html)
- ✅ RAF batching, React.memo, useCallback, listening=false on static shapes

---

## 🔮 Future Architecture Considerations

### Current State (2025)
**Spatial Canvas**: DOM-based with CSS transforms (inspired by [Kinopio](https://kinopio.club))
- ✅ Proven pattern for 100-1000 cards ([Kinopio handles 500+ cards](https://github.com/kinopio-club/kinopio-client))
- ✅ Viewport culling (200px margin) - only renders visible cards
- ✅ React.memo on components, useCallback on handlers
- ✅ Zero library dependencies, native browser performance
- ⚠️ May hit limits at 10,000+ cards

### Scaling Path: WebGL Rendering (Miro-style)

If we need to support massive canvases (10,000+ cards, real-time collaboration), consider:

#### **[PixiJS](https://pixijs.com/)** (WebGL/WebGPU Renderer)
- **Performance**: [60 FPS with 8,000 moving objects](https://benchmarks.slaylines.io/)
- **Benchmarks**: Outperforms Canvas2D, Paper.js, and Two.js ([comparison](https://github.com/slaylines/canvas-engines-comparison))
- **Features**: Batch rendering, `cacheAsTexture` for static content, viewport culling
- **Browser Support**: WebGL2 production-ready, WebGPU experimental ([PixiJS docs](https://pixijs.com/8.x/guides/components/renderers))
- **License**: MIT
- **Use Case**: Miro/Figma-scale infinite canvas with thousands of objects

**When to migrate**: When experiencing performance issues with 5,000+ cards or real-time collaborative editing

#### Implementation Strategy
1. Keep DOM-based rendering for UI layer (toolbars, dialogs, text editing)
2. Use PixiJS for canvas content layer (cards, connections, stickers)
3. Hybrid approach: DOM for interactivity, WebGL for rendering ([tutorial](https://antv.vision/infinite-canvas-tutorial/guide/lesson-008))

---

### Technology Decisions

#### State Management
**Current**: [Zustand](https://github.com/pmndrs/zustand) (✅ Keeping)
- Minimal API, great performance
- React 19 compatible

**Considered**: [CerebralJS](https://cerebraljs.com/)
- ❌ Maintenance mode since 2021
- Time-travel debugging is nice but overkill for our needs
- **Verdict**: Stick with Zustand ([CerebralJS GitHub](https://github.com/cerebral/cerebral))

#### Styling
**Current**: Plain CSS (✅ Keeping)
- Native CSS nesting (supported in all modern browsers 2025)
- CSS custom properties for theming

**Not Using**: Less/Sass preprocessors
- Modern CSS has [native nesting, variables, and advanced selectors](https://medium.com/@steinwendner.matthias/should-we-ditch-css-preprocessors-in-2025-5753c25e3fde)
- Preprocessors moved from "mandatory" to "optional specialization" ([CSS evolution 2025](https://medium.com/@erennaktas/is-css-the-new-sass-heres-what-you-need-to-know-in-2025-fef0e9a379c6))
- **Verdict**: Plain CSS is faster and more maintainable

#### Build Tool
**Current**: [Vite](https://vitejs.dev/) (✅ Keeping)
- 1.2s cold start vs Webpack's 7s ([comparison](https://kinsta.com/blog/vite-vs-webpack/))
- 10-20ms HMR vs Webpack's 500ms-1.6s
- 130KB bundle vs Webpack's 150KB
- [Developer preference leader in 2025](https://pieces.app/blog/vite-vs-webpack-which-build-tool-is-right-for-your-project)

**Not Using**: Webpack
- Only needed for complex legacy projects
- **Verdict**: Vite is 21x faster for builds ([benchmarks](https://talent500.com/blog/vite-vs-turbopack-vs-webpack-fastest-bundler/))

---

## Sources
- [PixiJS Renderers Documentation](https://pixijs.com/8.x/guides/components/renderers)
- [Canvas Engines Performance Comparison](https://benchmarks.slaylines.io/)
- [Miro Canvas Architecture Discussion](https://www.quora.com/What-is-miro-coms-front-end-technology-stack-so-I-can-create-a-similar-canvas-application-with-high-performance)
- [CerebralJS State Management](https://cerebraljs.com/)
- [CSS Preprocessors in 2025](https://medium.com/@steinwendner.matthias/should-we-ditch-css-preprocessors-in-2025-5753c25e3fde)
- [Vite vs Webpack Performance](https://kinsta.com/blog/vite-vs-webpack/)
