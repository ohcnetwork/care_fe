module.exports = {
  important: true,
  theme: {
    extend: {},
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
