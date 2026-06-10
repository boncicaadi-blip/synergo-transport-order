/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        nova: {
          indigo: '#0B178B',
          magenta: '#DA387E',
          blue: '#2980DA',
        },
      },
      fontFamily: {
        franklin: ['"Franklin Gothic Medium"', 'Arial Narrow', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
