# DevTools Design DNA

Design system profile for developer tools: CLIs, IDEs, API platforms, documentation, monitoring dashboards.

## Audience Profile

- **Demographics:** 20-50, high technical literacy, efficiency-obsessed
- **Technical literacy:** High. Developers judge tools by speed, keyboard support, and information density.
- **Context of use:** Deep focus, multiple monitors, terminal alongside browser, long sessions
- **Key emotion:** Competence. The tool should make developers feel fast and powerful.

## Typography

**Recommended pairing:** #11 — Geist + Geist + Geist Mono

| Level   | Font       | Weight | Size | Line Height |
| ------- | ---------- | ------ | ---- | ----------- |
| Display | Geist      | 700    | 28px | 1.1         |
| H1      | Geist      | 600    | 22px | 1.25        |
| H2      | Geist      | 500    | 18px | 1.3         |
| Body    | Geist      | 400    | 14px | 1.6         |
| Small   | Geist      | 400    | 12px | 1.5         |
| Code    | Geist Mono | 400    | 13px | 1.5         |

**Rationale:** Geist is Vercel's typeface, instantly recognized in the developer community as "modern dev tool." Single-family system keeps the UI tight and consistent. Optimized for Next.js via `next/font/local`. Dense Major Second (1.125) scale fits information-rich views.

**Alternative:** #2 — Inter + Inter Display + Fira Code for broader compatibility (Google Fonts). #12 — Manrope + Fira Code for a slightly warmer enterprise developer tool.

## Color Palette

### Dark Mode (Primary — always the default)

| Token            | Hex       | Usage                                 |
| ---------------- | --------- | ------------------------------------- |
| `primary-500`    | `#FAFAFA` | Primary text, buttons (neutral white) |
| `accent`         | `#3B82F6` | Links, active states (blue)           |
| `accent-hover`   | `#2563EB` | Hover states                          |
| `secondary`      | `#10B981` | Success, online, passing (green)      |
| `bg-primary`     | `#0A0A0A` | Page background (true dark)           |
| `bg-surface`     | `#171717` | Cards, panels (neutral-900)           |
| `bg-elevated`    | `#262626` | Hover, active surfaces (neutral-800)  |
| `text-primary`   | `#FAFAFA` | Primary text (neutral-50)             |
| `text-secondary` | `#A3A3A3` | Secondary text (neutral-400)          |
| `text-muted`     | `#525252` | Disabled, hints (neutral-600)         |
| `border`         | `#262626` | Borders (neutral-800)                 |

### DevTools-Specific Colors

| Meaning       | Color               | Note                                  |
| ------------- | ------------------- | ------------------------------------- |
| Success/Pass  | `#10B981` (emerald) | Tests passing, deploy success, online |
| Error/Fail    | `#EF4444` (red)     | Tests failing, errors, offline        |
| Warning       | `#F59E0B` (amber)   | Deprecation, slow response, partial   |
| Info/Debug    | `#3B82F6` (blue)    | Logs, informational, active           |
| Verbose/Trace | `#8B5CF6` (purple)  | Trace-level logs, detailed debug      |

### Syntax Highlighting (Dark)

| Token    | Color                   | Usage                      |
| -------- | ----------------------- | -------------------------- |
| Keyword  | `#C084FC` (purple-400)  | if, const, return, import  |
| String   | `#34D399` (emerald-400) | "text", 'text', `template` |
| Number   | `#FBBF24` (amber-400)   | 42, 3.14, 0xFF             |
| Comment  | `#525252` (neutral-600) | // comments                |
| Function | `#60A5FA` (blue-400)    | functionName()             |
| Type     | `#2DD4BF` (teal-400)    | TypeName, Interface        |

## Layout Paradigm

- **Primary pattern:** Dense dashboard or documentation layout
- **Grid:** Dense 8px base spacing. Compact cards. Maximum information per viewport.
- **Navigation:** Sidebar (collapsible to icons) or top tabs. Never hamburger menu on desktop.
- **Information density:** Maximum. Developers want to see everything without scrolling.
- **Code blocks:** First-class citizens. Syntax highlighting, copy button, language badge.

```
+--------+------------------------------------------+
|        | Project: energy-platform   [Deploy] [Logs]|
| Side   +------------------------------------------+
| bar    | Metrics  |  Deployments  |  Logs  | API  |
| (icons +------------------------------------------+
| only   | +------------------+ +------------------+ |
| or     | | Requests/min     | | Error Rate       | |
| full)  | | 1,247 ▲ 12%      | | 0.3% ▼ 0.1%     | |
|        | +------------------+ +------------------+ |
|        | +--------------------------------------+   |
|        | | Recent Deployments                   |   |
|        | | [green] v2.4.1  3m ago  Production   |   |
|        | | [blue]  v2.4.2  1m ago  Preview      |   |
|        | +--------------------------------------+   |
+--------+------------------------------------------+
```

## Trust Signals

- **Status indicators:** Green dot = operational. Real-time, never stale.
- **Build times:** Show exact times ("Built in 3.2s"). Developers value precision.
- **Version pinning:** Clear semver display. Show changelogs inline.
- **Open source badges:** MIT license, GitHub stars, contributor count
- **Performance metrics:** Response times, uptime percentage, error rates
- **Documentation quality:** Comprehensive docs signal a mature tool

## Motion Level

**Minimal.** Developers want speed, not spectacle.

- Transitions: 100-150ms maximum. Instant is better than animated.
- Code blocks: No animation on syntax highlighting. Instant render.
- Status changes: Fade only (150ms). Green/red state changes must be instant.
- Loading: Progress bar or percentage. Never spinners without context.
- Terminal output: Instant append. Never animate individual characters.
- Exception: Smooth scroll in documentation. Developers expect smooth anchor navigation.

## Reference Sites

| Site                                   | Learn                                                             |
| -------------------------------------- | ----------------------------------------------------------------- |
| [Vercel](https://vercel.com)           | Gold standard for developer UX. Study their dashboard density.    |
| [Linear](https://linear.app)           | Best-in-class keyboard shortcuts, dense UI, dark mode.            |
| [GitHub](https://github.com)           | Repository navigation, code review UI, issue tracking.            |
| [Stripe Docs](https://stripe.com/docs) | Best developer documentation. Code samples, interactive examples. |
| [Railway](https://railway.app)         | Deploy dashboard. Clean, modern, developer-focused.               |
| [Supabase](https://supabase.com)       | Database dashboard. Study their table view and SQL editor.        |
| [Planetscale](https://planetscale.com) | Database UI. Dense data, clear hierarchy, excellent dark mode.    |
| [Tailwind UI](https://tailwindui.com)  | Component library showcase. Study their documentation layout.     |

## Anti-Patterns for DevTools

- **Slow UI:** Any interaction over 100ms feels sluggish to developers. Optimize relentlessly.
- **No keyboard support:** Every action must have a keyboard shortcut. Cmd+K is mandatory.
- **Mouse-dependent workflows:** Developers hate reaching for the mouse. Design keyboard-first.
- **Rounded, bubbly design:** Over-rounded corners (>8px) feel unprofessional. Use 4-6px.
- **Bright colors in dark mode:** Saturated colors cause eye strain in long coding sessions. Mute by 10-20%.
- **No copy button on code blocks:** Every code snippet needs a one-click copy button.
- **Markdown rendering issues:** Developers test docs by pasting code. Support all code fences, tables, and syntax.
- **Paywalling documentation:** Developers will leave. Docs must be free and searchable.
