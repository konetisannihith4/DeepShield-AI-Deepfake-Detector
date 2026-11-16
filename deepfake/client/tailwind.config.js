/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Required exact color palette:
        royal: {
          DEFAULT: '#014BAA',
          50: '#F0F5FF',
          100: '#E6F0FF',
          200: '#C2DBFE',
          300: '#94BEFC',
          400: '#5495F7',
          500: '#1D72ED',
          600: '#014BAA', // Primary Royal Blue
          700: '#013D8B',
          800: '#012E6B',
          900: '#01204A',
          950: '#00132E',
        },
        cream: {
          DEFAULT: '#F8F3F0',
          50: '#FDFCFB',
          100: '#F8F3F0', // Background Light Cream
          200: '#EFE7E2',
          300: '#E5D8D0',
          400: '#D6C3B7',
        },
        pink: {
          soft: '#F4B6CC', // Soft Pink Accent
          DEFAULT: '#F4B6CC',
          light: '#FDF1F5',
          border: '#F8D0DF',
          dark: '#B83264',
        },
        dark: {
          text: '#282B4A', // Dark Text
          DEFAULT: '#282B4A',
          muted: '#5A5E7A',
          subtle: '#888DAA',
          border: '#D9DCE8',
        },
        ice: {
          DEFAULT: '#E6F0FF', // Light Blue
          50: '#F5F9FF',
          100: '#E6F0FF',
          200: '#CEE2FF',
          300: '#B0D1FF',
        },
        // Component-level tokens mapped to palette
        background: '#F8F3F0',
        foreground: '#282B4A',
        card: '#FFFFFF',
        'card-foreground': '#282B4A',
        primary: '#014BAA',
        'primary-foreground': '#FFFFFF',
        secondary: '#E6F0FF',
        'secondary-foreground': '#014BAA',
        muted: '#F8F3F0',
        'muted-foreground': '#5A5E7A',
        accent: '#F4B6CC',
        'accent-foreground': '#282B4A',
        destructive: '#EF4444',
        'destructive-foreground': '#FFFFFF',
        border: '#E2E8F0',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'royal': '0 4px 14px -2px rgba(1, 75, 170, 0.25)',
        'royal-lg': '0 10px 25px -3px rgba(1, 75, 170, 0.35)',
        'card': '0 1px 3px 0 rgba(40, 43, 74, 0.04), 0 1px 2px -1px rgba(40, 43, 74, 0.04)',
        'card-md': '0 4px 16px -2px rgba(40, 43, 74, 0.06), 0 2px 6px -2px rgba(40, 43, 74, 0.04)',
        'card-hover': '0 12px 28px -4px rgba(1, 75, 170, 0.12), 0 4px 12px -2px rgba(40, 43, 74, 0.06)',
        'pink': '0 4px 14px -2px rgba(244, 182, 204, 0.45)',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      }
    },
  },
  plugins: [],
}
