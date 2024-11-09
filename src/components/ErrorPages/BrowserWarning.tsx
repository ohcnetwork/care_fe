import bowser from "bowser";
import React from "react";
import { useTranslation } from "react-i18next";

import supportedBrowsers from "@/supportedBrowsers";

const BrowserWarning = () => {
  const { t } = useTranslation();
  const notSupported = React.useMemo(() => {
    const userAgent = window.navigator.userAgent;
    if (!supportedBrowsers.test(userAgent)) {
      const browser = bowser.getParser(userAgent).getBrowser();
      return {
        name: browser.name || "Unknown",
        version: browser.version || "Unknown",
      };
    }
  }, []);

  if (!notSupported) {
    return null;
  }

  return (
    <div className="fixed left-0 top-0 z-50 flex h-20 w-full items-center justify-center bg-gray-800 bg-opacity-60 text-center text-gray-300">
      <div>
        <h2 className="text-lg font-medium">{t("unsupported_browser")}</h2>
        <p className="text-sm">
          {t("unsupported_browser_description", notSupported)}
        </p>
      </div>
    </div>
  );
};

export default BrowserWarning;
