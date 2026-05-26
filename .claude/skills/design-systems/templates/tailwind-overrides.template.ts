/**
 * Tailwind Configuration Overrides — Design System Extension
 *
 * Generated from theme-tokens.json by the design-systems skill.
 * Import this into your tailwind.config.ts to apply agent-specific theming.
 *
 * Usage:
 *   import { designSystemOverrides } from './design-system/tailwind-overrides'
 *   import { merge } from 'lodash'
 *   export default merge(baseConfig, designSystemOverrides)
 *
 * Or with Tailwind's built-in preset system:
 *   export default {
 *     presets: [designSystemOverrides],
 *     // ... project-specific overrides
 *   }
 */

import type { Config } from "tailwindcss";

/**
 * Replace these placeholder values with your theme-tokens.json values.
 * The brand-generation pipeline (pipelines/brand-generation.md) produces
 * the tokens file. The Theme Engineer role (app-factory skill) reads
 * BRAND.md and generates this configuration.
 *
 * Token source: brand/theme-tokens.json
 */
export const designSystemOverrides: Partial<Config> = {
  theme: {
    extend: {
      /**
       * Color System
       * Brand: 10-shade scale from theme-tokens.json
       * Surface: Dark-mode-first layered backgrounds
       * Text: Warm, accessible text colors (never pure white)
       */
      colors: {
        brand: {
          50: "var(--brand-50, #fdf2f8)",
          100: "var(--brand-100, #fce7f3)",
          200: "var(--brand-200, #fbcfe8)",
          300: "var(--brand-300, #f9a8d4)",
          400: "var(--brand-400, #f472b6)",
          500: "var(--brand-500, #ec4899)",
          600: "var(--brand-600, #db2777)",
          700: "var(--brand-700, #be185d)",
          800: "var(--brand-800, #9d174d)",
          900: "var(--brand-900, #831843)",
          950: "var(--brand-950, #500724)",
        },
        accent: "var(--accent, #8B5CF6)",
        surface: {
          primary: "var(--bg-primary, #141312)",
          secondary: "var(--bg-secondary, #0a0a0a)",
          card: "var(--bg-surface, rgba(255, 255, 255, 0.03))",
          "card-hover": "var(--bg-surface-hover, rgba(255, 255, 255, 0.06))",
        },
        border: {
          DEFAULT: "var(--border, rgba(255, 255, 255, 0.06))",
          active: "var(--border-active, rgba(139, 92, 246, 0.3))",
        },
        text: {
          primary: "var(--text-primary, #e5e5e5)",
          secondary: "var(--text-secondary, #a3a3a3)",
          muted: "var(--text-muted, rgba(255, 255, 255, 0.3))",
        },
        semantic: {
          success: "var(--success, #10B981)",
          warning: "var(--warning, #F59E0B)",
          error: "var(--error, #EF4444)",
          info: "var(--info, #3B82F6)",
        },
      },

      /**
       * Typography
       * Display: Serif font for headings (anti-AI-look)
       * Body: Sans-serif for UI and paragraphs
       * Code: Monospace for terminal and code blocks
       *
       * The serif + sans-serif pairing is the single highest-impact
       * change to avoid the "AI-generated" look.
       */
      fontFamily: {
        display: [
          'var(--font-display, "Instrument Serif")',
          "Georgia",
          "Cambria",
          '"Times New Roman"',
          "serif",
        ],
        body: [
          'var(--font-body, "Poppins")',
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "sans-serif",
        ],
        mono: [
          'var(--font-mono, "JetBrains Mono")',
          '"Fira Code"',
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },

      /**
       * Font Size Scale
       * Follows the design system type scale from AGENT-UX-DESIGN-SYSTEM.md.
       * Each size includes recommended line-height.
       */
      fontSize: {
        display: ["2rem", { lineHeight: "1.2", fontWeight: "400" }],
        h1: ["1.5rem", { lineHeight: "1.3", fontWeight: "600" }],
        h2: ["1.25rem", { lineHeight: "1.4", fontWeight: "600" }],
        h3: ["1.125rem", { lineHeight: "1.4", fontWeight: "500" }],
        body: ["0.875rem", { lineHeight: "1.6", fontWeight: "400" }],
        small: ["0.75rem", { lineHeight: "1.5", fontWeight: "400" }],
        code: ["0.8125rem", { lineHeight: "1.5", fontWeight: "400" }],
      },

      /**
       * Spacing System
       * Based on 8px grid. Section gaps > component gaps > element gaps.
       * This hierarchy creates visual rhythm and grouping.
       */
      spacing: {
        section: "80px",
        component: "32px",
        element: "16px",
        "card-padding": "24px",
        // Extended scale for fine control
        "18": "4.5rem", // 72px
        "22": "5.5rem", // 88px
        "26": "6.5rem", // 104px
        "30": "7.5rem", // 120px
      },

      /**
       * Border Radius
       * Consistent rounding scale. Use lg-xl for cards, sm-md for inputs.
       */
      borderRadius: {
        sm: "6px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        "2xl": "20px",
      },

      /**
       * Box Shadows
       * Dark-mode-optimized shadows using higher opacity.
       * Light-mode shadows would use rgba(0,0,0,0.1) instead of 0.3.
       */
      boxShadow: {
        sm: "0 1px 2px rgba(0, 0, 0, 0.3)",
        md: "0 4px 6px rgba(0, 0, 0, 0.3)",
        lg: "0 10px 15px rgba(0, 0, 0, 0.3)",
        xl: "0 20px 25px rgba(0, 0, 0, 0.3)",
        "2xl": "0 25px 50px rgba(0, 0, 0, 0.4)",
        brand: "0 4px 14px rgba(var(--brand-rgb, 236, 72, 153), 0.25)",
      },

      /**
       * Animations
       * Shimmer: loading state for cards and content areas
       * Breathe: idle agent avatar subtle pulse
       */
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        breathe: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.02)" },
        },
      },
      animation: {
        shimmer: "shimmer 2s ease-in-out infinite",
        breathe: "breathe 3s ease-in-out infinite",
      },

      /**
       * Backdrop Blur
       * For glassmorphism effects on overlays and sticky elements.
       */
      backdropBlur: {
        xs: "2px",
      },

      /**
       * Max Width
       * Content containers for readability (65-75ch target).
       */
      maxWidth: {
        prose: "65ch",
        "prose-wide": "75ch",
      },

      /**
       * Z-Index Scale
       * Explicit z-index values to prevent stacking context chaos.
       */
      zIndex: {
        "sticky-cta": "40",
        overlay: "50",
        modal: "60",
        toast: "70",
        tooltip: "80",
      },
    },
  },

  /**
   * Plugins
   * Add Tailwind plugins that the design system depends on.
   */
  plugins: [
    // require('@tailwindcss/typography'),  // Uncomment for prose styling
    // require('tailwindcss-animate'),       // Uncomment for shadcn/ui animations
  ],
};

