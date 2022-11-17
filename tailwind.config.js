/* eslint-disable @typescript-eslint/no-var-requires */
const colors = require("tailwindcss/colors");
const defaultTheme = require("tailwindcss/defaultTheme");

module.exports = {
  important: true,
  theme: {
    screens: {
      vs: "348px",
      ...defaultTheme.screens,
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
        secondary: colors.gray,
        danger: colors.red,
        warning: colors.amber,
        alert: colors.violet,
        gray: {
          100: "#FBF9FB",
          200: "#F6F6F6",
          300: "#F1EDF7",
          400: "#DFDAE8",
          500: "#BFB8CC",
          600: "#9C9C9C",
          700: "#808080",
          800: "#6A5F7A",
          900: "#453C52",
        },
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
            DEFAULT: colors.gray[400],
            fore: colors.gray[800],
          },
        },
        doctors: {
          general: "#D79B00",
          critical: "#C81E1E",
          paediatrics: "#453C52",
          other: "#03543F",
          pulmonology: "#000080",
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
