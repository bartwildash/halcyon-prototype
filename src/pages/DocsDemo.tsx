/**
 * DocsDemo - Example usage of HalcyonDocsLayout with Fumadocs
 *
 * Shows documentation with primitive-style sidebar navigation
 */

import { HalcyonDocsLayout, type DocsTreeItem } from '../components/docs/HalcyonDocsLayout'

// Sample documentation tree
const docsTree: DocsTreeItem[] = [
  {
    title: 'Getting Started',
    icon: '📚',
    items: [
      { title: 'Introduction', url: '#introduction' },
      { title: 'Installation', url: '#installation' },
      { title: 'Quick Start', url: '#quick-start' },
    ],
  },
  {
    title: 'Core Concepts',
    icon: '🧠',
    items: [
      { title: 'Domains', url: '#domains' },
      { title: 'Entities', url: '#entities' },
      { title: 'Spatial Canvas', url: '#canvas' },
    ],
    separator: true,
  },
  {
    title: 'Components',
    icon: '🔧',
    items: [
      { title: 'Toolbar', url: '#toolbar' },
      { title: 'Ink Drawing', url: '#ink' },
      { title: 'Primitives', url: '#primitives' },
    ],
  },
  {
    title: 'API Reference',
    icon: '📖',
    url: '#api',
  },
]

export function DocsDemo() {
  return (
    <HalcyonDocsLayout tree={docsTree}>
      <article>
        <h1>Halcyon Documentation</h1>

        <section id="introduction">
          <h2>Introduction</h2>
          <p>
            Halcyon is a spatial thinking environment designed for calm, focused work.
            It combines infinite canvas navigation with structured entity management
            across five mental domains.
          </p>

          <p>Key features:</p>
          <ul>
            <li>Spatial canvas with terrain-based zones</li>
            <li>Five mental domains (think, crumpit, write, log, people)</li>
            <li>Ink drawing and handwritten notes</li>
            <li>Primitive cave-painting aesthetic tools</li>
            <li>Zen monochrome design philosophy</li>
          </ul>
        </section>

        <section id="installation">
          <h2>Installation</h2>
          <p>Install Halcyon with npm:</p>
          <pre><code>npm install halcyon-prototype</code></pre>

          <p>Or with yarn:</p>
          <pre><code>yarn add halcyon-prototype</code></pre>
        </section>

        <section id="quick-start">
          <h2>Quick Start</h2>
          <p>Get started with a minimal Halcyon canvas:</p>

          <pre><code>{`import { HalcyonCanvas } from 'halcyon-prototype'

function App() {
  return <HalcyonCanvas />
}`}</code></pre>
        </section>

        <section id="domains">
          <h2>Domains</h2>
          <p>
            Halcyon organizes your workspace into five mental domains, each
            representing a different mode of thinking:
          </p>

          <table>
            <thead>
              <tr>
                <th>Domain</th>
                <th>Landscape</th>
                <th>Purpose</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Think/Meadow</td>
                <td>Open meadow</td>
                <td>Ideation and brainstorming</td>
              </tr>
              <tr>
                <td>Crumpit/Mountain</td>
                <td>Mountain peak</td>
                <td>Strategic planning</td>
              </tr>
              <tr>
                <td>Write/Lake</td>
                <td>Calm lake</td>
                <td>Deep focus writing</td>
              </tr>
              <tr>
                <td>Log/Canyon</td>
                <td>Layered canyon</td>
                <td>Journal and reflection</td>
              </tr>
              <tr>
                <td>People/Village</td>
                <td>Village paths</td>
                <td>People and relationships</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section id="entities">
          <h2>Entities</h2>
          <p>
            Halcyon supports multiple entity types: notes, tasks, people, logs, events,
            files, and links. All entities share a common spatial layout system.
          </p>

          <blockquote>
            "In Halcyon, everything has a place. Ideas flow naturally across the canvas,
            organized by meaning rather than hierarchy."
          </blockquote>
        </section>

        <section id="canvas">
          <h2>Spatial Canvas</h2>
          <p>
            The infinite canvas uses a two-layer rendering system:
          </p>

          <ul>
            <li>
              <strong>Terrain Layer (Canvas 2D):</strong> Dot grid background with
              domain-specific terrain textures
            </li>
            <li>
              <strong>Entity Layer (Konva):</strong> GPU-accelerated rendering of cards
              and ink strokes
            </li>
          </ul>

          <p>
            This architecture enables smooth panning, zooming, and drawing performance
            even with hundreds of entities.
          </p>
        </section>

        <section id="toolbar">
          <h2>Floating Toolbar</h2>
          <p>
            The unified floating toolbar adapts to different editor modes (text,
            markdown, canvas, page builder, inspector).
          </p>

          <p>Example usage:</p>
          <pre><code>{`<FloatingToolbar
  mode="text"
  activeTool={activeTool}
  onAction={(action) => {
    // Handle tool action
  }}
/>`}</code></pre>
        </section>

        <section id="ink">
          <h2>Ink Drawing</h2>
          <p>
            Halcyon supports freehand drawing with multiple brush types:
            pen, marker, pencil, and eraser.
          </p>

          <p>
            Ink strokes are serialized as JSON arrays of points and can be embedded
            in note cards or drawn freely on the canvas.
          </p>
        </section>

        <section id="primitives">
          <h2>Primitives Palette</h2>
          <p>
            The primitives palette features a cave painting aesthetic with
            ancient symbolic tools:
          </p>

          <p>
            <code>hand</code>, <code>circle</code>, <code>line</code>, <code>spiral</code>,
            <code>dot</code>, <code>wave</code>, <code>sun</code>, <code>hand-print</code>
          </p>
        </section>

        <section id="api">
          <h2>API Reference</h2>
          <p>
            For complete API documentation, see the TypeScript definitions in
            <code>src/types/</code>.
          </p>
        </section>
      </article>
    </HalcyonDocsLayout>
  )
}
