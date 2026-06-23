/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // --- Light "Helium 10" content palette ---
        canvas: '#ffffff', // page background (white)
        surface: '#f8f9fa', // cards (light grey)
        surface2: '#eef1f6', // subtle inset / hover
        line: '#e5e7eb', // borders
        // --- Brand: deep blue (#1B4FD8) ---
        brand: {
          DEFAULT: '#1b4fd8',
          dark: '#1740b0',
          soft: '#3b6fe0',
          tint: '#eef3fe', // very light blue wash
        },
        // --- Dark navy sidebar ("rail") ---
        rail: {
          DEFAULT: '#141b3c',
          hover: '#1f274f',
          line: '#2a3360',
          muted: '#8b93c4',
        },
      },
      fontFamily: {
        // green-600 = #16A34A and red-600 = #DC2626 (used directly for positive/negative)
        sans: ['Inter', 'DM Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(15 23 42 / 0.04), 0 1px 3px 0 rgb(15 23 42 / 0.06)',
        pop: '0 10px 30px -10px rgb(15 23 42 / 0.25)',
      },
      keyframes: {
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        fadein: {
          '0%': { opacity: 0, transform: 'translateY(4px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      },
      animation: {
        fadein: 'fadein 0.25s ease-out',
      },
    },
  },
  plugins: [],
}
