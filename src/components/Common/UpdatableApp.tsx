import { ReactNode } from "react";

import { useAppUpdates } from "@/hooks/useAppUpdates";

const META_URL = "/build-meta.json";
const APP_VERSION_KEY = "app-version";
const APP_UPDATED_KEY = "app-updated";

interface UpdatableAppProps {
  children: ReactNode;
  silentlyAutoUpdate?: boolean;
  onDismissUpdateToast?: () => void;
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
    localStorage.removeItem(APP_UPDATED_KEY);
    return meta.version as string;
  }
};

const UpdatableApp = ({
  children,
  silentlyAutoUpdate,
  onDismissUpdateToast,
}: UpdatableAppProps) => {
  useAppUpdates(silentlyAutoUpdate, onDismissUpdateToast);
  return children;
};

export default UpdatableApp;
