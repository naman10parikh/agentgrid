# Fintech Design DNA

Design system profile for financial services: banking, trading, wealth management, payments, insurance.

## Audience Profile

- **Demographics:** 25-55, mixed technical literacy, high-stakes context
- **Technical literacy:** Low to medium. Must work for both retail customers and professional traders.
- **Context of use:** High-anxiety (money), security-conscious, often mobile, frequently interrupted
- **Key emotion:** Trust. Every pixel must communicate "your money is safe here."

## Typography

**Recommended pairing:** #3 — Playfair Display + Source Sans Pro + Source Code Pro

| Level     | Font             | Weight | Size | Line Height |
| --------- | ---------------- | ------ | ---- | ----------- |
| Display   | Playfair Display | 700    | 36px | 1.15        |
| H1        | Source Sans Pro  | 600    | 24px | 1.3         |
| H2        | Source Sans Pro  | 600    | 20px | 1.4         |
| Body      | Source Sans Pro  | 400    | 15px | 1.6         |
| Small     | Source Sans Pro  | 400    | 13px | 1.5         |
| Code/Data | Source Code Pro  | 400    | 13px | 1.5         |

**Rationale:** Playfair Display conveys heritage and authority — qualities people want from institutions holding their money. Source Sans Pro is Adobe's most readable sans-serif. Source Code Pro for numerical data (monospaced digits align in tables).

**Alternative:** For a more modern fintech (Stripe, Ramp), use #8 — PP Neue Montreal or General Sans for Swiss minimalism.

## Color Palette

### Dark Mode (Primary)

| Token            | Hex                      | Usage                                     |
| ---------------- | ------------------------ | ----------------------------------------- |
| `primary-500`    | `#3B82F6`                | Primary actions, links (Blue — trust)     |
| `primary-600`    | `#2563EB`                | Hover states                              |
| `primary-900`    | `#1E3A5F`                | Dark accents                              |
| `secondary-500`  | `#64748B`                | Slate gray — neutral UI chrome            |
| `accent`         | `#10B981`                | Positive values, growth, profit (Emerald) |
| `danger`         | `#EF4444`                | Negative values, losses, errors           |
| `bg-primary`     | `#141312`                | Page background                           |
| `bg-surface`     | `rgba(255,255,255,0.03)` | Cards                                     |
| `text-primary`   | `#e5e5e5`                | Primary text                              |
| `text-secondary` | `#94A3B8`                | Secondary text (slate-400)                |

### Light Mode

| Token            | Hex       | Usage                      |
| ---------------- | --------- | -------------------------- |
| `primary-500`    | `#2563EB` | Primary actions            |
| `bg-primary`     | `#FAFAFA` | Page background            |
| `bg-surface`     | `#FFFFFF` | Cards                      |
| `text-primary`   | `#0F172A` | Primary text (slate-900)   |
| `text-secondary` | `#64748B` | Secondary text (slate-500) |

### Financial Data Colors

| Meaning           | Color               | Note                                  |
| ----------------- | ------------------- | ------------------------------------- |
| Positive/Profit   | `#10B981` (emerald) | Green = growth universally in finance |
| Negative/Loss     | `#EF4444` (red)     | Red = danger/loss universally         |
| Neutral/Unchanged | `#94A3B8` (slate)   | Gray = no movement                    |
| Warning/Pending   | `#F59E0B` (amber)   | Pending transactions                  |

## Layout Paradigm

- **Primary pattern:** Dashboard with sidebar navigation
- **Grid:** Dense, data-rich. 8px base spacing. Cards with 16px internal padding.
- **Information density:** High. Users need to see portfolio, transactions, metrics at a glance.
- **Data tables:** Monospaced numbers, right-aligned values, alternating row backgrounds.
- **Charts:** Clean, minimal decoration. Axes labeled clearly. Tooltips on hover.

```
+--------+------------------------------------------+
|        | Portfolio Value    | +2.4% today          |
| Nav    | $142,847.29        |                      |
|        +--------------------+-----+-----------+----+
|        | Holdings           | Watchlist       | Tx |
|        | [Table: Stock,     | [Compact card   |    |
|        |  Price, Change,    |  list with      |    |
|        |  Value, %Portfolio]|  sparklines]    |    |
+--------+--------------------+-----------------+----+
```

## Trust Signals

- **Security badges:** SSL, FDIC insured, SOC 2, PCI DSS compliance badges in footer
- **Data accuracy:** Real-time timestamps on all financial data ("Updated 2s ago")
- **Confirmation gates:** Double-confirm for all transactions (send money, trade, transfer)
- **Audit trail:** Every action logged with timestamp, visible to user
- **Professional typography:** Serif headings signal established institution
- **Minimal animation:** Motion feels unstable in financial contexts. Use sparingly.

## Motion Level

**Restrained.** Financial interfaces must feel stable and solid.

- Page transitions: 150ms fade only. No slides, no bounces.
- Data updates: Fade in new values (200ms). Never animate number changes with counting effects.
- Charts: Static on load. Animate only on explicit interaction (hover tooltip, timeframe change).
- Loading states: Skeleton loaders, never spinning icons (spinners feel uncertain).
- Exception: Subtle celebration animation when a trade succeeds (once, small, dismissible).

## Reference Sites

| Site                                                 | Learn                                                                         |
| ---------------------------------------------------- | ----------------------------------------------------------------------------- |
| [Stripe Dashboard](https://dashboard.stripe.com)     | Gold standard for financial data UI. Clean, dense, readable.                  |
| [Mercury](https://mercury.com)                       | Modern banking UI. Minimal, trustworthy, excellent typography.                |
| [Ramp](https://ramp.com)                             | Corporate card dashboard. Dense data, clear hierarchy.                        |
| [Wise](https://wise.com)                             | International transfers. Excellent mobile-first financial UX.                 |
| [Robinhood](https://robinhood.com)                   | Consumer trading. Simplified data presentation (controversial but effective). |
| [Bloomberg Terminal](https://bloomberg.com/terminal) | Maximum density reference. Study their information architecture.              |
| [Linear](https://linear.app)                         | Not fintech but best reference for dense, dark mode SaaS dashboard.           |

## Anti-Patterns for Fintech

- **Playful animations**: bouncing elements, confetti, etc. Money is serious.
- **Bright, saturated colors**: neon green for profit looks cheap. Use muted emerald.
- **Rounded everything**: over-rounded corners (border-radius > 12px) feels toy-like. Use 4-8px.
- **Gradient backgrounds**: gradients feel unstable. Use solid colors.
- **Emoji in financial data**: a green arrow icon (Lucide) is fine, a money emoji is not.
- **Missing decimal precision**: always show 2 decimal places for currency. 4 for crypto.
- **Centered data tables**: financial data must be left-aligned (labels) and right-aligned (numbers).
