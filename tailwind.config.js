/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src-new/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        accent: 'var(--interactive-accent)',
        'accent-hover': 'var(--interactive-accent-hover)',
        'on-accent': 'var(--text-on-accent)',
        primary: 'var(--background-primary)',
        secondary: 'var(--background-secondary)',
        'modifier-border': 'var(--background-modifier-border)',
        'modifier-hover': 'var(--background-modifier-hover)',
        'text-normal': 'var(--text-normal)',
        'text-muted': 'var(--text-muted)',
        'text-faint': 'var(--text-faint)',
        error: 'var(--text-error)',
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        '.field-sizing-content': {
          fieldSizing: 'content',
        },
      });
    },
  ],
}

