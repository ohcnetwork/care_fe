import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { checkForUpdate } from "@/components/Common/UpdatableApp";

const APP_VERSION_KEY = "app-version";
const APP_UPDATED_KEY = "app-updated";

export const useAppUpdates = (
  silentlyAutoUpdate?: boolean,
  onDismissUpdateToast?: () => void,
) => {
  const [newVersion, setNewVersion] = useState<string>();
  const [appUpdated, setAppUpdated] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const { t } = useTranslation();

  useEffect(() => {
    checkForUpdate()
      .then(setNewVersion)
      .then(() => {
        const appUpdated = localStorage.getItem(APP_UPDATED_KEY);
        if (appUpdated === "true") {
          setAppUpdated(true);
          localStorage.removeItem(APP_UPDATED_KEY);
        }
      });
  }, []);

  useEffect(() => {
    if (!appUpdated) return;

    localStorage.removeItem(APP_UPDATED_KEY);
    setTimeout(() => setAppUpdated(false), 5000);
  }, [appUpdated]);

  const updateApp = async () => {
    if (!newVersion) return;

    setIsUpdating(true);

    caches.keys().then((names) => names.forEach((name) => caches.delete(name)));

    const updateLocalStorageAndReload = () => {
      localStorage.setItem(APP_UPDATED_KEY, "true");
      window.location.reload();
      localStorage.setItem(APP_VERSION_KEY, newVersion);
    };

    silentlyAutoUpdate
      ? updateLocalStorageAndReload()
      : setTimeout(updateLocalStorageAndReload, 1000);
  };

  if (newVersion && silentlyAutoUpdate) updateApp();

  useEffect(() => {
    if (newVersion && !silentlyAutoUpdate) {
      toast(t("software_update"), {
        description: t("a_new_version_of_care_is_available"),
        duration: Infinity,
        action: {
          label: isUpdating ? t("updating") : t("update"),
          onClick: updateApp,
        },
        onDismiss() {
          if (onDismissUpdateToast) {
            onDismissUpdateToast();
          }
        },
      });
    }
  }, [newVersion, isUpdating]);

  useEffect(() => {
    if (appUpdated) {
      toast(t("updated_successfully"), {
        description: t("now_using_the_latest_version_of_care"),
        duration: 5000,
      });
    }
  }, [appUpdated]);

  return { newVersion, appUpdated, updateApp };
};
