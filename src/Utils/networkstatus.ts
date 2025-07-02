import {
  DehydratedState,
  hydrate,
  onlineManager,
  useIsRestoring,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { createUserPersister } from "@/OfflineSupport/createUserPersister";

const CHECK_URL = "https://careapi.ohc.network";

export default function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [isChecked, setIsChecked] = useState(false);
  const isRestoring = useIsRestoring();
  const queryClient = useQueryClient();
  const persistor = createUserPersister();
  const cancelNonSuccessQueries = async () => {
    queryClient
      .getQueryCache()
      .getAll()
      .forEach((query) => {
        queryClient.cancelQueries({ queryKey: query.queryKey });
      });
  };

  const restorePersistedCache = async () => {
    if (!persistor) return;
    const restored = await persistor.restoreClient();

    if (restored?.clientState) {
      queryClient.clear();
      hydrate(queryClient, restored.clientState as DehydratedState);
    }
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
      if (!onlineManager.isOnline()) {
        await cancelNonSuccessQueries();
      }

      setIsOnline(online);
      onlineManager.setOnline(online);
      console.log("inavlidate user refrsh toker befoe");
      await queryClient.invalidateQueries({ queryKey: ["user-refresh-token"] });
      console.log("inavlidate user refrsh toker after");
    } catch {
      setIsOnline(false);
      console.log("❌ HEAD fetch failed:");
      onlineManager.setOnline(false);
      await restorePersistedCache();
    } finally {
      setIsChecked(true);
    }
  };

  useEffect(() => {
    if (!isRestoring) {
      checkConnection();
    }

    const handleOffline = async () => {
      setIsOnline(false);
      onlineManager.setOnline(false);
      setIsChecked(true);
      await restorePersistedCache();
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
