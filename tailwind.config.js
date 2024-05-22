/* eslint-disable @typescript-eslint/no-var-requires */
const colors = require("tailwindcss/colors");
const defaultTheme = require("tailwindcss/defaultTheme");

const gray = {
  100: "#FBFAFC",
  200: "#F7F5FA",
  300: "#F1EDF7",
  400: "#DFDAE8",
  500: "#BFB8CC",
  600: "#9187A1",
  700: "#7D728F",
  800: "#6A5F7A",
  900: "#453C52",
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  important: true,
  theme: {
    screens: {
      vs: "348px",
      ...defaultTheme.screens,
      "3xl": "1920px",
    },
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      colors: {
        green: colors.emerald,
        yellow: colors.amber,
        purple: colors.violet,
        primary: {
          100: "#def7ec",
          200: "#bcf0da",
          300: "#84e1bc",
          400: "#31c48d",
          DEFAULT: "#0d9f6e",
          500: "#0d9f6e",
          600: "#057a55",
          700: "#046c4e",
          800: "#03543F",
          900: "#014737",
        },
        secondary: gray, // equivalent to our custom gray, but will become equivalent to tailwind's gray in tailwind v3.2
        danger: colors.red,
        warning: colors.amber,
        alert: colors.violet,
        gray,
        patient: {
          comfort: {
            DEFAULT: colors.slate[200],
            fore: colors.slate[700],
          },
          stable: {
            DEFAULT: "#59D4FF",
            fore: colors.white,
          },
          abnormal: {
            DEFAULT: "#F6CB23",
            fore: colors.yellow[900],
          },
          critical: {
            DEFAULT: colors.red[500],
            fore: colors.red[100],
          },
          unknown: {
            DEFAULT: gray[400],
            fore: gray[800],
          },
        },
      },
      padding: {
        "1/5": "20%",
      },
      scale: {
        25: "0.25",
        175: "1.75",
        200: "2",
      },
    },
  },
  content: ["./src/**/*.{html,md,js,jsx,ts,tsx,res}", "./index.html"],
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
    require("@tailwindcss/container-queries"),
  ],
};
