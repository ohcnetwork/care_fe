import { ReactNode, useEffect, useState } from "react";

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
    return meta.version;
  }
};

const UpdatableApp = ({ children }: UpdatableAppProps) => {
  const [hasUpdate, setHasUpdate] = useState<string>();

  useEffect(() => {
    checkForUpdate().then(setHasUpdate);
  }, []);

  const updateApp = () => {
    if (!hasUpdate) return;

    window.location.reload();
    localStorage.setItem(APP_VERSION_KEY, hasUpdate);
  };

  return (
    <div className="absolute">
      {children}
      {hasUpdate && <UpdateAppPopup onUpdate={updateApp} />}
    </div>
  );
};

export default UpdatableApp;

interface UpdateAppPopupProps {
  onUpdate: () => void;
}

const UpdateAppPopup = ({ onUpdate }: UpdateAppPopupProps) => {
  return <div onClick={onUpdate}></div>;
};
