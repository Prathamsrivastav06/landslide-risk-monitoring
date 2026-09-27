module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        command: {
          bg: '#0a0f1d',
          surface: '#111a2e',
          card: '#16223b',
          cardHover: '#1c2b4a',
          panel: 'rgba(17, 26, 46, 0.88)',
          border: 'rgba(148, 163, 184, 0.22)',
          borderLight: 'rgba(148, 163, 184, 0.35)',
          highlight: 'rgba(56, 189, 248, 0.25)',
          text: '#ffffff',
          textSecondary: '#e2e8f0',
          muted: '#cbd5e1',
          subtext: '#94a3b8',
        },
        cyber: {
          cyan: '#38bdf8',
          emerald: '#34d399',
          amber: '#fbbf24',
          rose: '#f87171',
          blue: '#60a5fa',
          purple: '#c084fc',
        },
        risk: {
          low: '#34d399',
          moderate: '#fbbf24',
          high: '#fb923c',
          critical: '#f87171',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace']
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'radar-sweep': 'radar 4s linear infinite',
      },
      keyframes: {
        radar: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        }
      }
    }
  },
  plugins: []
}
