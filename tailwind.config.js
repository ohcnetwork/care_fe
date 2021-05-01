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
        emerald: {
          50: "#ECFDF5",
          100: "#D1FAE5",
          200: "#A7F3D0",
          300: "#6EE7B7",
          400: "#34D399",
          500: "#10B981",
          600: "059669",
          700: "#047857",
          800: "#065F46",
          900: "#064E3B"
        }
      },
      fontFamily: {
        'poppins': ['Poppins'],
        'roboto': ['Roboto']
      }
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
