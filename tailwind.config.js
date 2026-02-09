const secondary = {
  50: "#F9FAFB",
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
  darkMode: ["class"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Figtree", "sans-serif"],
      },
      colors: {
        primary: {
          100: "#f8d7da",
          200: "#f1aeb5",
          300: "#ea868f",
          400: "#e35d6a",
          500: "#8B0000", // darkred
          600: "#7a0000",
          700: "#660000",
          800: "#520000",
          900: "#3d0000",
          DEFAULT: "#8B0000",
        },
        secondary: secondary,
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
        border: "hsl(var(--sidebar-border))",
        ring: "hsl(var(--sidebar-ring))",
      },
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
          to: { height: "var(--radix-collapsible-content-height)" },
        },
        "collapsible-up": {
          from: { height: "var(--radix-collapsible-content-height)" },
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
