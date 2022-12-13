import { Popover, Transition } from "@headlessui/react";
import { Fragment, ReactNode, useEffect, useState } from "react";
import CareIcon from "../../CAREUI/icons/CareIcon";
import { classNames } from "../../Utils/utils";
import ButtonV2 from "./components/ButtonV2";

const META_URL = "/build-meta.json";
const APP_VERSION_KEY = "app-version";

interface UpdatableAppProps {
  children: ReactNode;
}

const checkForUpdate = async () => {
  const appVersion = localStorage.getItem(APP_VERSION_KEY);

  const res = await fetch(META_URL);

  if (res.status !== 200) {
    console.error(
      `Skipped checking for updates. Failed to fetch '${META_URL}'.`
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

const UpdatableApp = ({ children }: UpdatableAppProps) => {
  const [newVersion, setNewVersion] = useState<string>();

  useEffect(() => {
    checkForUpdate().then(setNewVersion);
  }, []);

  const updateApp = async () => {
    if (!newVersion) return;

    // Service worker cache should be cleared with caches.delete()
    if ("caches" in window) {
      caches.keys().then((names) => names.forEach(caches.delete));
    }

    setTimeout(() => {
      window.location.reload();
      localStorage.setItem(APP_VERSION_KEY, newVersion);
    }, 1000);
  };

  return (
    <div className="relative">
      {children}
      {newVersion && <UpdateAppPopup onUpdate={updateApp} />}
    </div>
  );
};

export default UpdatableApp;

interface UpdateAppPopupProps {
  onUpdate: () => void;
}

const UpdateAppPopup = ({ onUpdate }: UpdateAppPopupProps) => {
  const [show, setShow] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setTimeout(() => setShow(true), 1000);
  }, []);

  const updateApp = () => {
    setIsUpdating(true);
    onUpdate();
  };

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
      <Popover className="z-50 fixed top-6 left-1/2 -translate-x-1/2 bg-alert-600 text-white rounded-xl py-4 px-5 shadow-2xl shadow-alert-900">
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
    </Transition>
  );
};
