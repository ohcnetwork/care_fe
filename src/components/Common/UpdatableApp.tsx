import { t } from "i18next";
import { ReactNode, useEffect, useState } from "react";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
  return (
    <AlertTransition show={show}>
      <Popover>
        <PopoverTrigger asChild>
          <div className="rounded-xl bg-primary-500 px-5 py-4 text-white shadow-2xl shadow-primary-500 cursor-pointer">
            <div className="flex items-center gap-4">
              <CareIcon icon="l-thumbs-up" className="text-2xl" />
              <span className="mr-4 flex flex-col">
                <p className="font-semibold">{t("updated_successfully")}</p>
                <p className="text-sm font-medium">
                  {t("now_using_the_latest_version_of_care")}
                </p>
              </span>
            </div>
          </div>
        </PopoverTrigger>
        <PopoverContent>
          <span>{t("application_successfully_updated")}</span>
        </PopoverContent>
      </Popover>
    </AlertTransition>
  );
};

interface AlertTransitionProps {
  show: boolean;
  children: ReactNode;
}

const AlertTransition = ({ show, children }: AlertTransitionProps) => {
  return (
    <div
      className={cn(
        "fixed left-1/2 top-6 z-50 -translate-x-1/2 transition-transform duration-300",
        show
          ? "opacity-100 scale-100 translate-y-0"
          : "opacity-0 scale-95 -translate-y-10",
      )}
    >
      {children}
    </div>
  );
};
