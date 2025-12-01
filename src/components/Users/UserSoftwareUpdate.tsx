import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";

import UpdatableApp, { checkForUpdate } from "@/components/Common/UpdatableApp";

import { clearQueryPersistenceCache } from "@/Utils/request/queryClient";
import { useQueryClient } from "@tanstack/react-query";
import { RotateCwIcon } from "lucide-react";

function ClearCacheButton() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isClearing, setIsClearing] = useState(false);
  const clearCache = async () => {
    setIsClearing(true);
    try {
      const cacheNames = await caches.keys();
      if (cacheNames.length > 0) {
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
      }
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((reg) => reg.unregister()));
      }
      queryClient.clear();
      clearQueryPersistenceCache();
      window.location.reload();
    } catch (error) {
      console.error("Cache clear failed:", error);
      toast.error(t("cache_clear_failed"));
      setIsClearing(false);
    }
  };

  return (
    <Button
      variant="primary"
      onClick={clearCache}
      disabled={isClearing}
      className="rounded-md bg-primary-700 text-white shadow-sm hover:bg-primary-600 hover:text-white disabled:opacity-70"
    >
      <RotateCwIcon
        className={`text-2xl ${isClearing ? "animate-spin" : ""}`}
      />
      <span className="ml-1">{t("clear_cache")}</span>
    </Button>
  );
}

export default function UserSoftwareUpdate() {
  const [updateStatus, setUpdateStatus] = useState({
    isChecking: false,
    isUpdateAvailable: false,
  });
  const { t } = useTranslation();

  const checkUpdates = async () => {
    clearQueryPersistenceCache();
    setUpdateStatus({ ...updateStatus, isChecking: true });
    await new Promise((resolve) => setTimeout(resolve, 500));
    if ((await checkForUpdate()) != null) {
      setUpdateStatus({
        isUpdateAvailable: true,
        isChecking: false,
      });
    } else {
      setUpdateStatus({
        isUpdateAvailable: false,
        isChecking: false,
      });
      toast.success(t("no_update_available"));
    }
  };

  return (
    <div className="flex justify-center sm:justify-start overflow-hidden rounded-lg bg-white px-4 py-5 shadow-sm sm:rounded-lg sm:p-6 space-x-2">
      {updateStatus.isChecking ? (
        // While checking for updates
        <Button variant="primary" disabled aria-busy="true">
          <div className="flex items-center gap-4">
            <CareIcon icon="l-sync" className="text-2xl animate-spin" />
            {t("checking_for_update")}
          </div>
        </Button>
      ) : updateStatus.isUpdateAvailable ? (
        // When an update is available
        <UpdatableApp
          silentlyAutoUpdate={false}
          onDismissUpdateToast={() => {
            setUpdateStatus({
              isUpdateAvailable: false,
              isChecking: false,
            });
          }}
        >
          <Button disabled>
            <div className="flex items-center gap-4">
              <CareIcon
                icon="l-exclamation"
                className="text-2xl text-warning"
              />
              {t("update_available")}
            </div>
          </Button>
        </UpdatableApp>
      ) : (
        // Default state to check for updates
        <Button variant="primary" onClick={checkUpdates}>
          <div className="flex items-center gap-4">
            <CareIcon icon="l-sync" className="text-xl" />
            {t("check_for_update")}
          </div>
        </Button>
      )}
      <ClearCacheButton />
    </div>
  );
}
