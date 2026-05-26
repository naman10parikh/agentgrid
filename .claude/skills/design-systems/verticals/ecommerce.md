# Ecommerce Design DNA

Design system profile for retail: online stores, marketplaces, product catalogs, checkout flows.

## Audience Profile

- **Demographics:** 16-70, mass market, mobile-dominant shopping
- **Technical literacy:** Low to medium. Must be usable by anyone with a smartphone.
- **Context of use:** Impulse (social media referral), comparison (multiple tabs), purchase (high intent)
- **Key emotion:** Confidence. Users must trust the product, the price, and the platform enough to buy.

## Typography

**Recommended pairing:** #9 — Crimson Pro + Public Sans + Inconsolata

| Level    | Font        | Weight | Size | Line Height |
| -------- | ----------- | ------ | ---- | ----------- |
| Display  | Crimson Pro | 600    | 34px | 1.2         |
| H1       | Public Sans | 600    | 24px | 1.3         |
| H2       | Public Sans | 500    | 20px | 1.4         |
| Body     | Public Sans | 400    | 15px | 1.6         |
| Small    | Public Sans | 400    | 13px | 1.5         |
| Code/SKU | Inconsolata | 400    | 13px | 1.5         |

**Rationale:** Crimson Pro adds editorial sophistication to product pages — products feel curated, not dumped on a page. Public Sans (the US government's typeface) is the most neutral sans-serif available, letting products be the hero. Inconsolata for order numbers, SKUs, and tracking codes.

**Alternative for luxury ecommerce:** #1 — Instrument Serif + Poppins for warmth. For streetwear/young audience: #10 — Cabinet Grotesk + Satoshi.

## Color Palette

### Dark Mode

| Token            | Hex                      | Usage                                    |
| ---------------- | ------------------------ | ---------------------------------------- |
| `primary`        | Brand-dependent          | Main brand color (varies per store)      |
| `accent`         | `#10B981`                | Success, add to cart, in stock           |
| `danger`         | `#EF4444`                | Out of stock, sale price (red)           |
| `sale`           | `#EF4444`                | Sale/discount pricing (red draws eye)    |
| `bg-primary`     | `#141312`                | Page background                          |
| `bg-surface`     | `rgba(255,255,255,0.03)` | Product cards                            |
| `text-primary`   | `#e5e5e5`                | Primary text                             |
| `text-secondary` | `#a3a3a3`                | Secondary text                           |
| `text-price`     | `#e5e5e5`                | Price (same weight as primary, semibold) |

### Light Mode (Often the default for ecommerce)

| Token            | Hex             | Usage                                           |
| ---------------- | --------------- | ----------------------------------------------- |
| `primary`        | Brand-dependent | Main brand color                                |
| `bg-primary`     | `#FFFFFF`       | Page background (pure white for product photos) |
| `bg-surface`     | `#F9FAFB`       | Product cards, sidebar                          |
| `text-primary`   | `#111827`       | Primary text (gray-900)                         |
| `text-secondary` | `#6B7280`       | Secondary text (gray-500)                       |
| `text-price`     | `#111827`       | Price (bold)                                    |
| `text-sale`      | `#DC2626`       | Sale price (red-600)                            |
| `text-original`  | `#9CA3AF`       | Original price (strikethrough, gray-400)        |

### Ecommerce-Specific Colors

| Meaning       | Color               | Note                         |
| ------------- | ------------------- | ---------------------------- |
| In Stock      | `#10B981` (emerald) | Available, ready to ship     |
| Low Stock     | `#F59E0B` (amber)   | "Only 3 left" urgency        |
| Out of Stock  | `#EF4444` (red)     | Unavailable                  |
| Sale/Discount | `#EF4444` (red)     | Sale badge, discounted price |
| New           | `#3B82F6` (blue)    | New arrival badge            |
| Bestseller    | `#F59E0B` (amber)   | Popular item badge           |

## Layout Paradigm

- **Primary pattern:** Grid-based product catalog with filter sidebar
- **Grid:** Product grids (2-4 columns desktop, 2 columns mobile)
- **Product cards:** Image-dominant. Aspect ratio 3:4 or 1:1 for product photos.
- **Checkout:** Single-column, minimal distractions. Progress indicator at top.
- **Search:** Prominent. Always visible. Autocomplete with product thumbnails.

### Product Listing Page

```
+------------------------------------------+
|  [Logo]  [Search___________]  [Cart (3)] |
+--------+---------------------------------+
| Filters| +--------+ +--------+ +--------+|
|        | |[Image] | |[Image] | |[Image] ||
| Size   | |Product | |Product | |Product ||
| Color  | |$29.99  | |$49.99  | |$19.99  ||
| Price  | |****    | |*****   | |***     ||
| Brand  | +--------+ +--------+ +--------+|
|        | +--------+ +--------+ +--------+|
| [Clear]| |[Image] | |[Image] | |[Image] ||
+--------+---------------------------------+
|  < 1  2  3 ... 8 >   48 products        |
+------------------------------------------+
```

### Product Detail Page

```
+------------------------------------------+
| [Breadcrumb: Home > Category > Product]  |
+-------------------+----------------------+
| [Main Image]      | Product Name         |
|                   | ****1/2 (247 reviews)|
| [thumb][thumb]    | $49.99               |
| [thumb][thumb]    |                      |
|                   | Color: [O] [O] [O]   |
|                   | Size:  [S] [M] [L]   |
|                   |                      |
|                   | [Add to Cart]        |
|                   | [Buy Now]            |
+-------------------+----------------------+
| Description | Reviews | Shipping          |
+------------------------------------------+
```

## Trust Signals

- **Reviews with photos:** User-submitted photos are more trusted than star ratings alone
- **Stock indicators:** "In stock," "Only 3 left," "Ships in 2-3 days"
- **Return policy:** Prominently displayed on product page, not buried in footer
- **Security badges:** SSL, payment provider logos (Visa, Mastercard, PayPal), "Secure Checkout"
- **Shipping estimates:** "Free shipping over $50" or "Arrives by Friday"
- **Size guides:** Interactive size guide reduces returns and builds confidence
- **Social proof:** "1,247 people bought this in the last 30 days"

## Motion Level

**Moderate.** Ecommerce benefits from engaging but fast interactions.

- Product image zoom: Smooth zoom on hover (desktop) or pinch (mobile). Essential for detail.
- Add to cart: Brief animation — product image flies to cart icon (200ms). Confirms action.
- Cart count: Number bounces when incremented (scale 1 -> 1.2 -> 1, 200ms spring).
- Image carousel: Smooth swipe with momentum. Dots indicator below.
- Filter apply: Products fade/shuffle when filters change (150ms). Never jump.
- Skeleton loading: Shimmer loaders while product cards load. Show card shape immediately.
- Sale badge: Subtle pulse animation on sale badges (draws eye without being obnoxious).

## Reference Sites

| Site                                                   | Learn                                                                  |
| ------------------------------------------------------ | ---------------------------------------------------------------------- |
| [Apple Store](https://apple.com/shop)                  | Premium ecommerce. Study product page layout and imagery.              |
| [Shopify Dawn](https://themes.shopify.com/themes/dawn) | Default Shopify theme. Clean, fast, modern ecommerce baseline.         |
| [SSENSE](https://ssense.com)                           | Luxury fashion ecommerce. Minimal, image-first, editorial.             |
| [Allbirds](https://allbirds.com)                       | DTC brand. Study product customization and sustainability messaging.   |
| [Amazon](https://amazon.com)                           | High-density ecommerce. Study search, filters, and reviews.            |
| [Nike](https://nike.com)                               | Brand-forward ecommerce. Study hero sections and product storytelling. |
| [Glossier](https://glossier.com)                       | Beauty DTC. Study their product photography and social proof.          |

## Anti-Patterns for Ecommerce

- **Small product images:** Images sell products. Full-width, high-resolution, zoomable. Multiple angles.
- **Hidden prices:** Never make users click to see the price. Price must be visible on the card.
- **Complex checkout:** Every additional step loses ~10% of customers. Minimize fields. Guest checkout.
- **No search autocomplete:** Users who search have 3x higher conversion. Make search excellent.
- **Pop-up overload:** Newsletter pop-ups within 3 seconds of landing = instant bounce. Delay 30+ seconds.
- **Missing product info:** Size chart, materials, dimensions, shipping time. Missing info = abandoned cart.
- **No mobile optimization:** 70%+ of ecommerce traffic is mobile. Test on real devices.
- **Slow page loads:** Every 100ms delay reduces conversion by 1%. Optimize images, defer scripts.
