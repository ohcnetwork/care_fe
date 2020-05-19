
const cssnano = require("cssnano");
const purgecss = require("@fullhuman/postcss-purgecss")({
  content: ["./public/**/*.html", "./src/**/*.js", "./src/**/*.jsx"],
  efaultExtractor: (content) => content.match(/[\w-/.:]+(?<!:)/g) || [],
});
module.exports = {
  plugins: [
    require("tailwindcss"),
    require("autoprefixer"),
    cssnano({
      preset: "default",
    }),
    ...(process.env.NODE_ENV === "production" ? [purgecss] : []),
  ],
};