import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";
import tailwindcssAspectRatio from "@tailwindcss/aspect-ratio";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      // ===========================================
      // HAIR STUDIO DESIGN SYSTEM - Mobile First
      // ===========================================
      
      // ---- Typography: a disciplined TWO-typeface system -------------------
      // `display` = Fraunces, the editorial serif. It is the app's VOICE and is
      //   reserved for what the product "says": style names, result captions,
      //   screen headlines, paywall headline. Never below 19px.
      // `sans`/`ui` = the PLATFORM face (SF Pro on iOS, Roboto on Android) via
      //   system-ui. All chrome — labels, buttons, nav, metadata. This is what
      //   premium native apps ship, and it is why they read as native.
      fontFamily: {
        display: ['"Fraunces Variable"', 'Fraunces', 'Georgia', 'Times New Roman', 'serif'],
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        ui: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      
      // Typography Scale (mobile-optimized)
      // Editorial scale. Key names are unchanged so no component breaks; the
      // VALUES move to the premium scale: bigger/lighter display (Fraunces reads
      // elegant at 600, not 800), and small text lifted for legibility on device
      // (captions 13/12 instead of 12/11 — the single cheapest "quality" win).
      fontSize: {
        // Display — Fraunces only
        'hero': ['2.125rem', { lineHeight: '2.5rem', letterSpacing: '-0.02em', fontWeight: '600' }],   // 34/40
        'display': ['1.75rem', { lineHeight: '2.125rem', letterSpacing: '-0.02em', fontWeight: '600' }], // 28/34
        'display-sm': ['1.5rem', { lineHeight: '1.875rem', letterSpacing: '-0.015em', fontWeight: '600' }], // 24/30
        // Title — section headers
        'title-lg': ['1.375rem', { lineHeight: '1.75rem', letterSpacing: '-0.01em', fontWeight: '600' }], // 22/28
        'title': ['1.1875rem', { lineHeight: '1.5rem', letterSpacing: '-0.01em', fontWeight: '600' }],    // 19/24
        'title-sm': ['1.0625rem', { lineHeight: '1.375rem', fontWeight: '600' }],                          // 17/22
        // Body
        'body-lg': ['1.0625rem', { lineHeight: '1.6rem', fontWeight: '400' }],   // 17/26
        'body': ['0.9375rem', { lineHeight: '1.45rem', fontWeight: '400' }],      // 15/23
        'body-sm': ['0.875rem', { lineHeight: '1.25rem', fontWeight: '400' }],    // 14/20
        // Caption / micro
        'caption': ['0.8125rem', { lineHeight: '1.125rem', fontWeight: '400' }],  // 13/18
        'caption-sm': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.01em', fontWeight: '500' }], // 12/16
        'micro': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.02em', fontWeight: '600' }],       // 12/16 uppercase eyebrows
        // Label — buttons, badges
        'label': ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0.005em', fontWeight: '600' }],
        'label-sm': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.02em', fontWeight: '600' }],
      },
      
      // Spacing Scale (8px base, mobile-friendly)
      spacing: {
        '4.5': '1.125rem',   // 18px
        '13': '3.25rem',     // 52px
        '15': '3.75rem',     // 60px
        '18': '4.5rem',      // 72px - touch target
        '22': '5.5rem',      // 88px
        'safe-top': 'var(--safe-area-top)',
        'safe-bottom': 'var(--safe-area-bottom)',
        'header': 'var(--header-height)',
        'bottom-bar': 'var(--bottom-bar-height)',
      },
      
      // Border Radius (modern, larger for mobile)
      borderRadius: {
        'lg': 'var(--radius)',
        'md': 'calc(var(--radius) - 2px)',
        'sm': 'calc(var(--radius) - 4px)',
        '2xl': '1rem',       // 16px
        '3xl': '1.5rem',     // 24px - cards, modals
        '4xl': '2rem',       // 32px - bottom sheets
        'button': '0.75rem', // 12px - buttons
        'card': '1.25rem',   // 20px - cards
        'modal': '1.75rem',  // 28px - modals
      },
      
      // Shadows (subtle, premium feel)
      boxShadow: {
        'soft': '0 2px 8px -2px rgba(0, 0, 0, 0.08)',
        'soft-md': '0 4px 16px -4px rgba(0, 0, 0, 0.1)',
        'soft-lg': '0 8px 32px -8px rgba(0, 0, 0, 0.12)',
        'soft-xl': '0 16px 48px -12px rgba(0, 0, 0, 0.15)',
        'glow-amber': '0 4px 24px -4px rgba(245, 158, 11, 0.35)',
        'glow-purple': '0 4px 24px -4px rgba(139, 92, 246, 0.35)',
        'glow-blue': '0 4px 24px -4px rgba(59, 130, 246, 0.35)',
        'inner-soft': 'inset 0 2px 4px rgba(0, 0, 0, 0.04)',
        'button': '0 1px 3px rgba(0, 0, 0, 0.08), 0 4px 12px -2px rgba(0, 0, 0, 0.12)',
        'button-hover': '0 2px 6px rgba(0, 0, 0, 0.1), 0 8px 24px -4px rgba(0, 0, 0, 0.15)',
        'card': '0 1px 2px rgba(0, 0, 0, 0.04), 0 4px 16px -4px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 2px 4px rgba(0, 0, 0, 0.06), 0 8px 24px -4px rgba(0, 0, 0, 0.12)',
        'modal': '0 24px 48px -12px rgba(0, 0, 0, 0.2)',
        'bottom-sheet': '0 -4px 32px -4px rgba(0, 0, 0, 0.1)',
      },
      
      // Surface Colors (Hair Studio brand)
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        // ---- Semantic tokens (source of truth; theme-aware via CSS vars) ----
        ink: 'hsl(var(--ink))',
        'ink-2': 'hsl(var(--ink-2))',
        'ink-3': 'hsl(var(--ink-3))',
        surface: 'hsl(var(--surface))',
        'surface-2': 'hsl(var(--surface-2))',
        hairline: 'hsl(var(--hairline))',
        brass: 'hsl(var(--brass))',
        'brass-ink': 'hsl(var(--brass-ink))',

        // TRANSITIONAL SHIM: 207 existing usages of amber-*/orange-* across 29
        // components predate the brass palette. Rather than a risky mass edit,
        // we re-point Tailwind's amber/orange ramps at brass so every legacy
        // class renders premium immediately. Components migrate to `brand-*`
        // during the M3 component redesign, then this shim can be deleted.
        amber: {
          50: '#FAF6EC', 100: '#F2E8CF', 200: '#E6D3A3', 300: '#D9BC74',
          400: '#C9A24E', 500: '#B98A2F', 600: '#9C7326', 700: '#7C5A1A',
          800: '#5E4414', 900: '#42300E',
        },
        // Deeper bronze so two-stop gradients (from-amber-500 to-orange-500)
        // still read as a gradient instead of flattening.
        orange: {
          50: '#F7F1E6', 100: '#EDDFC4', 200: '#DCC392', 300: '#C9A462',
          400: '#AE8535', 500: '#8E6A22', 600: '#74561B', 700: '#5A4215',
          800: '#42300E', 900: '#2C2009',
        },

        // Brand ramp — brass/champagne (premium) rather than warning-yellow amber
        brand: {
          50: '#FAF6EC',
          100: '#F2E8CF',
          200: '#E6D3A3',
          300: '#D9BC74',
          400: '#C9A24E',
          500: '#B98A2F',  // Primary brass
          600: '#9C7326',
          700: '#7C5A1A',
          800: '#5E4414',
          900: '#42300E',
        },
        // Surface colors for layering
        surface: {
          DEFAULT: '#ffffff',
          raised: '#fafafa',
          sunken: '#f4f4f5',
          overlay: 'rgba(255, 255, 255, 0.95)',
          'overlay-dark': 'rgba(0, 0, 0, 0.5)',
        },
        // Premium accent
        premium: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7c3aed',
          800: '#6b21a8',
          900: '#581c87',
        },
      },
      
      // Keyframe Animations
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-down": {
          from: { opacity: "0", transform: "translateY(-16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        "bounce-soft": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
        "skeleton-wave": {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "slide-up": "slide-up 0.3s ease-out",
        "slide-down": "slide-down 0.3s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        "shimmer": "shimmer 2s linear infinite",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
        "bounce-soft": "bounce-soft 1s ease-in-out infinite",
        "skeleton-wave": "skeleton-wave 1.8s ease-in-out infinite",
      },
      
      // Background Images (gradients)
      backgroundImage: {
        // Restrained brass gradient — reserved for the ONE primary CTA per screen
        'gradient-brand': 'linear-gradient(135deg, #C9A24E 0%, #9C7326 100%)',
        'gradient-brand-soft': 'linear-gradient(135deg, #FAF6EC 0%, #F2E8CF 100%)',
        'gradient-premium': 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
        'gradient-premium-soft': 'linear-gradient(135deg, #faf5ff 0%, #eef2ff 100%)',
        'gradient-success': 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        'gradient-surface': 'linear-gradient(180deg, #ffffff 0%, #fafafa 100%)',
        'gradient-shimmer': 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
      },
      
      // Backdrop Blur
      backdropBlur: {
        'xs': '2px',
      },
      
      // Z-index scale
      zIndex: {
        'header': '50',
        'modal': '100',
        'popover': '150',
        'toast': '200',
      },
      
      // Min height for touch targets
      minHeight: {
        'touch': '44px',
        'touch-lg': '48px',
        'touch-xl': '56px',
      },
      
      // Min width for touch targets
      minWidth: {
        'touch': '44px',
      },
    },
  },
  plugins: [tailwindcssAnimate, tailwindcssAspectRatio],
} satisfies Config;
