import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ['var(--font-space)', 'system-ui', 'sans-serif'],
        body: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
      },
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
        'accent-matcha': '#7ea182',
        'accent-mustard': '#d6a848',
        'accent-slate': '#6d859e',
        'accent-rose': '#b87b7b',
        'accent-clay': '#a67c65',
        'accent-violet': '#8b5cf6',
        'accent-emerald': '#10b981',
        'accent-amber': '#f59e0b',
        'accent-coral': '#ef4444',
        
        // Neo-Brutalist Colors
        'neo-ink': '#111111',
        'neo-cream': '#FFF9E9',
        'neo-purple': '#7C3AED',
        'neo-green': '#B7F34A',
        'neo-yellow': '#FFD84D',
        'neo-blue': '#4DA8FF',
        'neo-coral': '#FF5C5C',
        'neo-orange': '#FF8A34',
      },
      boxShadow: {
        'neo-sm': '4px 4px 0 #111111',
        'neo-md': '6px 6px 0 #111111',
        'neo-lg': '8px 8px 0 #111111',
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      animation: {
        'fade-in': 'fadeSlideUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'float': 'float 5s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 4s ease-in-out infinite',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
