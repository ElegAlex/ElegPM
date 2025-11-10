/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/renderer/**/*.{js,jsx,ts,tsx,html}',
  ],
  theme: {
    extend: {
      colors: {
        // Palette Linear-inspired
        background: '#FFFFFF',
        foreground: '#171717',
        card: '#FFFFFF',
        'card-foreground': '#171717',

        border: '#E5E7EB',
        input: '#F3F4F6',

        primary: {
          DEFAULT: '#3B82F6',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#F3F4F6',
          foreground: '#171717',
        },
        accent: {
          DEFAULT: '#F3F4F6',
          foreground: '#171717',
        },

        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',

        // Statuts tâches
        status: {
          todo: '#94A3B8',
          progress: '#3B82F6',
          review: '#F59E0B',
          done: '#10B981',
          blocked: '#EF4444',
        },

        // Priorités
        priority: {
          low: '#94A3B8',
          medium: '#3B82F6',
          high: '#F59E0B',
          urgent: '#EF4444',
        },

        sidebar: '#FAFAFA',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      fontSize: {
        xs: '0.75rem',    // 12px
        sm: '0.875rem',   // 14px
        base: '1rem',     // 16px
        lg: '1.125rem',   // 18px
        xl: '1.25rem',    // 20px
        '2xl': '1.5rem',  // 24px
        '3xl': '1.875rem', // 30px
      },
      spacing: {
        '1': '0.25rem',   // 4px
        '2': '0.5rem',    // 8px
        '3': '0.75rem',   // 12px
        '4': '1rem',      // 16px
        '5': '1.25rem',   // 20px
        '6': '1.5rem',    // 24px
        '8': '2rem',      // 32px
        '10': '2.5rem',   // 40px
        '12': '3rem',     // 48px
      },
      borderRadius: {
        sm: '0.25rem',    // 4px
        DEFAULT: '0.375rem', // 6px
        md: '0.375rem',   // 6px
        lg: '0.5rem',     // 8px
        xl: '0.75rem',    // 12px
        full: '9999px',
      },
      transitionDuration: {
        DEFAULT: '150ms',
      },
    },
  },
  plugins: [],
};
