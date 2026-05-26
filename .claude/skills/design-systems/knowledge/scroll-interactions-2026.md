# Scroll Interactions & Dynamic Graphics — 2026 Production Guide

## The Animation Stack (Use Lowest Layer That Works)

| Layer | Tool                               | Bundle | When to Use                                                                            |
| ----- | ---------------------------------- | ------ | -------------------------------------------------------------------------------------- |
| 1     | CSS `animation-timeline: scroll()` | 0      | Simple reveals, progress bars, parallax. 60fps on compositor. Chrome 115+, Safari 18+. |
| 2     | Lenis                              | 3KB    | Smooth scroll foundation. Preserves sticky/snap. Install in EVERY project.             |
| 3     | GSAP ScrollTrigger                 | 78KB   | Pin sections, scrub timelines, coordinate complex sequences. Industry standard.        |
| 4     | Motion (Framer Motion)             | 85KB   | React-first, accessibility built-in, `useScroll`, layout animations.                   |
| 5     | Three.js + R3F                     | 150KB+ | 3D scenes, WebGL galleries, shader effects. Use sparingly.                             |

## What Top Sites Actually Do

| Site        | Technique                             | Effect                                    |
| ----------- | ------------------------------------- | ----------------------------------------- |
| **Stripe**  | Flowing gradient mesh + micro-reveals | Color transitions, progressive disclosure |
| **Linear**  | Subtle product reveals + speed demos  | Live previews, purposeful motion          |
| **Vercel**  | Grid animations + staggered reveals   | Coordinated card entrances                |
| **Apple**   | Pin + scrub on product pages          | Hero pins, content scrolls through it     |
| **Raycast** | Keyboard shortcut reveals on scroll   | Interactive CLI demonstrations            |

## 10 Scroll Patterns to Implement

### 1. Scroll-Triggered Reveals (Foundation)

```tsx
"use client";
import { useEffect, useRef } from "react";

export function ScrollReveal({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) entry.target.classList.add("animate-in");
      },
      { threshold: 0.2 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className="opacity-0 translate-y-6 transition-all duration-700 ease-out animate-in:opacity-100 animate-in:translate-y-0"
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
```

### 2. Pinned Scroll Section (Stripe Pattern)

Content changes while section stays fixed. User scrolls through content within a pinned container.

```tsx
gsap.to(".feature-panels", {
  xPercent: -100 * (panels.length - 1),
  ease: "none",
  scrollTrigger: {
    trigger: ".features-container",
    pin: true,
    scrub: 1,
    end: () => "+=" + document.querySelector(".feature-panels")!.scrollWidth,
  },
});
```

### 3. Parallax Depth Layers

Background, midground, foreground move at different speeds.

```css
@supports (animation-timeline: scroll()) {
  .parallax-bg {
    animation: parallax-slow linear;
    animation-timeline: scroll();
  }
  .parallax-fg {
    animation: parallax-fast linear;
    animation-timeline: scroll();
  }
  @keyframes parallax-slow {
    to {
      transform: translateY(-20%);
    }
  }
  @keyframes parallax-fast {
    to {
      transform: translateY(-50%);
    }
  }
}
```

### 4. Number Counter on Scroll

```tsx
"use client";
import { useEffect, useRef, useState } from "react";

export function Counter({
  target,
  duration = 2000,
}: {
  target: number;
  duration?: number;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const start = performance.now();
          const animate = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            setCount(Math.floor(progress * target));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
          observer.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);
  return (
    <span ref={ref} className="tabular-nums">
      {count.toLocaleString()}
    </span>
  );
}
```

### 5. Staggered Group Reveal

```tsx
gsap.from(".card", {
  y: 40,
  opacity: 0,
  duration: 0.6,
  stagger: { each: 0.08 },
  scrollTrigger: { trigger: ".card-grid", start: "top 80%" },
});
```

### 6. SVG Mask Transition (Codrops March 2026)

Grid of SVG rectangles reveal content on scroll via opacity stagger. Use `shape-rendering="crispEdges"` to prevent anti-aliasing gaps. Scrub 2.0-2.5 for trailing motion.

### 7. Text Character Split Animation

Split headline into characters, stagger reveal on scroll.

```tsx
gsap.from(".char", {
  y: "100%",
  opacity: 0,
  duration: 0.5,
  stagger: { each: 0.03 },
  scrollTrigger: { trigger: ".headline", start: "top 80%" },
});
```

