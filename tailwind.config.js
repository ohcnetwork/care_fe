module.exports = {
  important: true,
  theme: {
    extend: {
      colors: {
        primary: {
          100: "#def7ec",
          200: "#bcf0da",
          300: "#84e1bc",
          400: "#31c48d",
          500: "#7edce2",
          600: "#7edce2",
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
    },
  },
  variants: {},
  plugins: [require("@tailwindcss/ui")],
  purge: {
    content: [
      "./src/**/*.html",
      "./src/**/*.tsx",
      "./src/**/*.ts",
      "./src/**/*.js",
      "./src/**/*.res",
    ],
    options: {
      whitelistPatterns: [/^bg-/, /^text-/, /^border-/, /^hover:/],
    },
  },
};
