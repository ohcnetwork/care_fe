import { lazy, Suspense, useState } from "react";

/**
 * Detects support for the platform features the app's styles depend on,
 * instead of sniffing the user agent. Tailwind CSS v4 relies on cascade
 * layers, `@property`, `color-mix()` and `oklch()` colors, which together
 * require Chrome 111, Safari 16.4 or Firefox 128.
 *
 * @see https://tailwindcss.com/docs/compatibility
 */
const isBrowserSupported = () =>
  typeof CSS !== "undefined" &&
  "CSSLayerBlockRule" in window &&
  "CSSPropertyRule" in window &&
  CSS.supports("color", "oklch(0% 0 0)") &&
  CSS.supports("color", "color-mix(in oklab, red, blue)");

// The notice and its dialog are only needed on unsupported browsers.
const UnsupportedBrowserNotice = lazy(
  () => import("@/components/ErrorPages/UnsupportedBrowserNotice"),
);

const BrowserWarning = () => {
  const [isSupported] = useState(isBrowserSupported);

  if (isSupported) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <UnsupportedBrowserNotice />
    </Suspense>
  );
};

export default BrowserWarning;
