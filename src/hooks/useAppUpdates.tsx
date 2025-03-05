import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

import { checkForUpdate } from "@/components/Common/UpdatableApp";

import { useToast } from "@/hooks/useToast";

const APP_VERSION_KEY = "app-version";
const APP_UPDATED_KEY = "app-updated";

export const useAppUpdates = (silentlyAutoUpdate?: boolean) => {
  const [newVersion, setNewVersion] = useState<string>();
  const [appUpdated, setAppUpdated] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const { t } = useTranslation();
  const { toast } = useToast();

  useEffect(() => {
    checkForUpdate()
      .then(setNewVersion)
      .then(() => {
        const appUpdated = localStorage.getItem(APP_UPDATED_KEY);
        if (appUpdated === "true") {
          setAppUpdated(true);
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
      toast({
        title: t("software_update"),
        description: t("a_new_version_of_care_is_available"),
        duration: Infinity,
        action: (
          <Button onClick={updateApp} disabled={isUpdating} variant="white">
            {isUpdating ? t("updating") : t("update")}
          </Button>
        ),
      });
    }
  }, [newVersion, isUpdating]);

  useEffect(() => {
    if (appUpdated) {
      toast({
        title: t("updated_successfully"),
        description: t("now_using_the_latest_version_of_care"),
        duration: 5000,
      });
    }
  }, [appUpdated]);

  return { newVersion, appUpdated, updateApp };
};
