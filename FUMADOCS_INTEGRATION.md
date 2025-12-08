# Fumadocs Integration - Halcyon Docs

Custom documentation system using Fumadocs with Halcyon's primitive toolbar aesthetic and zen colour scheme.

## Overview

**Fumadocs** is a flexible React.js documentation framework that we've integrated with custom styling to match Halcyon's design philosophy:

- **Zen monochrome colors** (black #000000, white #ffffff, gray #f8f8f8)
- **Primitive-style sidebar** (pill-shaped, frosted glass, like FloatingToolbar)
- **Minimal, calm aesthetic** (no unnecessary decoration)
- **Responsive mobile FAB** (collapses to floating action button)

## Files Created

```
src/components/docs/
├── HalcyonDocsLayout.tsx      # Main docs layout wrapper
├── HalcyonDocsLayout.css      # Zen typography and content styles
├── HalcyonDocsSidebar.tsx     # Primitive-style navigation sidebar
├── HalcyonDocsSidebar.css     # Sidebar styling (matches FloatingToolbar)
└── index.ts                   # Exports

src/pages/
└── DocsDemo.tsx               # Example documentation page
```

## Usage

### Basic Setup

```tsx
import { HalcyonDocsLayout, type DocsTreeItem } from '@/components/docs'

const docsTree: DocsTreeItem[] = [
  {
    title: 'Getting Started',
    icon: '📚',
    items: [
      { title: 'Introduction', url: '#introduction' },
      { title: 'Installation', url: '#installation' },
    ],
  },
  {
    title: 'API Reference',
    icon: '📖',
    url: '#api',
    separator: true, // Add visual separator
  },
]

function MyDocsPage() {
  return (
    <HalcyonDocsLayout tree={docsTree}>
      <article>
        <h1>Documentation Title</h1>
        <p>Your content here...</p>
      </article>
    </HalcyonDocsLayout>
  )
}
```

### DocsTreeItem Interface

```typescript
interface DocsTreeItem {
  title: string              // Display name
  url?: string              // Navigation URL
  icon?: string             // Emoji or symbol
  items?: DocsTreeItem[]    // Nested subitems
  separator?: boolean       // Add separator after this item
}
```

## Design Specifications

### Sidebar

**Desktop**:
- Position: Fixed left at `left: 20px`
- Shape: Vertical pill (48px wide)
- Transform: `translateY(-50%)` (vertically centered)
- Background: `rgba(255, 255, 255, 0.95)` with `blur(12px)`
- Border: `2px solid #000000`
- Items: 32px circular buttons with icons

**Mobile**:
- Collapsed: 56px FAB at `bottom: 20px, left: 20px`
- Expanded: Centered modal overlay with labels visible
- Full-width buttons with icon + text

### Content Area

- Max width: 900px
- Margin-left: 80px (space for sidebar)
- Typography:
  - H1: 40px, bold, 2px bottom border
  - H2: 28px, bold
  - H3: 20px, semi-bold
  - Body: 16px, line-height 1.6
  - Code: SF Mono, 1px black border, f0f0f0 background

### Color Palette

**Light Mode (Zen)**:
- Background: `#ffffff` white
- Text: `#000000` black
- Code background: `#f0f0f0` light gray
- Pre background: `#f8f8f8` lighter gray
- Borders: `#000000` black 2px

**Dark Mode** (optional, respects prefers-color-scheme):
- Background: `#000000` black
- Text: `#ffffff` white
- Inverted but maintains monochrome aesthetic

## Responsive Behavior

### Desktop (>768px)
- Full vertical sidebar on left
- Icon-only navigation (tooltips on hover)
- 80px left margin for content

### Mobile (≤768px)
- Sidebar collapses to FAB
- Expanded sidebar shows as modal overlay
- Labels visible (icon + text)
- Full-width tap targets (40px height)

## Accessibility

- ✅ **ARIA labels**: Every nav item has `aria-label`
- ✅ **Tooltips**: Radix UI Tooltip (accessible)
- ✅ **Keyboard navigation**: Tab through items
- ✅ **Focus indicators**: Visible focus rings
- ✅ **Semantic HTML**: `<nav>`, `<article>`, proper headings

## Integration with Fumadocs

While we've installed Fumadocs packages (`fumadocs-ui`, `fumadocs-core`, `fumadocs-mdx`), this implementation uses **custom components** rather than Fumadocs' default UI to maintain Halcyon's aesthetic.

You can integrate Fumadocs features as needed:

```tsx
import { DocsPage } from 'fumadocs-ui/page'
import { HalcyonDocsLayout } from '@/components/docs'

// Wrap Fumadocs components in Halcyon layout
function MyPage({ page }) {
  return (
    <HalcyonDocsLayout tree={navigationTree}>
      <DocsPage page={page} />
    </HalcyonDocsLayout>
  )
}
```

## Comparison to Standard Fumadocs

| Feature | Standard Fumadocs | Halcyon Docs |
|---------|------------------|--------------|
| Sidebar | Multi-column, colored | Single pill, monochrome |
| Icons | Optional | Required, icon-only on desktop |
| Colors | Theme-based (multiple colors) | Zen monochrome (#000/#fff) |
| Mobile | Hamburger menu | FAB (floating action button) |
| Typography | Default | Custom zen styling |
| Layout | Flexible | Fixed left sidebar + content |

## Examples

See `src/pages/DocsDemo.tsx` for a complete working example with:
- Multi-level navigation
- Icons for each section
- Expandable/collapsible sections
- Separators between groups
- Full documentation content with tables, code blocks, lists

## Zen Colour Scheme Verified

✅ The documentation system maintains Halcyon's zen monochrome aesthetic:

- Pure black (#000000) and white (#ffffff) only
- No accent colors (matches `index.css` global styles)
- 2px black borders (matches button styling)
- Subtle gray backgrounds for code (#f0f0f0, #f8f8f8)
- Dark mode inverts to white-on-black

This matches the existing design system defined in:
- `src/index.css` - Global monochrome-first styles
- `src/components/toolbar/FloatingToolbar.css` - Pill-shaped UI pattern
- `src/components/ui/PrimitivesPalette.css` - Cave painting aesthetic (separate earthy palette for primitives only)

---

## Resources

**Fumadocs**:
- [Official Website](https://fumadocs.dev/)
- [GitHub Repository](https://github.com/fuma-nama/fumadocs)
- [Quick Start Guide](https://fumadocs.dev/docs/ui)
- [Next.js Installation](https://fumadocs.dev/docs/ui/manual-installation/next)

**Halcyon**:
- See `FLOATING_TOOLBAR.md` for pill-shaped UI pattern
- See `PRIMITIVES_PALETTE.md` for cave painting aesthetic
- See `src/index.css` for zen colour scheme definition
