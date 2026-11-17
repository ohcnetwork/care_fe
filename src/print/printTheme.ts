/**
 * Colours passed to the Typst library (see `palette` in care.typ).
 *
 * Only base palette scales are read: they're the same in light and dark mode,
 * and paper is always light. care.typ maps them to CAREUI's light-theme
 * semantic tokens (border, soft background, foreground).
 */
const PRINT_COLORS = [
  ...[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map(
    (shade) => `gray-${shade}`,
  ),
  "neutral-50",
  "neutral-100",
  "neutral-200",
  "neutral-300",
  "neutral-950",
  "red-600",
  "yellow-600",
];

/**
 * Resolves the CAREUI palette from the app's CSS variables to hex colours.
 * Tailwind defines them in OKLCH; drawing each one on a canvas converts it to
 * sRGB, which is what print uses. Colours that aren't defined are left to
 * care.typ's defaults.
 */
export function resolvePrintTheme(): Record<string, string> {
  const style = getComputedStyle(document.documentElement);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return {};

  const theme: Record<string, string> = {};
  for (const name of PRINT_COLORS) {
    const value = style.getPropertyValue(`--color-${name}`).trim();
    if (!value || !CSS.supports("color", value)) continue;

    context.clearRect(0, 0, 1, 1);
    context.fillStyle = value;
    context.fillRect(0, 0, 1, 1);
    const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
    theme[name] =
      "#" + [r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("");
  }
  return theme;
}
