import { useState } from "react";
import { useTranslation } from "react-i18next";

import ConfirmActionDialog from "@/components/Common/ConfirmActionDialog";

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

const BrowserWarning = () => {
  const { t } = useTranslation();

  const [isSupported] = useState(isBrowserSupported);

  const [showUnsupportedBrowserDialog, setShowUnsupportedBrowserDialog] =
    useState(true);

  if (isSupported) {
    return null;
  }

  return (
    <>
      <ConfirmActionDialog
        open={showUnsupportedBrowserDialog}
        onOpenChange={setShowUnsupportedBrowserDialog}
        title={t("unsupported_browser")}
        description={t("unsupported_browser_features_description")}
        onConfirm={() => setShowUnsupportedBrowserDialog(false)}
        confirmText={t("close")}
        hideCancel
      />

      <div className="sticky top-0 z-50 flex h-32 w-full items-center justify-center bg-gray-700/85 text-center text-gray-300">
        <div>
          <h2 className="text-lg font-medium">{t("unsupported_browser")}</h2>
          <p className="text-sm">
            {t("unsupported_browser_features_description")}
          </p>
        </div>
      </div>
    </>
  );
};

export default BrowserWarning;
