import { Popover, Transition } from "@headlessui/react";
import { Fragment, ReactNode, useEffect, useState } from "react";
import CareIcon from "../../CAREUI/icons/CareIcon";
import { classNames } from "../../Utils/utils";
import ButtonV2 from "./components/ButtonV2";

const META_URL = "/build-meta.json";
const APP_VERSION_KEY = "app-version";
const APP_UPDATED_KEY = "app-updated";

interface UpdatableAppProps {
  children: ReactNode;
}

const checkForUpdate = async () => {
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
      `Skipped checking for updates. Failed to fetch '${META_URL}'.`
    );
    return;
  }

  const meta = await res.json();

  if (appVersion === null) {
    // Skip updating since the app potentially is the latest version.
    localStorage.setItem(APP_VERSION_KEY, meta.version);
  }

  if (appVersion !== meta.version) {
    // Trigger an update if key: 'app-version' not present in localStorage
    // or does not match with metaVersion.
    console.info("App can be updated.");
    return meta.version as string;
  }
};

const UpdatableApp = ({ children }: UpdatableAppProps) => {
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
    if ("caches" in window) {
      caches.keys().then((names) => names.forEach(caches.delete));
    }

    // A second of delay to appreciate the update animation.
    setTimeout(() => {
      localStorage.setItem(APP_UPDATED_KEY, "true");
      window.location.reload();
      localStorage.setItem(APP_VERSION_KEY, newVersion);
    }, 1000);
  };

  return (
    <div className="relative">
      {children}
      {newVersion && <UpdateAppPopup onUpdate={updateApp} />}
      <AppUpdatedAlert show={appUpdated && !newVersion} />
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
      <Popover className="bg-alert-600 text-white rounded-xl py-4 px-5 shadow-2xl shadow-alert-900">
        <div className="flex items-center gap-4">
          <CareIcon
            className={classNames(
              "care-l-sync text-2xl",
              isUpdating && "animate-spin"
            )}
          />
          <span className="mr-4 flex flex-col">
            <p className="font-semibold">Software Update</p>
            <p className="font-medium text-sm">
              A new version of CARE is available
            </p>
          </span>
          <ButtonV2
            disabled={isUpdating}
            onClick={updateApp}
            variant="alert"
            className="bg-alert-500 enabled:hover:bg-alert-400"
          >
            {isUpdating ? "Updating..." : "Update"}
          </ButtonV2>
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
      <Popover className="bg-primary-500 text-white rounded-xl py-4 px-5 shadow-2xl shadow-primary-500">
        <div className="flex items-center gap-4">
          <CareIcon className="care-l-thumbs-up text-2xl" />
          <span className="mr-4 flex flex-col">
            <p className="font-semibold">Updated successfully</p>
            <p className="font-medium text-sm">
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
      as={Fragment}
      enter="ease-out duration-300"
      enterFrom="opacity-0 scale-95 -translate-y-10"
      enterTo="opacity-100 scale-100 translate-y-0"
      leave="ease-in duration-200"
      leaveFrom="opacity-100 scale-100"
      leaveTo="opacity-0 scale-95"
    >
      <div className="z-50 fixed top-6 left-1/2 -translate-x-1/2">
        {children}
      </div>
    </Transition>
  );
};
