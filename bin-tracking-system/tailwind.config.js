/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Modern neutral palette (SaaS style)
        neutral: {
          50: '#f8fafc',   // Page background
          100: '#f1f5f9',  // Subtle backgrounds
          200: '#e2e8f0',  // Borders
          300: '#cbd5e1',  // Dividers
          400: '#94a3b8',  // Muted text
          500: '#64748b',  // Secondary text
          600: '#475569',  // Body text
          700: '#334155',  // Primary text
          800: '#1e293b',  // Headings
          900: '#0f172a',  // Dark text
        },
        // Primary action color - Deep Green
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a', // Primary brand color
          700: '#15803d', // Hover state
          800: '#166534',
          900: '#14532d',
        },
        // Status colors - Vibrant and clear
        status: {
          normal: '#22c55e',    // Vibrant green
          warning: '#f59e0b',   // Amber/Yellow
          full: '#ef4444',      // Clear red
        },
        // Sidebar colors
        sidebar: {
          bg: '#f8fafc',        // Slightly off-white
          border: '#e2e8f0',    // Light border
          hover: '#f1f5f9',     // Hover state
          active: '#16a34a',    // Active item
        },
        // Card backgrounds
        card: {
          bg: '#ffffff',        // White cards
          border: '#e2e8f0',    // Subtle borders
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      boxShadow: {
        'soft': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        'medium': '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
        'large': '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.05)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.25rem',
      },
    },
  },
  plugins: [],
}