import { formatDistanceToNow } from "date-fns";
import { RotateCwIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";

import { useAppVersion } from "@/hooks/useAppVersion";
import { clearAllCaches } from "@/lib/appVersion";

function ClearCacheButton() {
  const { t } = useTranslation();

  const clearCache = async () => {
    try {
      await clearAllCaches();
      window.location.reload();
    } catch (error) {
      console.error("Cache clear failed:", error);
      toast.error(t("cache_clear_failed"));
    }
  };

  return (
    <Button
      variant="primary"
      onClick={clearCache}
      className="rounded-md bg-primary-700 text-white shadow-sm hover:bg-primary-600 hover:text-white disabled:opacity-70"
    >
      <RotateCwIcon className="text-2xl" />
      <span className="ml-1">{t("clear_cache")}</span>
    </Button>
  );
}

export default function UserSoftwareUpdate() {
  const { t } = useTranslation();
  const { versionInfo, pendingUpdate, isChecking, checkForUpdate, updateApp } =
    useAppVersion();

  const lastUpdatedText = versionInfo?.lastUpdatedAt
    ? formatDistanceToNow(new Date(versionInfo.lastUpdatedAt), {
        addSuffix: true,
      })
    : null;

  return (
    <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow-sm sm:rounded-lg sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h3 className="text-lg font-medium text-gray-900">
            {t("software_update")}
          </h3>
          {lastUpdatedText && (
            <p className="text-sm text-gray-500">
              {t("last_updated")}: {lastUpdatedText}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {isChecking ? (
            <Button
              variant="primary"
              disabled
              aria-busy="true"
              aria-label={t("checking_for_update")}
            >
              <CareIcon icon="l-sync" className="text-2xl animate-spin" />
              {t("checking_for_update")}
            </Button>
          ) : pendingUpdate ? (
            <Button variant="primary" onClick={updateApp}>
              <CareIcon icon="l-sync" className="text-xl" />
              {t("update_now")}
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={async () => {
                const hasUpdate = await checkForUpdate();
                if (!hasUpdate) {
                  toast.success(t("no_update_available"));
                }
              }}
            >
              <CareIcon icon="l-sync" className="text-xl" />
              {t("check_for_update")}
            </Button>
          )}
          <ClearCacheButton />
        </div>
      </div>
    </div>
  );
}
