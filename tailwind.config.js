/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  theme: {
    extend: {
      scale: {
        25: "0.25",
        175: "1.75",
        200: "2",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontSize: {
        "7xl": "5rem",
      },
      width: {
        "80mm": "80mm",
      },
      height: {
        "170mm": "170mm",
      },
      keyframes: {
        "caret-blink": {
          "0%,70%,100%": { opacity: "1" },
          "20%,50%": { opacity: "0" },
        },
        "collapsible-down": {
          from: { height: "0" },
          to: { height: "var(--collapsible-panel-height)" },
        },
        "collapsible-up": {
          from: { height: "var(--collapsible-panel-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "caret-blink": "caret-blink 1.25s ease-out infinite",
        "collapsible-down": "collapsible-down 0.2s ease-out",
        "collapsible-up": "collapsible-up 0.2s ease-out",
      },
    },
  },
  content: [
    "./src/**/*.{html,md,js,jsx,ts,tsx}",
    "./apps/**/*.{html,md,js,jsx,ts,tsx}",
    "./index.html",
  ],
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
    require("@tailwindcss/container-queries"),
  ],
};
