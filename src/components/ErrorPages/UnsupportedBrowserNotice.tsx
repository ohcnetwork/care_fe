import { useState } from "react";
import { useTranslation } from "react-i18next";

import ConfirmActionDialog from "@/components/Common/ConfirmActionDialog";

const UnsupportedBrowserNotice = () => {
  const { t } = useTranslation();

  const [showUnsupportedBrowserDialog, setShowUnsupportedBrowserDialog] =
    useState(true);

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

export default UnsupportedBrowserNotice;
