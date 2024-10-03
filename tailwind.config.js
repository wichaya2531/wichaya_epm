/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Open Sans', 'sans-serif'],
      },
      screens: {
        'ipadmini': '800px',
      },
      colors: {
        'primary': '#0c487f',
        'end': '#4398e7',
        'secondary': '#878787',
        'extra': '#083148'
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      container: {
        screens: {
          'sm': '100%',
          'md': '100%',
          'lg': '1024px',
          'xl': '1100px',
          '2xl': '1400px',
        }
      }
    },
  },
  plugins: [],
};
