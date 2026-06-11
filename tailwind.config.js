/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#F5EDE0",
        "cream-card": "#EDE5D5",
        "green-primary": "#3DBF52",
        "green-dark": "#0D3018",
        "slyce-dark": "#1C1C1E",
        "slyce-grey": "#9A9A9A",
        "slyce-border": "#DDD6CC",
        accent: "#4CB050",
      },
      spacing: {
        "13": "3.25rem",
        "18": "4.5rem",
        "68": "17rem",
      },
      fontFamily: {
        inter: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
