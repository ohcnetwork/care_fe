import { useAtom } from "jotai";
import { AlertTriangleIcon } from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { developerModeAtom } from "@/atoms/developerMode";
import { useQueryParams } from "raviger";

export default function ProductionWarningBanner() {
  const { t } = useTranslation();
  const [developerMode, setDeveloperMode] = useAtom(developerModeAtom);
  const [{ debug }] = useQueryParams();

  useEffect(() => {
    // Auto-enable developer mode if ?debug=true is in the URL
    if (debug === "true") {
      setDeveloperMode(true);
    }
  }, [debug, setDeveloperMode]);

  if (!developerMode) {
    return null;
  }

  return (
    <div className="sticky top-0 z-50 flex items-center justify-between gap-2 bg-red-600 px-4 py-2 text-white shadow-lg">
      <div className="flex items-center gap-2">
        <AlertTriangleIcon className="h-5 w-5 shrink-0 animate-pulse" />
        <span className="text-sm font-semibold">
          {t("production_warning_banner")}
        </span>
      </div>
    </div>
  );
}
