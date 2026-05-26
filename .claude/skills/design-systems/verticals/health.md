# Health Design DNA

Design system profile for healthcare, wellness, fitness, therapy, and medical technology.

## Audience Profile

- **Demographics:** 18-70, extremely varied technical literacy, often stressed or vulnerable
- **Technical literacy:** Low to medium. Must work for patients, caregivers, and clinicians.
- **Context of use:** Anxious (health concerns), distracted, possibly impaired vision, often mobile
- **Key emotion:** Calm. The interface must lower anxiety, not raise it.

## Typography

**Recommended pairing:** #4 — DM Serif Display + DM Sans + IBM Plex Mono

| Level     | Font             | Weight | Size | Line Height |
| --------- | ---------------- | ------ | ---- | ----------- |
| Display   | DM Serif Display | 400    | 34px | 1.2         |
| H1        | DM Sans          | 600    | 22px | 1.3         |
| H2        | DM Sans          | 500    | 18px | 1.4         |
| Body      | DM Sans          | 400    | 15px | 1.65        |
| Small     | DM Sans          | 400    | 13px | 1.5         |
| Code/Data | IBM Plex Mono    | 400    | 13px | 1.5         |

**Rationale:** DM Serif Display has soft terminals that feel gentle and calming. DM Sans is highly readable with generous x-height. IBM Plex Mono is clinical and clean for medical data (vitals, lab results). The 1.65 body line height aids readability for patients who may be tired or medicated.

**Alternative:** For wellness/fitness (less clinical), use #6 — Fraunces + Outfit for a warmer, more approachable feel.

## Color Palette

### Dark Mode

| Token            | Hex                      | Usage                                        |
| ---------------- | ------------------------ | -------------------------------------------- |
| `primary-500`    | `#14B8A6`                | Primary actions, teal (calming yet distinct) |
| `primary-600`    | `#0D9488`                | Hover states                                 |
| `primary-900`    | `#134E4A`                | Dark accents                                 |
| `secondary-500`  | `#84CC16`                | Sage green — wellness, nature                |
| `accent`         | `#F5F5F4`                | Warm white for highlights                    |
| `bg-primary`     | `#141312`                | Page background                              |
| `bg-surface`     | `rgba(255,255,255,0.03)` | Cards                                        |
| `text-primary`   | `#e5e5e5`                | Primary text                                 |
| `text-secondary` | `#a3a3a3`                | Secondary text                               |

### Light Mode

| Token            | Hex       | Usage                                  |
| ---------------- | --------- | -------------------------------------- |
| `primary-500`    | `#0D9488` | Primary actions                        |
| `bg-primary`     | `#FAFAF9` | Page background (warm white, stone-50) |
| `bg-surface`     | `#FFFFFF` | Cards                                  |
| `text-primary`   | `#1C1917` | Primary text (stone-900)               |
| `text-secondary` | `#78716C` | Secondary text (stone-500)             |

### Health-Specific Semantic Colors

| Meaning         | Color             | Note                  |
| --------------- | ----------------- | --------------------- |
| Normal/Healthy  | `#14B8A6` (teal)  | Within range          |
| Warning/Monitor | `#F59E0B` (amber) | Needs attention       |
| Critical/Alert  | `#EF4444` (red)   | Requires action       |
| Information     | `#3B82F6` (blue)  | Neutral informational |

## Layout Paradigm

- **Primary pattern:** Card-based with generous whitespace. Low density.
- **Grid:** Relaxed spacing. 24-32px card padding. 48px between sections.
- **Information density:** Low to medium. Never overwhelm. Progressive disclosure for details.
- **Accessibility:** WCAG AAA target. Large touch targets (48px minimum). High contrast.
- **Mobile-first:** Most health interactions happen on phones. Design mobile first.

```
+------------------------------------------+
|  Good morning, Sarah         [Avatar]    |
+------------------------------------------+
|                                          |
|  +------------------+  +--------------+  |
|  | Today's Summary  |  | Upcoming     |  |
|  | HR: 72 bpm       |  | Dr. Kim      |  |
|  | Steps: 8,432     |  | Tomorrow 2pm |  |
|  | Sleep: 7h 23m    |  | [Details]    |  |
|  +------------------+  +--------------+  |
|                                          |
|  +------------------------------------+  |
|  | Medications                         |  |
|  | [pill] Lisinopril - Take at 8am    |  |
|  | [pill] Metformin - Take with food  |  |
|  +------------------------------------+  |
+------------------------------------------+
```

## Trust Signals

- **HIPAA compliance badge:** Visible in footer and settings
- **Data encryption indicator:** "End-to-end encrypted" near sensitive data
- **Provider credentials:** "Board Certified" badges, institutional logos
- **Gentle language:** "Your results are ready" not "ALERT: New results"
- **Privacy controls:** Clear data sharing preferences, one-click opt-out
- **Human escalation:** "Talk to a nurse" button always accessible

## Motion Level

**Restrained to moderate.** Calm, not static. Breathe, don't bounce.

- Transitions: Smooth fades (200-300ms). No abrupt changes.
- Data updates: Gentle fade-in for new values. Never animate vital signs aggressively.
- Loading: Soft pulse or shimmer. Never spinning icons (feel anxious).
- Success: Gentle checkmark with fade-in. No confetti, no celebration.
- Breathing exercises: One exception where animation is functional (guided breathing circles).
- Scrolling: Smooth scroll behavior. No snap scrolling (feels jarring).

## Reference Sites

| Site                                     | Learn                                                                |
| ---------------------------------------- | -------------------------------------------------------------------- |
| [Headspace](https://headspace.com)       | Wellness app gold standard. Calming palette, generous whitespace.    |
| [One Medical](https://onemedical.com)    | Modern healthcare booking. Clean, trustworthy, simple.               |
| [Calm](https://calm.com)                 | Meditation app. Study their color transitions and ambient animation. |
| [Apple Health](https://apple.com/health) | Health data visualization. Clean charts, clear hierarchy.            |
| [Hims](https://hims.com)                 | Modern health DTC. Approachable, destigmatized medical design.       |
| [Ro](https://ro.co)                      | Telehealth. Excellent form design for medical intake.                |
| [MyFitnessPal](https://myfitnesspal.com) | Fitness tracking. Dense data in an accessible way.                   |

## Anti-Patterns for Health

- **Aggressive red for any data:** Use red ONLY for truly critical alerts. Amber for borderline.
- **Dense dashboards:** Health data should breathe. Dense layouts cause anxiety.
- **Clinical/cold aesthetics:** Warm tones and soft shapes reduce medical anxiety.
- **Small text:** Many patients have impaired vision. 15px minimum body, never below 13px.
- **Complex navigation:** Patients may be disoriented. Maximum 5 top-level nav items.
- **Jargon in UI:** "Systolic BP" needs to be accompanied by "Top number" or similar plain language.
- **Auto-playing video:** Never auto-play anything in a health context. Users may be in public.
- **Dark patterns:** No guilt-tripping ("Are you sure you want to skip your medication?"). State facts neutrally.
