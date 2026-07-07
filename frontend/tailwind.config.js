/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'protocol-blue': '#2563EB',
        'protocol-blue-hover': '#1D4ED8',
        'terminal-black': '#111827',
        'terminal-dark': '#1F2937',
        'terminal-grey': '#6B7280',
        'terminal-light': '#F9FAFB',
        'terminal-border': '#374151',
        'status-active': '#16A34A',
        'status-pending': '#D97706',
        'status-halted': '#DC2626',
      },
      fontFamily: {
        'brand': ['"Playfair Display"', 'Georgia', 'serif'],
        'body': ['"Inter"', 'system-ui', 'sans-serif'],
        'mono': ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      letterSpacing: {
        'protocol': '0.15em',
        'wide-protocol': '0.25em',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.4s ease-out forwards',
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
      },
    },
  },
  plugins: [],
};
