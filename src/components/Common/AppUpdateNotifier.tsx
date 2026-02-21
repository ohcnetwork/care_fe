import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { useAppVersion } from "@/hooks/useAppVersion";
import { checkAndClearAppUpdatedFlag } from "@/lib/appVersion";

/**
 * Component that handles app update notifications.
 *
 * - On mount: shows success toast if app was just updated
 * - When pendingUpdate is set: shows persistent toast with update action
 *
 * This should be rendered once in App.tsx inside QueryClientProvider.
 */
export function AppUpdateNotifier() {
  const { t } = useTranslation();
  const { pendingUpdate, updateApp } = useAppVersion();
  const hasShownUpdateToast = useRef(false);

  // Show success toast if app was just updated
  useEffect(() => {
    if (checkAndClearAppUpdatedFlag()) {
      toast.success(t("updated_successfully"), {
        description: t("now_using_the_latest_version_of_care"),
        duration: 5000,
      });
    }
  }, [t]);

  // Show update available toast when pending update is detected
  useEffect(() => {
    if (pendingUpdate && !hasShownUpdateToast.current) {
      hasShownUpdateToast.current = true;
      toast(t("software_update"), {
        id: "app-update-available",
        description: t("a_new_version_of_care_is_available"),
        duration: Infinity,
        action: {
          label: t("update"),
          onClick: updateApp,
        },
      });
    }
  }, [pendingUpdate, updateApp, t]);

  return null;
}
