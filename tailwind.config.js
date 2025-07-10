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
        green: "colors.emerald",
        yellow: "colors.amber",
        purple: "colors.violet",
        primary: {
          100: "#def7ec",
          200: "#bcf0da",
          300: "#84e1bc",
          400: "#31c48d",
          500: "#0d9f6e",
          600: "#057a55",
          700: "#046c4e",
          800: "#03543F",
          900: "#014737",
          DEFAULT: "#0d9f6e",
        },
        secondary: secondary,
        danger: "colors.red",
        warning: "colors.amber",
        alert: "colors.violet",
        gray: "colors.gray",
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
