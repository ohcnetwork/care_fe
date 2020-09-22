module.exports = {
  important: true,
  theme: {
    extend: {
       colors: {
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
    content: ["./src/**/*.html", "./src/**/*.tsx", "./src/**/*.ts", "./src/**/*.js"],
    options: {
      whitelistPatterns: [/^bg-/, /^text-/, /^border-/, /^hover:/],
    },
  }
};
