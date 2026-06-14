/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cyber: {
          background: '#0B1020',
          panel: '#121A2B',
          panelSoft: '#172238',
          border: '#24324A',
          blue: '#3B82F6',
          red: '#EF4444',
          green: '#22C55E',
          yellow: '#F59E0B',
          text: '#E5E7EB',
          muted: '#94A3B8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        panel: '0 18px 60px rgba(0, 0, 0, 0.24)',
        glowBlue: '0 0 28px rgba(59, 130, 246, 0.25)',
        glowGreen: '0 0 26px rgba(34, 197, 94, 0.22)',
        glowRed: '0 0 26px rgba(239, 68, 68, 0.22)',
      },
    },
  },
  plugins: [],
}
