# Enterprise Design DNA

Design system profile for B2B SaaS: CRMs, admin panels, internal tools, project management, analytics.

## Audience Profile

- **Demographics:** 25-55, business professionals, procurement-influenced decisions
- **Technical literacy:** Medium. Power users are advanced, but many users are non-technical end users.
- **Context of use:** Desktop-primary, 8+ hour days, multi-tab, often with Slack/email alongside
- **Key emotion:** Efficiency. The tool should make users feel productive and in control.

## Typography

**Recommended pairing:** #12 — Manrope + Manrope + Fira Code

| Level   | Font      | Weight | Size | Line Height |
| ------- | --------- | ------ | ---- | ----------- |
| Display | Manrope   | 700    | 30px | 1.15        |
| H1      | Manrope   | 600    | 22px | 1.3         |
| H2      | Manrope   | 500    | 18px | 1.4         |
| Body    | Manrope   | 400    | 14px | 1.6         |
| Small   | Manrope   | 400    | 12px | 1.5         |
| Code    | Fira Code | 400    | 13px | 1.5         |

**Rationale:** Manrope is a geometric sans-serif with enough warmth to feel approachable without being casual. Variable font for optimal loading across enterprise networks. Fira Code for any technical content (API keys, JSON, config).

**Alternative for premium enterprise:** #8 — PP Neue Montreal (or General Sans as free fallback) for Linear/Stripe-tier design quality.

## Color Palette

### Dark Mode

| Token            | Hex                      | Usage                                        |
| ---------------- | ------------------------ | -------------------------------------------- |
| `primary-500`    | `#3B82F6`                | Primary actions, links (blue — professional) |
| `primary-600`    | `#2563EB`                | Hover states                                 |
| `secondary`      | `#6366F1`                | Indigo for secondary actions                 |
| `bg-primary`     | `#141312`                | Page background                              |
| `bg-surface`     | `rgba(255,255,255,0.03)` | Cards, panels                                |
| `bg-sidebar`     | `#0F0F0E`                | Sidebar (slightly darker)                    |
| `text-primary`   | `#e5e5e5`                | Primary text                                 |
| `text-secondary` | `#a3a3a3`                | Secondary text                               |
| `border`         | `rgba(255,255,255,0.06)` | Borders                                      |

### Light Mode (Often the default for enterprise)

| Token            | Hex       | Usage                      |
| ---------------- | --------- | -------------------------- |
| `primary-500`    | `#2563EB` | Primary actions            |
| `bg-primary`     | `#F8FAFC` | Page background (slate-50) |
| `bg-surface`     | `#FFFFFF` | Cards                      |
| `bg-sidebar`     | `#F1F5F9` | Sidebar (slate-100)        |
| `text-primary`   | `#0F172A` | Primary text (slate-900)   |
| `text-secondary` | `#64748B` | Secondary text (slate-500) |
| `border`         | `#E2E8F0` | Borders (slate-200)        |

### Enterprise-Specific Colors

| Meaning           | Color               | Note                              |
| ----------------- | ------------------- | --------------------------------- |
| Active/Online     | `#10B981` (emerald) | User online, feature active       |
| Warning/Attention | `#F59E0B` (amber)   | Approaching limits, expiring      |
| Overdue/Critical  | `#EF4444` (red)     | Past due, error, requires action  |
| Completed         | `#3B82F6` (blue)    | Task done, matching primary brand |
| Draft/Inactive    | `#94A3B8` (slate)   | Drafts, disabled, archived        |

## Layout Paradigm

- **Primary pattern:** Sidebar navigation + top breadcrumb + main content
- **Grid:** Medium-high density. 8px base with 16px standard gaps.
- **Navigation:** Persistent sidebar (240px, collapsible to 64px icons). Top tabs for sub-sections.
- **Data tables:** Primary content type. Sortable, filterable, paginated, bulk-actionable.
- **Search:** Cmd+K command palette is mandatory. Global search across all entities.

```
+--------+------------------------------------------+
| [Logo] | Breadcrumb: Projects > Acme Corp > Tasks  |
+--------+------------------------------------------+
| Inbox  | +--Search/Filter bar-----------------+    |
| Tasks  | |                                     |   |
| Proj.  | +-------------------------------------+   |
| Team   |                                           |
| Report | +--Data Table--------------------------+   |
| Admin  | | Checkbox | Name    | Status | Owner  |  |
| ---    | | [x]      | Task A  | Active | Sarah  |  |
| Help   | | [ ]      | Task B  | Draft  | Mike   |  |
| [Av]   | | [x]      | Task C  | Done   | Sarah  |  |
+--------+ +--------------------------------------+  |
         | < 1  2  3 ... 12 >  Showing 1-25 of 291  |
         +-------------------------------------------+
```

## Trust Signals

- **SSO/SAML support:** Enterprise buyers require it. Badge it in pricing page.
- **Uptime SLA:** "99.99% uptime" with link to status page
- **SOC 2 / ISO 27001:** Compliance badges in footer and security page
- **Role-based access:** Clear permissions UI. Admins need to audit who can do what.
- **Audit logs:** Every action by every user, exportable, filterable
- **Data residency:** Region selection for data storage (EU, US, APAC)
- **Customer logos:** "Trusted by" section with recognizable enterprise brands

## Motion Level

**Minimal.** Enterprise users spend 8+ hours in the tool. Animation must not fatigue.

- Transitions: 100-150ms fade. No slides except sidebar collapse.
- Sidebar collapse: Width 240px -> 64px, 200ms ease-out. Content fades.
- Dropdown/popover: Fade + scale (150ms). Never slide.
- Toast notifications: Slide in from top-right, auto-dismiss in 5s.
- Data table: No animation on sort/filter. Instant re-render.
- Modal: Fade + slight scale (200ms). Backdrop fade.
- Exception: Onboarding walkthrough can use more motion (first-run only).

## Reference Sites

| Site                                           | Learn                                                                 |
| ---------------------------------------------- | --------------------------------------------------------------------- |
| [Linear](https://linear.app)                   | Modern enterprise UI gold standard. Keyboard-first, dense, beautiful. |
| [Notion](https://notion.so)                    | Flexible enterprise tool. Block editor, sidebar, command palette.     |
| [Salesforce Lightning](https://salesforce.com) | Traditional enterprise. Study their data table patterns.              |
| [Attio](https://attio.com)                     | Modern CRM. Study their table/board views and relationship mapping.   |
| [Retool](https://retool.com)                   | Internal tools. Component library for admin panels.                   |
| [Airtable](https://airtable.com)               | Grid/table view. Study their view switching (grid/kanban/calendar).   |
| [Clerk](https://clerk.com)                     | Auth dashboard. Clean enterprise settings and user management.        |

## Anti-Patterns for Enterprise

- **Consumer aesthetics:** Rounded cards, playful colors, and casual tone lose credibility.
- **No keyboard shortcuts:** Enterprise users work all day. Cmd+K command palette is mandatory.
- **Mobile-first layouts:** Enterprise is desktop-first. Design for 1280px+ first, then adapt down.
- **No bulk actions:** Enterprise users manage hundreds of items. Select all, bulk delete, bulk assign.
- **Pageless infinite scroll:** Enterprise data needs pagination. Users need to know "page 3 of 12."
- **No export:** CSV/Excel export is a basic expectation. PDF for reports.
- **Single-tenant appearance:** Enterprise customers expect their logo, their colors, their domain.
- **No audit trail:** "Who did what, when?" must be answerable for every entity.
- **Slow search:** Enterprise data is large. Search must be fast (<500ms) and support filters.
