# Creative Design DNA

Design system profile for creator tools: design software, music production, video editing, writing tools, art platforms.

## Audience Profile

- **Demographics:** 18-45, high visual literacy, design-sensitive
- **Technical literacy:** Medium to high. Creators judge tools by their aesthetics first.
- **Context of use:** Flow state (long sessions), multi-monitor, often with reference material open
- **Key emotion:** Inspiration. The tool should make creators feel capable and excited.

## Typography

**Recommended pairing:** #5 — Space Grotesk + Space Grotesk + Space Mono

| Level   | Font          | Weight | Size | Line Height |
| ------- | ------------- | ------ | ---- | ----------- |
| Display | Space Grotesk | 700    | 32px | 1.1         |
| H1      | Space Grotesk | 600    | 24px | 1.25        |
| H2      | Space Grotesk | 500    | 20px | 1.3         |
| Body    | Space Grotesk | 400    | 14px | 1.6         |
| Small   | Space Grotesk | 400    | 12px | 1.5         |
| Code    | Space Mono    | 400    | 13px | 1.5         |

**Rationale:** Space Grotesk is geometric, technical, and modern — it says "precision tool for creative people." Single-family system ensures consistency across a complex tool UI. The mono variant shares proportions for code/data alignment.

**Alternative for bold branding:** #15 — Clash Display + General Sans for high-impact marketing pages. #5 for the product UI, #15 for the landing page.

## Color Palette

### Dark Mode (Primary)

| Token            | Hex                      | Usage                                  |
| ---------------- | ------------------------ | -------------------------------------- |
| `primary-500`    | `#A855F7`                | Primary actions, purple (creativity)   |
| `primary-600`    | `#9333EA`                | Hover states                           |
| `primary-900`    | `#581C87`                | Dark accents                           |
| `secondary-500`  | `#EC4899`                | Pink secondary (expression, energy)    |
| `accent`         | `#F59E0B`                | Amber accent (highlight, select, star) |
| `bg-primary`     | `#141312`                | Page background                        |
| `bg-surface`     | `rgba(255,255,255,0.03)` | Cards, panels                          |
| `bg-canvas`      | `#0A0A0A`                | Canvas/workspace area (darker)         |
| `text-primary`   | `#e5e5e5`                | Primary text                           |
| `text-secondary` | `#a3a3a3`                | Secondary text                         |

### Light Mode

| Token          | Hex       | Usage           |
| -------------- | --------- | --------------- |
| `primary-500`  | `#9333EA` | Primary actions |
| `bg-primary`   | `#FAFAFA` | Page background |
| `bg-surface`   | `#FFFFFF` | Cards           |
| `bg-canvas`    | `#F5F5F5` | Canvas area     |
| `text-primary` | `#18181B` | Primary text    |

### Creator-Specific Colors

| Meaning         | Color              | Note                                            |
| --------------- | ------------------ | ----------------------------------------------- |
| Selected/Active | `#A855F7` (purple) | Selection highlights, active tools              |
| Canvas guide    | `#3B82F6` (blue)   | Grid lines, alignment guides, rulers            |
| Export/Render   | `#10B981` (green)  | Ready to export, render complete                |
| Layer colors    | Varied             | Each layer gets a unique hue for identification |

## Layout Paradigm

- **Primary pattern:** Canvas-centered with collapsible tool panels
- **Grid:** Tool UI is dense (8px spacing in panels), canvas area is clean and spacious
- **Panels:** Left (tools/layers), center (canvas), right (properties/inspector)
- **Resizable:** Every panel boundary should be draggable
- **Full-screen mode:** Canvas expands to full screen, panels hide to edges

```
+------+------------------------+----------+
| Tools|                        | Inspector|
| Panel|     Canvas / Workspace | Panel    |
| 240px|     (fluid center)     | 280px    |
|      |                        |          |
|[Icon]|                        | [Props]  |
|[Icon]|                        | [Styles] |
|[Icon]|                        | [Export] |
+------+------------------------+----------+
|          Timeline / Layers Bar           |
+------------------------------------------+
```

## Trust Signals

- **Autosave indicator:** "All changes saved" always visible. Creators fear losing work.
- **Version history:** "Undo to any point" with visual timeline
- **Export quality preview:** Show output quality before exporting
- **Community proof:** "Used by 50K creators" with recognizable creator logos
- **Performance metrics:** Frame rate, file size, render time — visible for power users
- **Plugin ecosystem:** Extensibility signals "professional tool"

## Motion Level

**Moderate to playful.** Creators expect polish and delight.

- Tool selection: Subtle spring animation on click (scale 0.95 -> 1.0).
- Panel transitions: Smooth width animation (200ms ease-out) when toggling panels.
- Canvas interactions: Smooth zoom/pan with momentum. Spring physics for snapping.
- Loading: Creative loading states (animated logos, progress bars with gradient fills).
- Export: Progress animation with percentage. Celebrate completion briefly.
- Hover states: Generous hover effects on tools and assets (scale, glow, info tooltip).
- Drag and drop: Shadow follows cursor, drop zone highlights with accent color.

## Reference Sites

| Site                                 | Learn                                                                       |
| ------------------------------------ | --------------------------------------------------------------------------- |
| [Figma](https://figma.com)           | Canvas-based tool UI. Panel layout, real-time collaboration indicators.     |
| [Framer](https://framer.com)         | Creative tool with stunning marketing. Study both product and landing page. |
| [Rive](https://rive.app)             | Animation tool. Excellent timeline UI and canvas interactions.              |
| [Spline](https://spline.design)      | 3D design tool. Study their dark mode and canvas-centered layout.           |
| [Descript](https://descript.com)     | Video/podcast editor. Timeline UI, waveform visualization.                  |
| [Canva](https://canva.com)           | Consumer creative tool. Study their template browser and drag-drop UX.      |
| [Runway](https://runwayml.com)       | AI creative tool. Study how they present AI generation controls.            |
| [Midjourney](https://midjourney.com) | AI art. Study their gallery layout and prompt interface.                    |

## Anti-Patterns for Creative

- **Boring, corporate aesthetics:** Creators will not use a tool that looks like enterprise software.
- **Cluttered panels:** Too many controls visible at once. Use progressive disclosure, tabs.
- **No keyboard shortcuts:** Power users live on keyboards. Every action needs a shortcut.
- **Slow interactions:** Any lag in canvas operations is a deal-breaker. 60fps minimum.
- **Generic file management:** Creators need visual thumbnails, not file lists.
- **No dark mode:** Creative tools must default to dark mode. Bright UIs cause eye strain in long sessions.
- **Fixed-size panels:** Creators have different workflows. Every panel must be resizable or collapsible.
- **No undo history:** Single undo is not enough. Visual version history is expected.
