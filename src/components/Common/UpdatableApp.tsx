import { t } from "i18next";
import { ReactNode, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

import { useToast } from "@/hooks/useToast";

const META_URL = "/build-meta.json";
const APP_VERSION_KEY = "app-version";
const APP_UPDATED_KEY = "app-updated";

interface UpdatableAppProps {
  children: ReactNode;
  silentlyAutoUpdate?: boolean;
}

export const checkForUpdate = async () => {
  const appVersion = localStorage.getItem(APP_VERSION_KEY);

  const res = await fetch(META_URL, {
    headers: {
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
      Expires: "0",
    },
  });

  if (res.status !== 200) {
    console.error(
      `Skipped checking for updates. Failed to fetch '${META_URL}'.`,
    );
    return;
  }

  const meta = await res.json();

  if (appVersion !== meta.version) {
    console.info("App can be updated.");
    return meta.version as string;
  }
};

const UpdatableApp = ({ children, silentlyAutoUpdate }: UpdatableAppProps) => {
  const [newVersion, setNewVersion] = useState<string>();
  const [appUpdated, setAppUpdated] = useState(false);

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

  return (
    <div className="relative">
      {children}
      {newVersion && <UpdateAppPopup onUpdate={updateApp} />}
      <AppUpdatedAlert show={appUpdated} />
    </div>
  );
};

export default UpdatableApp;

interface UpdateAppPopupProps {
  onUpdate: () => void;
}

const UpdateAppPopup = ({ onUpdate }: UpdateAppPopupProps) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    toast({
      title: t("software_update"),
      description: t("a_new_version_of_care_is_available"),
      action: (
        <Button onClick={updateApp} disabled={isUpdating} variant="white">
          {isUpdating ? "Updating..." : "Update"}
        </Button>
      ),
    });
  }, []);

  const updateApp = () => {
    setIsUpdating(true);
    onUpdate();
  };

  return null;
};

interface AppUpdatedAlertProps {
  show: boolean;
}

const AppUpdatedAlert = ({ show }: AppUpdatedAlertProps) => {
  const { toast } = useToast();
  useEffect(() => {
    if (show) {
      toast({
        title: t("updated_successfully"),
        description: t("now_using_the_latest_version_of_care"),
        duration: 5000,
      });
    }
  }, [show]);

  return null;
};
