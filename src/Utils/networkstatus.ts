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
    const res = await fetch("/ping", { method: "GET" });
    const ok = res.ok;
    onlineManager.setOnline(ok);
    return ok;
  } catch {
    onlineManager.setOnline(false);
    return false;
  }
}

const TRANSITION_DELAY = 1500;
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

  // --- Restore persisted cache ---
  const restorePersistedCache = async () => {
    if (!persistor) return;
    const restored = await persistor.restoreClient();
    if (restored?.clientState) {
      queryClient.clear();
      hydrate(queryClient, restored.clientState as DehydratedState);
    }
  };

  // --- Transition ONLINE ---
  const goOnline = async () => {
    if (!onlineManager.isOnline()) {
      onlineManager.setOnline(true);
      await restorePersistedCache();
      toast.success(t("welcome_back_you_are_online"));
    }
    setIsChecked(true);

    // Stop offline polling
    if (offlinePollInterval.current) {
      clearInterval(offlinePollInterval.current);
      offlinePollInterval.current = null;
    }
  };

  // --- Transition OFFLINE ---
  const goOffline = async () => {
    if (onlineManager.isOnline()) {
      onlineManager.setOnline(false);
      toast.warning(t("you_are_offline"));
      await restorePersistedCache();
      queryClient.invalidateQueries({ queryKey: ["refresh-token"] });
    }

    // Start offline polling
    if (!offlinePollInterval.current) {
      offlinePollInterval.current = window.setInterval(async () => {
        const reachable = await checkBackendReachable();
        if (reachable) goOnline();
      }, OFFLINE_POLL_INTERVAL);
    }
  };

  // --- Debounced setter ---
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

  // --- Check on mount & on focus ---
  const updateStatus = async () => {
    const reachable = await checkBackendReachable();
    setOnlineState(reachable);
  };

  useEffect(() => {
    if (!isRestoring) updateStatus();

    // window.addEventListener("focus", updateStatus);
    return () => {
      ///  window.removeEventListener("focus", updateStatus);
      if (transitionTimeout.current) clearTimeout(transitionTimeout.current);
      if (offlinePollInterval.current)
        clearInterval(offlinePollInterval.current);
    };
  }, [isRestoring]);

  return { isChecked, isOnline: onlineManager.isOnline() };
}
