/* eslint-disable @typescript-eslint/no-var-requires */
const colors = require("tailwindcss/colors");

module.exports = {
  important: true,
  theme: {
    extend: {
      colors: {
        green: colors.emerald,
        yellow: colors.amber,
        purple: colors.violet,
        primary: {
          100: "#def7ec",
          200: "#bcf0da",
          300: "#84e1bc",
          400: "#31c48d",
          500: "#0e9f6e",
          600: "#057a55",
          700: "#046c4e",
          800: "#03543f",
          900: "#014737",
        },
        gray: {
          100: "#FBFAFC",
          200: "#F7F5FA",
          300: "#F1EDF7",
          400: "#DFDAE8",
          500: "#BFB8CC",
          600: "#9187A1",
          700: "#7D728F",
          800: "#6A5F7A",
          900: "#453C52",
        },
      },
      padding: {
        "1/5": "20%",
      },
    },
  },
  corePlugins: {
    aspectRatio: false,
  },
  content: ["./src/**/*.{html,md,js,jsx,ts,tsx,res}"],
  safelist: [{ pattern: /^(bg|text|border)-/, variants: ["hover"] }],
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
    require("@tailwindcss/aspect-ratio"),
  ],
};
