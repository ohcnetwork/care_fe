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
        console.error("Failed to save device preference to localStorage");
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
