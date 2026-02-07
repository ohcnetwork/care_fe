import { useAtom } from "jotai";
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
    <div className="group fixed right-0 bottom-0 top-0 z-50 flex flex-col justify-start pointer-events-none">
      {/* Ghost hover detector - stays fixed, detects hover */}
      <div className="absolute top-0 right-0 h-10 w-full pointer-events-auto" />
      {/* Actual banner content - moves based on group hover */}
      <div className="pointer-events-auto flex items-center gap-2 bg-red-600 px-4 py-2 text-white font-mono group-hover:mt-auto animate-caret-blink">
        <span className="text-sm font-semibold">
          {t("production_warning_banner")}
        </span>
      </div>
    </div>
  );
}
