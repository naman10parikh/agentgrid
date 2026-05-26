# Education Design DNA

Design system profile for EdTech: learning management systems, course platforms, tutoring, assessment tools.

## Audience Profile

- **Demographics:** 5-65, extremely varied. Students, teachers, administrators, parents.
- **Technical literacy:** Low to medium. Must work for children and elderly learners alike.
- **Context of use:** Mixed — classroom (projector), home (laptop/tablet), commute (phone), often low bandwidth
- **Key emotion:** Encouragement. Learning is hard. The interface should make users feel capable and motivated.

## Typography

**Recommended pairing:** #7 — Newsreader + Work Sans + Cascadia Code

| Level   | Font          | Weight | Size | Line Height |
| ------- | ------------- | ------ | ---- | ----------- |
| Display | Newsreader    | 600    | 34px | 1.2         |
| H1      | Work Sans     | 600    | 24px | 1.3         |
| H2      | Work Sans     | 500    | 20px | 1.4         |
| Body    | Work Sans     | 400    | 15px | 1.7         |
| Small   | Work Sans     | 400    | 13px | 1.5         |
| Code    | Cascadia Code | 400    | 14px | 1.5         |

**Rationale:** Newsreader was designed by Google specifically for reading on screens. Work Sans is neutral and highly readable. The Perfect Fourth (1.333) scale creates generous hierarchy for educational content. 1.7 line height on body text optimizes for extended reading sessions (research shows >1.5 line height improves comprehension).

**Alternative for younger audiences (K-12):** Consider a more playful pairing like #13 — Bricolage Grotesque. For coding bootcamps: #11 — Geist family.

## Color Palette

### Dark Mode

| Token            | Hex                      | Usage                                 |
| ---------------- | ------------------------ | ------------------------------------- |
| `primary-500`    | `#6366F1`                | Indigo primary (scholarly, focused)   |
| `primary-600`    | `#4F46E5`                | Hover states                          |
| `secondary`      | `#F59E0B`                | Amber — progress, achievements, stars |
| `accent`         | `#14B8A6`                | Teal — success, completion            |
| `bg-primary`     | `#141312`                | Page background                       |
| `bg-surface`     | `rgba(255,255,255,0.03)` | Cards                                 |
| `text-primary`   | `#e5e5e5`                | Primary text                          |
| `text-secondary` | `#a3a3a3`                | Secondary text                        |

### Light Mode (Often the default for education)

| Token            | Hex       | Usage                        |
| ---------------- | --------- | ---------------------------- |
| `primary-500`    | `#4F46E5` | Indigo primary               |
| `bg-primary`     | `#FAFAFA` | Page background              |
| `bg-surface`     | `#FFFFFF` | Cards                        |
| `bg-sidebar`     | `#F5F3FF` | Sidebar (subtle violet tint) |
| `text-primary`   | `#1E1B4B` | Primary text (indigo-950)    |
| `text-secondary` | `#6B7280` | Secondary text (gray-500)    |

### Education-Specific Colors

| Meaning          | Color               | Note                                        |
| ---------------- | ------------------- | ------------------------------------------- |
| Correct/Mastered | `#10B981` (emerald) | Right answer, skill mastered                |
| Incorrect/Review | `#EF4444` (red)     | Wrong answer (use sparingly, never shaming) |
| In Progress      | `#F59E0B` (amber)   | Partially complete, learning                |
| Not Started      | `#94A3B8` (slate)   | Future lessons, locked content              |
| Achievement      | `#F59E0B` (amber)   | Stars, badges, streaks                      |
| Focus/Active     | `#6366F1` (indigo)  | Current lesson, active quiz                 |

## Layout Paradigm

- **Primary pattern:** Content-focused with sidebar navigation for course structure
- **Grid:** Medium density. 32px section spacing. Generous padding in content areas.
- **Reading width:** Maximum 720px for text content (optimal reading line length: 60-75 characters)
- **Code blocks:** Full-width with line numbers, copy button, and run button for interactive courses
- **Progress:** Always visible. Top progress bar or sidebar completion indicators.

````
+--------+------------------------------------------+
| Course | Lesson: Introduction to Variables         |
| Outline| [Progress: 40% ████████░░░░░░░]          |
|        +------------------------------------------+
| [done] |                                          |
| Ch 1   |  Variables are containers that store      |
| [done] |  values in your program.                 |
| Ch 2   |                                          |
| [curr] |  ```javascript                           |
| Ch 3   |  let greeting = "Hello, World!";          |
| [lock] |  console.log(greeting);                  |
| Ch 4   |  ```                    [Run] [Copy]     |
|        |                                          |
|        |  [Quiz: What type is greeting?]           |
|        |  ( ) Number  (o) String  ( ) Boolean     |
+--------+------------------------------------------+
````

## Trust Signals

- **Instructor credentials:** Photo, title, institution affiliation
- **Completion certificates:** "Earn a certificate" with preview of the certificate design
- **Peer counts:** "12,847 students enrolled" — social proof matters for courses
- **Reviews:** Student testimonials with star ratings and outcome mentions
- **Institution partnerships:** "Partnered with MIT, Stanford" logos
- **Progress persistence:** "Your progress is saved" assurance during onboarding

## Motion Level

**Moderate.** Education benefits from feedback and encouragement animations.

- Correct answer: Green checkmark with spring animation + subtle confetti (small, brief).
- Incorrect answer: Gentle shake (150ms) + encouraging "Try again" message. Never punishing.
- Progress bar: Smooth fill animation when advancing. Satisfying and motivating.
- Lesson transitions: Slide left/right between lessons (200ms). Spatial mental model.
- Badge unlock: Scale + glow animation (300ms). Achievement should feel rewarding.
- Code execution: Loading bar while running. Output appears with slide-down.
- Streak counter: Number increment with scale bounce. Streaks drive retention.

## Reference Sites

| Site                                       | Learn                                                          |
| ------------------------------------------ | -------------------------------------------------------------- |
| [Duolingo](https://duolingo.com)           | Gamification gold standard. Streaks, XP, celebrations.         |
| [Coursera](https://coursera.org)           | Course structure, progress tracking, certificate design.       |
| [Khan Academy](https://khanacademy.org)    | Free education. Study their video + practice problem layout.   |
| [Brilliant](https://brilliant.org)         | Interactive learning. Study their problem-solving UI.          |
| [Codecademy](https://codecademy.com)       | Code learning. Split-pane editor + instruction layout.         |
| [Notion Academy](https://notion.so/guides) | Documentation-style learning. Clean, modern, well-structured.  |
| [Excalidraw](https://excalidraw.com)       | Whiteboard for teaching. Study their collaborative drawing UX. |

## Anti-Patterns for Education

- **Punishing error states:** Red screens, loud error sounds, "WRONG" in big text. Learning means making mistakes.
- **Overwhelming content:** Wall of text without breaks, images, or interactive elements. Chunk content.
- **No progress indicators:** Learners need to know where they are and how far they have to go.
- **Tiny text:** Educational content must be readable. 15px minimum for body, 14px for code.
- **Auto-advancing content:** Let learners control pace. Never auto-advance lessons or quizzes.
- **No offline support:** Students may have unreliable internet. Cache content for offline access.
- **Gamification overload:** Badges and points help retention, but too many feel patronizing for adults.
- **Inaccessible media:** Videos without captions, images without alt text, PDFs without text layer.
