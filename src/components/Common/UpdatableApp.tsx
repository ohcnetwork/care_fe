import { Popover, Transition } from "@headlessui/react";
import { ReactNode, useEffect, useState } from "react";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";

import { classNames } from "@/Utils/utils";

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
    // Trigger an update if key: 'app-version' not present in localStorage
    // or does not match with metaVersion.
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

    // Service worker cache should be cleared with caches.delete()
    caches.keys().then((names) => names.forEach((name) => caches.delete(name)));

    // A second of delay to appreciate the update animation.
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
  const [isShowing, setIsShowing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsShowing(true), 1000);
  }, []);

  const updateApp = () => {
    setIsUpdating(true);
    onUpdate();
  };

  return (
    <AlertTransition show={isShowing}>
      <Popover className="rounded-xl bg-alert-600 px-5 py-4 text-white shadow-2xl shadow-alert-900">
        <div className="flex items-center gap-4">
          <CareIcon
            icon="l-sync"
            className={classNames(
              "care-l-sync text-2xl",
              isUpdating && "animate-spin",
            )}
          />
          <span className="mr-4 flex flex-col">
            <p className="font-semibold">Software Update</p>
            <p className="text-sm font-medium">
              A new version of CARE is available
            </p>
          </span>
          <Button disabled={isUpdating} onClick={updateApp} variant="alert">
            {isUpdating ? "Updating..." : "Update"}
          </Button>
        </div>
      </Popover>
    </AlertTransition>
  );
};

interface AppUpdatedAlertProps {
  show: boolean;
}

const AppUpdatedAlert = ({ show }: AppUpdatedAlertProps) => {
  return (
    <AlertTransition show={show}>
      <Popover className="rounded-xl bg-primary-500 px-5 py-4 text-white shadow-2xl shadow-primary-500">
        <div className="flex items-center gap-4">
          <CareIcon icon="l-thumbs-up" className="text-2xl" />
          <span className="mr-4 flex flex-col">
            <p className="font-semibold">Updated successfully</p>
            <p className="text-sm font-medium">
              Now using the latest version of CARE
            </p>
          </span>
        </div>
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
    <Transition
      show={show}
      enter="ease-out duration-300"
      enterFrom="opacity-0 scale-95 -translate-y-10"
      enterTo="opacity-100 scale-100 translate-y-0"
      leave="ease-in duration-200"
      leaveFrom="opacity-100 scale-100"
      leaveTo="opacity-0 scale-95"
    >
      <div className="fixed left-1/2 top-6 z-50 -translate-x-1/2">
        {children}
      </div>
    </Transition>
  );
};
