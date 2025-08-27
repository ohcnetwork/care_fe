import careConfig from "@careConfig";
import {
  DehydratedState,
  hydrate,
  onlineManager,
  useIsRestoring,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { createUserPersister } from "@/OfflineSupport/createUserPersister";

/**
 * Ping backend to confirm reachability.
 * Updates onlineManager state automatically.
 */
export async function checkBackendReachable(): Promise<boolean> {
  try {
    const res = await fetch(careConfig.pingUrl, {
      method: "GET",
    });

    if (!res.ok) {
      return false;
    }

    const data = await res.json();
    const isOnline = data.status === "OK";
    return isOnline;
  } catch {
    return false;
  }
}

const TRANSITION_DELAY = 1000;
const OFFLINE_POLL_INTERVAL = 5000; // Poll every 5s when offline

export default function useNetworkStatus() {
  const [isChecked, setIsChecked] = useState(false);
  const queryClient = useQueryClient();
  const persistor = createUserPersister();
  const isRestoring = useIsRestoring();
  const { t } = useTranslation();

  const currentState = useRef<boolean | null>(null);
  const transitionTimeout = useRef<number | null>(null);
  const offlinePollInterval = useRef<number | null>(null);

  const startOfflinePolling = () => {
    if (!offlinePollInterval.current) {
      offlinePollInterval.current = window.setInterval(async () => {
        const reachable = await checkBackendReachable();
        if (reachable) goOnline();
      }, OFFLINE_POLL_INTERVAL);
    }
  };

  const stopOfflinePolling = () => {
    if (offlinePollInterval.current) {
      clearInterval(offlinePollInterval.current);
      offlinePollInterval.current = null;
    }
  };

  // Restore persisted cache
  const restorePersistedCache = async () => {
    if (!persistor) return;
    const restored = await persistor.restoreClient();
    if (restored?.clientState) {
      queryClient.clear();
      hydrate(queryClient, restored.clientState as DehydratedState);
    }
  };

  // Transition ONLINE
  const goOnline = async () => {
    if (!onlineManager.isOnline()) {
      onlineManager.setOnline(true);
      await restorePersistedCache();
      toast.success(t("welcome_back_you_are_online"));
    }
    setIsChecked(true);

    // Stop offline polling
    stopOfflinePolling();
  };

  // Transition OFFLINE
  const goOffline = async () => {
    if (onlineManager.isOnline()) {
      onlineManager.setOnline(false);
      toast.warning(t("you_are_offline"));
      await restorePersistedCache();
      queryClient.invalidateQueries({ queryKey: ["refresh-token"] });
    }

    startOfflinePolling();
  };

  const setOnlineState = (online: boolean) => {
    if (currentState.current === online) return;

    if (transitionTimeout.current) clearTimeout(transitionTimeout.current);

    transitionTimeout.current = window.setTimeout(() => {
      if (currentState.current !== online) {
        currentState.current = online;
        if (online) goOnline();
        else goOffline();
      }
    }, TRANSITION_DELAY);
  };

  //  Check on mount & on focus
  const updateStatus = async () => {
    const reachable = await checkBackendReachable();
    setOnlineState(reachable);
  };

  useEffect(() => {
    if (!isRestoring) updateStatus();

    // Listen to onlineManager status changes
    const unsubscribe = onlineManager.subscribe((online) => {
      if (!online && !offlinePollInterval.current) {
        startOfflinePolling();
      } else if (online) {
        stopOfflinePolling();
      }
    });

    window.addEventListener("focus", updateStatus);
    return () => {
      window.removeEventListener("focus", updateStatus);
      if (transitionTimeout.current) clearTimeout(transitionTimeout.current);
      stopOfflinePolling();
      unsubscribe();
    };
  }, [isRestoring]);

  // Check if we're already offline and start polling if needed
  useEffect(() => {
    if (!onlineManager.isOnline() && !offlinePollInterval.current) {
      startOfflinePolling();
    }
  }, []);

  return { isChecked, isOnline: onlineManager.isOnline() };
}
