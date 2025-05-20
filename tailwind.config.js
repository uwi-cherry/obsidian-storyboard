/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        accent: 'var(--interactive-accent)',
        'accent-hover': 'var(--interactive-accent-hover)',
        'on-accent': 'var(--text-on-accent)',
        secondary: 'var(--background-secondary)',
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

