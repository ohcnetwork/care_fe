import { t } from "i18next";
import { useState } from "react";

const usePreferredMediaDevice = () => {
  const [preferredDeviceId, setPreferredDeviceId] = useState<string | null>(
    () => {
      if (typeof window !== "undefined") {
        return localStorage.getItem("preferredDeviceId");
      }
      return null;
    },
  );

  const setDeviceId = (deviceId: string) => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("preferredDeviceId", deviceId);
      } catch {
        throw new Error(t("failed_to_save_preferred_device_to_localstorage"));
      }
    }
    setPreferredDeviceId(deviceId);
  };

  return {
    preferredDeviceId,
    setDeviceId,
  };
};

export default usePreferredMediaDevice;
