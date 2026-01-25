import { AlertTriangleIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export const DEVELOPER_MODE_KEY = "care:developer_mode";

export default function ProductionWarningBanner() {
  const { t } = useTranslation();
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    const value = localStorage.getItem(DEVELOPER_MODE_KEY);
    setShowWarning(value === "true");
  }, []);

  if (!showWarning) {
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
