# Consumer Design DNA

Design system profile for consumer applications: social, lifestyle, dating, food, travel, productivity.

## Audience Profile

- **Demographics:** 18-45, mass market, varied technical literacy
- **Technical literacy:** Low to medium. Must work for everyone from teens to parents.
- **Context of use:** Mobile-first, distracted, competitive attention (social media, notifications)
- **Key emotion:** Delight. The app should feel good to use — warm, personal, rewarding.

## Typography

**Recommended pairing:** #1 — Instrument Serif + Poppins + JetBrains Mono (Energy default)

| Level   | Font             | Weight | Size | Line Height |
| ------- | ---------------- | ------ | ---- | ----------- |
| Display | Instrument Serif | 400    | 32px | 1.2         |
| H1      | Poppins          | 600    | 24px | 1.3         |
| H2      | Poppins          | 600    | 20px | 1.4         |
| H3      | Poppins          | 500    | 18px | 1.4         |
| Body    | Poppins          | 400    | 14px | 1.6         |
| Small   | Poppins          | 400    | 12px | 1.5         |
| Code    | JetBrains Mono   | 400    | 13px | 1.5         |

**Rationale:** This is the Energy default because it perfectly balances editorial warmth (Instrument Serif) with modern readability (Poppins). The serif + sans pairing is the number-one anti-AI-generated-look change. Code font included for agent UIs that show tool calls.

**Alternative for premium consumer:** #6 — Fraunces + Outfit for luxury/lifestyle. For younger audiences: #10 — Cabinet Grotesk + Satoshi.

## Color Palette

### Dark Mode (Primary)

| Token            | Hex                      | Usage                              |
| ---------------- | ------------------------ | ---------------------------------- |
| `primary-500`    | `#8B5CF6`                | Energy purple (creativity, warmth) |
| `primary-600`    | `#7C3AED`                | Hover states                       |
| `primary-800`    | `#6B21A8`                | Dark accents                       |
| `secondary`      | Warm neutral `#292524`   | Stone-800 surfaces                 |
| `accent`         | `#FB7185`                | Coral rose — warmth, personality   |
| `bg-primary`     | `#141312`                | Page background (warm black)       |
| `bg-surface`     | `rgba(255,255,255,0.03)` | Cards                              |
| `text-primary`   | `#e5e5e5`                | Primary text                       |
| `text-secondary` | `#a3a3a3`                | Secondary text                     |

### Light Mode

| Token            | Hex       | Usage                      |
| ---------------- | --------- | -------------------------- |
| `primary-500`    | `#7C3AED` | Purple primary             |
| `bg-primary`     | `#FAFAF9` | Warm white (stone-50)      |
| `bg-surface`     | `#FFFFFF` | Cards                      |
| `text-primary`   | `#1C1917` | Primary text (stone-900)   |
| `text-secondary` | `#78716C` | Secondary text (stone-500) |

### Consumer-Specific Colors

| Meaning      | Color                               | Note                               |
| ------------ | ----------------------------------- | ---------------------------------- |
| Like/Love    | `#EF4444` (red) or `#FB7185` (rose) | Heart reactions, favorites         |
| New/Fresh    | `#8B5CF6` (purple)                  | New content, unread                |
| Success      | `#10B981` (emerald)                 | Booking confirmed, action complete |
| Social proof | `#F59E0B` (amber)                   | Stars, ratings, popularity         |

## Layout Paradigm

- **Primary pattern:** Feed-based or card-based with bottom navigation (mobile)
- **Grid:** Bento layout for desktop, single-column for mobile
- **Information density:** Low to medium. Breathing room. Let images speak.
- **Images:** First-class citizens. Full-width hero images, card thumbnails, avatars.
- **Mobile-first:** Thumb-zone optimized. Bottom sheet for actions. Swipe gestures.

### Desktop

```
+------------------+---------------------------+
| Chat/Conversation|  Agent Workspace          |
| Panel (40%)      |  (Map, Browser, Results)  |
|                  |                           |
| [Agent messages] |  [Rich cards: venues,     |
| [Tool timeline]  |   events, weather]        |
| [User input]     |                           |
+------------------+---------------------------+
```

### Mobile

```
+------------------------------------------+
|  [Back]  Title            [Settings]     |
+------------------------------------------+
|                                          |
|  [Agent conversation,                    |
|   tool timeline cards,                   |
|   rich result cards]                     |
|                                          |
|  [Workspace: bottom sheet, swipe up]     |
|                                          |
+------------------------------------------+
|  [Input field]                [Send]     |
+------------------------------------------+
```

## Trust Signals

- **Social proof:** "1.2M people used this today" — numbers build confidence
- **Real photos:** User-generated content, real venue photos, never stock
- **Ratings and reviews:** Stars with count ("4.6 from 2,847 reviews")
- **Personalization signals:** "Based on your preferences" — shows the app knows you
- **Privacy controls:** Clear opt-in, never dark patterns for data collection
- **Response time:** Fast agent response builds trust more than any badge

## Motion Level

**Moderate to playful.** Consumer apps should feel alive and responsive.

- Pull-to-refresh: Custom branded animation (not generic spinner).
- Card transitions: Spring physics on appear (scale + fade, 200ms).
- Like/save: Heart animation (scale + color change, 300ms).
- Page transitions: Shared element transitions where possible. Slide between views.
- Bottom sheet: Spring-based drag with velocity-aware snapping.
- Skeleton loaders: Custom shimmer with brand gradient undertone.
- Loading states: Contextual text ("Finding restaurants near you...").
- Success: Brief celebration (confetti or pulse) for major actions (booking confirmed).

## Reference Sites

| Site                                | Learn                                                   |
| ----------------------------------- | ------------------------------------------------------- |
| [Airbnb](https://airbnb.com)        | Image-first design, map integration, booking flow.      |
| [Spotify](https://spotify.com)      | Dark mode consumer app. Color extraction from images.   |
| [Pinterest](https://pinterest.com)  | Masonry grid layout. Image-centric, infinite scroll.    |
| [Arc Browser](https://arc.net)      | Modern consumer product. Playful but functional.        |
| [Notion](https://notion.so)         | Consumer productivity. Clean, flexible, personal.       |
| [Duolingo](https://duolingo.com)    | Gamification done right. Study their reward animations. |
| [BeReal](https://bereal.com)        | Authentic consumer design. Simple, honest UX.           |
| [Perplexity](https://perplexity.ai) | AI consumer product. Study their search results cards.  |

## Anti-Patterns for Consumer

- **Corporate/enterprise aesthetics:** Stiff layouts and blue-gray palettes kill consumer appeal.
- **No personality:** Every consumer app needs a distinct voice. Generic = forgettable.
- **Slow onboarding:** Users abandon after 3 screens of setup. Get to value in under 60 seconds.
- **Text-heavy screens:** Lead with images, icons, and cards. Text is supporting, not primary.
- **No haptic feedback (mobile):** Taps should feel tactile. Use haptic API on button presses.
- **Generic error messages:** "Something went wrong" is lazy. Be specific and helpful.
- **No empty states:** First-time users see blank screens. Design onboarding for every empty state.
- **Ignoring dark mode:** Consumer users increasingly prefer dark mode. Support both.
