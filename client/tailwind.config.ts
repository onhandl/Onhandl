import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    '*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        /* ── Onhandl named palette — use these in components ── */
        fl: {
          base: 'var(--fl-base)',         // #eeeeee — page bg
          surface: 'var(--fl-surface)',       // #fafafa — card bg
          'surface-2': 'var(--fl-surface-2)',     // #f4f4f4 — hover bg
          dark: 'var(--fl-dark)',          // #101010 — dark panel
          'dark-2': 'var(--fl-dark-2)',        // #1f1d1c
          darker: 'var(--fl-darker)',        // #020202 — near-black
          ink: 'var(--fl-ink)',           // #020202 — primary text
          'ink-2': 'var(--fl-ink-2)',         // #3d3a39 — secondary text
          'ink-3': 'var(--fl-ink-3)',         // #8a8380 — muted text
          'ink-inv': 'var(--fl-ink-inv)',       // #eeeeee — text on dark
          accent: 'var(--fl-accent)',
          'accent-dark': 'var(--fl-accent-dark)',
          'accent-bg': 'var(--fl-accent-bg)',     // orange tint
          line: 'var(--fl-line)',          // #ccc9c7 — default border
          'line-2': 'var(--fl-line-2)',        // #b8b3b0 — stronger border
          'line-strong': 'var(--fl-line-strong)',   // #a49d9a — outlined btn
          'line-dark': 'var(--fl-line-dark)',     // #2e2c2b — dark panel border
        },

        /* ── shadcn / Radix semantic aliases ── */
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        popover: {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--popover-foreground)',
        },
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
          foreground: 'var(--destructive-foreground)',
        },
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        sidebar: {
          DEFAULT: 'var(--sidebar)',
          foreground: 'var(--sidebar-foreground)',
          primary: 'var(--sidebar-primary)',
          'primary-foreground': 'var(--sidebar-primary-foreground)',
          accent: 'var(--sidebar-accent)',
          'accent-foreground': 'var(--sidebar-accent-foreground)',
          border: 'var(--sidebar-border)',
          ring: 'var(--sidebar-ring)',
        },
      },

      fontFamily: {
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)'],
      },

      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        factory: '4px',
      },

      letterSpacing: {
        'factory-h1': '-0.048em',
        'factory-h2': '-0.035em',
        'factory-nav': '-0.02em',
      },

      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-down': {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        blob: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in-up': 'fade-in-up 0.7s ease-out',
        'fade-in-down': 'fade-in-down 0.7s ease-out',
        'fade-in': 'fade-in-up 0.7s ease-out',
        blob: 'blob 10s infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
