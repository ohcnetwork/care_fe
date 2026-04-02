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
    <div className="pointer-events-none fixed inset-x-0 top-20 md:top-4 z-50 flex justify-center mx-2">
      <div className="pointer-events-auto group relative animate-pulse">
        <div className="absolute -inset-1 rounded-full bg-red-500 opacity-50 blur-sm" />
        <div className="relative flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-white sm:shadow-lg ring-2 ring-red-400 transition-all hover:scale-105 hover:shadow-xl">
          <AlertTriangleIcon className="h-4 w-4 shrink-0 animate-pulse" />
          <span className="text-xs font-bold tracking-wide">
            {t("production_warning_banner")}
          </span>
        </div>
      </div>
    </div>
  );
}