/**
 * CSS Custom Properties Injection
 *
 * Add this to your globals.css to set the CSS variables that the
 * Tailwind config above references. The Theme Engineer generates
 * these values from theme-tokens.json.
 *
 * ```css
 * :root {
 *   --brand-50: #fdf2f8;
 *   --brand-100: #fce7f3;
 *   --brand-200: #fbcfe8;
 *   --brand-300: #f9a8d4;
 *   --brand-400: #f472b6;
 *   --brand-500: #ec4899;
 *   --brand-600: #db2777;
 *   --brand-700: #be185d;
 *   --brand-800: #9d174d;
 *   --brand-900: #831843;
 *   --brand-950: #500724;
 *   --brand-rgb: 236, 72, 153;
 *   --accent: #8B5CF6;
 *   --bg-primary: #141312;
 *   --bg-secondary: #0a0a0a;
 *   --bg-surface: rgba(255, 255, 255, 0.03);
 *   --bg-surface-hover: rgba(255, 255, 255, 0.06);
 *   --border: rgba(255, 255, 255, 0.06);
 *   --border-active: rgba(139, 92, 246, 0.3);
 *   --text-primary: #e5e5e5;
 *   --text-secondary: #a3a3a3;
 *   --text-muted: rgba(255, 255, 255, 0.3);
 *   --success: #10B981;
 *   --warning: #F59E0B;
 *   --error: #EF4444;
 *   --info: #3B82F6;
 *   --font-display: 'Instrument Serif';
 *   --font-body: 'Poppins';
 *   --font-mono: 'JetBrains Mono';
 * }
 * ```
 */
