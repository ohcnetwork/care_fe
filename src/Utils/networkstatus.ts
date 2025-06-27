import {
  onlineManager,
  useIsRestoring,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect, useState } from "react";

const CHECK_URL = "https://careapi.ohc.network";

export default function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [isChecked, setIsChecked] = useState(false);
  const isRestoring = useIsRestoring();
  const queryClient = useQueryClient();

  const clearPausedQueries = async () => {
    const allQueries = queryClient.getQueryCache().getAll();
    console.log("Checking for paused queries...", allQueries);
    for (const query of allQueries) {
      const { status } = query.state;
      const observersCount = query.getObserversCount();

      const shouldRemove = status !== "success" && observersCount === 0;
      console.log(
        "sttus , observecount",
        status,
        observersCount,
        shouldRemove,
        query,
      );
      if (shouldRemove) {
        queryClient.getQueryCache().remove(query);
        console.log("Removed paused query:", query);
      }
      await Promise.resolve();
    }
    console.log(
      "Checking for paused queries after removing",
      queryClient.getQueryCache().getAll(),
    );
  };

  const checkConnection = async () => {
    if (isRestoring) return;
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
      await clearPausedQueries();
      setIsOnline(online);
      onlineManager.setOnline(online);
    } catch {
      setIsOnline(false);
      console.log("❌ HEAD fetch failed:");
      onlineManager.setOnline(false);
    } finally {
      setIsChecked(true);
    }
  };

  useEffect(() => {
    if (!isRestoring) {
      checkConnection();
    }

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

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, [isRestoring]);

  return { isOnline, isChecked };
}
