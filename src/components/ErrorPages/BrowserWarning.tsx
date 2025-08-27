import bowser from "bowser";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
    return null;
  }, []);

  const [showUnsupportedBrowserDialog, setShowUnsupportedBrowserDialog] =
    useState(true);

  if (!notSupported) {
    return null;
  }

  return (
    <>
      <AlertDialog
        open={showUnsupportedBrowserDialog}
        onOpenChange={setShowUnsupportedBrowserDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("unsupported_browser")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("unsupported_browser_description", notSupported)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => setShowUnsupportedBrowserDialog(false)}
            >
              {t("close")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="sticky top-0 z-50 flex h-32 w-full items-center justify-center bg-gray-700/85 text-center text-gray-300">
        <div>
          <h2 className="text-lg font-medium">{t("unsupported_browser")}</h2>
          <p className="text-sm">
            {t("unsupported_browser_description", notSupported)}
          </p>
        </div>
      </div>
    </>
  );
};

export default BrowserWarning;