### 8. Sticky Grid Scroll (Codrops March 2026)

3-column grid with alternating top/bottom reveals. Post-reveal: 2.05x zoom scale, side columns shift horizontally, center shifts vertically. Creates depth and negative space.

### 9. 3D Card Tilt on Hover

```tsx
const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
  const rect = e.currentTarget.getBoundingClientRect();
  const x = (e.clientX - rect.left) / rect.width - 0.5;
  const y = (e.clientY - rect.top) / rect.height - 0.5;
  e.currentTarget.style.transform = `perspective(800px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg)`;
};
```

### 10. Magnetic Button (Awwwards Standard)

Button slightly pulls toward cursor on hover proximity.

```tsx
const handleMouseMove = (e: React.MouseEvent) => {
  const rect = e.currentTarget.getBoundingClientRect();
  const x = e.clientX - rect.left - rect.width / 2;
  const y = e.clientY - rect.top - rect.height / 2;
  e.currentTarget.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
};
```

## Visual Assets That Elevate

### Gradient Mesh Backgrounds

```css
.gradient-mesh {
  background:
    radial-gradient(at 20% 30%, oklch(60% 0.15 200 / 0.4) 0%, transparent 50%),
    radial-gradient(at 80% 70%, oklch(55% 0.12 280 / 0.3) 0%, transparent 50%),
    radial-gradient(at 50% 50%, oklch(50% 0.1 140 / 0.2) 0%, transparent 60%);
}
```

### Grain Texture Overlay

```css
.grain::after {
  content: "";
  position: fixed;
  inset: 0;
  background-image: url("data:image/svg+xml,..."); /* tiny noise SVG */
  opacity: 0.035;
  mix-blend-mode: overlay;
  pointer-events: none;
  z-index: 9999;
}
```

### Organic Blob Shapes (CSS)

```css
.blob {
  border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
  animation: morph 8s ease-in-out infinite;
}
@keyframes morph {
  0%,
  100% {
    border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
  }
  50% {
    border-radius: 70% 30% 30% 70% / 70% 70% 30% 30%;
  }
}
```

### Glassmorphism Cards

```css
.glass-card {
  background: oklch(100% 0 0 / 0.08);
  backdrop-filter: blur(12px);
  border: 1px solid oklch(100% 0 0 / 0.12);
  border-radius: 12px;
}
```

## Awwwards 2026 Checklist (What Impresses)

- [ ] Smooth page transitions
- [ ] Custom cursor (magnetic, context-aware)
- [ ] Text reveals (staggered character/line on scroll)
- [ ] Parallax layers (bg/mg/fg at different speeds)
- [ ] Magnetic interactions (buttons pull toward cursor)
- [ ] Micro-animations on press (ripple, glow, scale)
- [ ] Animated data viz (live charts, counters)
- [ ] Organic blob backgrounds or gradient mesh
- [ ] Grain texture overlay (subtle, 3-4% opacity)
- [ ] Scroll-linked progress indicators

## What's Tired (Don't Do)

- Spinning generic loaders
- AI purple/pink gradients
- Symmetric card grids (all same size)
- Modal dialogs for inline actions
- Placeholder skeletons without purpose
- Uniform bounce/scale on all elements

## Performance Rules

- Only animate `transform` + `opacity` (browser-optimized)
- Never animate `width`, `height`, `top`, `left` (triggers layout)
- Use `will-change: transform` sparingly (1-2 elements)
- Test on iPhone 12 (standard mobile baseline)
- Glassmorphism: max 3-5 elements on mobile
- GSAP: use `quickTo()` for scroll-linked animations (avoids tween re-creation)

## Lenis + GSAP Setup for Next.js App Router

```tsx
"use client";
import { useEffect } from "react";
import Lenis from "@studio-freight/lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function SmoothScrollProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.1, duration: 1.5, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    return () => {
      lenis.destroy();
      gsap.ticker.remove(lenis.raf);
    };
  }, []);
  return <>{children}</>;
}
```

## prefers-reduced-motion (MANDATORY)

```tsx
export function useReducedMotion() {
  const [prefersReduced, setPrefersReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return prefersReduced;
}
```

All animations must check this. Reduce to opacity-only transitions when enabled.
