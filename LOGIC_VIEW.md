# Logic View — React Flow Integration

> The structured counterpart to the spatial canvas.
> Where the bench shows *position*, the logic view shows *connection*.

---

## What Is the Logic View?

React Flow powers a **graph-based reasoning layer** for Halcyon:

- **Spatial Canvas** = freeform thinking, ink, stickers, position-as-meaning
- **Logic View** = structured graphs, dependencies, relationships, flow

Think of it as viewing the same data through two lenses:
1. *Where* things are (spatial)
2. *How* things connect (logic)

---

## The 6 Core Graphs

### 1. Task Graph ("Crumpit Logic View")

The dependency engine.

```
┌─────────┐      blocks      ┌─────────┐
│  Task A │ ───────────────▶ │  Task B │
└─────────┘                  └─────────┘
     │                            │
     │ depends_on                 │ depends_on
     ▼                            ▼
┌─────────┐                  ┌─────────┐
│  Task C │                  │  Task D │
└─────────┘                  └─────────┘
```

**Node fields:**
- Title, energy colour, signal border
- Status checkbox, due date
- Zone colour as faint halo

**Edges from:**
- `Relation.kind === 'blocks'`
- `Relation.kind === 'depends_on'`

**Use case:** Critical path analysis, bottleneck detection, "Gantt without Gantt"

---

### 2. People Graph ("Orbit Logic View")

Social network as structure.

```
        ┌──────────┐
        │   You    │
        └────┬─────┘
             │
    ┌────────┼────────┐
    │        │        │
    ▼        ▼        ▼
┌──────┐ ┌──────┐ ┌──────┐
│ Alex │ │ Sam  │ │ Jordan│
└──────┘ └──────┘ └──────┘
```

**Node fields:**
- Name, role, closeness level
- Avatar, Dunbar ring metadata

**Edges:**
- "works with", "reports to"
- "collaborates on [project]"
- Log/event link strength (optional)

**Use case:** CRM replacement, relationship reasoning

---

### 3. Project Pipeline View

Phase-based flow for projects and events.

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│ Scoping │───▶│  Build  │───▶│  Test   │───▶│  Ship   │
└─────────┘    └─────────┘    └─────────┘    └─────────┘
     3              8              2              0
   tasks         tasks          tasks         tasks
```

**Nodes:** Project phases with task/note counts as badges

**Use case:** Show pipelines, software delivery, event planning

---

### 4. Tag Universe

Emergent clustering from shared tags.

```
     #design ─────── Note A
        │
        ├─────────── Task B
        │
     #frontend ───── Task B
        │
        └─────────── Note C
```

**Use case:** Research, cross-project links, product planning

---

### 5. Zone → Thread Map

Life architecture at a glance.

```
┌──────────────────────────────────────────┐
│                  WORK                     │
│  ┌────────┐  ┌────────┐  ┌────────┐      │
│  │Project │  │ Admin  │  │  1:1s  │      │
│  │   A    │  │        │  │        │      │
│  └────────┘  └────────┘  └────────┘      │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│                 HEALTH                    │
│  ┌────────┐  ┌────────┐                  │
│  │Exercise│  │  Diet  │                  │
│  └────────┘  └────────┘                  │
└──────────────────────────────────────────┘
```

**Use case:** Replaces folders of folders, shows life structure

---

### 6. Knowledge Graph (Everything → Everything)

The full map. All entities, all relations.

**Filters:**
- Show nodes within N hops of focus
- Colour by entity type
- Shade by terrain/domain

**Use case:** Semantic navigation, AI reasoning surface

---

## Node Types

| Type | Shape | Colour | Icon |
|------|-------|--------|------|
| TaskNode | Rounded rect | Energy-based | ☐/☑ |
| PersonNode | Circle | Role-based | 👤 |
| NoteNode | Soft rect | Cream/paper | 📝 |
| ZoneNode | Large rounded | Zone colour | — |
| ThreadNode | Pill | Muted | — |
| TagNode | Small pill | Grey | # |
| EventNode | Diamond | Calendar | 📅 |
| FileNode | Small rect | Type-based | 📎 |

---

## Edge Types (Relations)

| Kind | Arrow | Style |
|------|-------|-------|
| `blocks` | ───▶ | Solid, red tint |
| `depends_on` | ───▶ | Solid |
| `refers_to` | - - ▶ | Dashed |
| `authored_by` | ───○ | Solid, no arrow |
| `belongs_to` | ───▶ | Dotted |
| `linked_to` | ═══▶ | Double line |

---

## Interactions

| Action | Result |
|--------|--------|
| Click node | Open in spatial canvas |
| Drag node | Reposition (saved) |
| Cmd+drag edge | Create new relation |
| Double-click | Expand neighbors |
| Shift+1 | Task Graph view |
| Shift+2 | People Graph view |
| Shift+3 | Pipeline view |

**Built-in from React Flow:**
- Mini-map
- Auto-layout toggle (Dagre/ELK)
- Zoom controls
- Focus view

---

## Visual Mapping

| Entity Property | Visual Treatment |
|-----------------|------------------|
| `energy` | Node border glow |
| `signal` | Border width |
| `thread` | Halo ring |
| `zone` | Background band |
| `terrain` | Overlay tint |

---

## Data Flow

```
HalcyonEntity[] ──┬──▶ Spatial Canvas (position)
                  │
                  └──▶ Logic View (graph)
                            │
                            ├── nodes = entities by type
                            ├── edges = relations + inferred deps
                            └── layout = Dagre auto or manual
```

Both views share the same store. Changes sync instantly.

---

## Why Logic View Matters

1. **Dependency clarity** — See what blocks what
2. **Relationship reasoning** — Understand connections
3. **Pipeline visibility** — Track progress through phases
4. **Zero handwriting** — Pure keyboard/node workflow
5. **Cognitive fit** — Matches structured thinking styles

The spatial canvas is for *exploration*.
The logic view is for *understanding*.

Together, they form the complete Halcyon workspace.
