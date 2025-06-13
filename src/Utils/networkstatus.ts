import { onlineManager } from "@tanstack/react-query";
import { useEffect, useState } from "react";

const CHECK_URL = "https://careapi.ohc.network";

export default function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [isChecked, setIsChecked] = useState(false);

  const checkConnection = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 4s timeout

      const response = await fetch(CHECK_URL, {
        method: "HEAD",
        cache: "no-store",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const online = response.ok;
      setIsOnline(online);
      onlineManager.setOnline(online);
    } catch {
      setIsOnline(false);
      onlineManager.setOnline(false);
    } finally {
      setIsChecked(true);
    }
  };

  useEffect(() => {
    const handleOffline = () => {
      setIsOnline(false);
      onlineManager.setOnline(false);
      setIsChecked(true);
      console.log("❌ Browser says: offline");
    };

    const handleOnline = () => {
      console.log("🌐 Browser says: online — verifying...");
      checkConnection();
    };

    checkConnection();
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  return { isOnline, isChecked };
}
