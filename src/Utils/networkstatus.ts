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

const WS_URL = "wss://echo-websocket.fly.dev/";

// CONFIG: tune based on tolerance
const PING_INTERVAL = 5000; // send ping every 5s
const OFFLINE_THRESHOLD = 2; // declare offline after 2 missed pings (~10s)

export default function useNetworkStatus() {
  const [isChecked, setIsChecked] = useState(false);
  const isRestoring = useIsRestoring();
  const queryClient = useQueryClient();
  const persistor = createUserPersister();
  const { t } = useTranslation();

  const wsRef = useRef<WebSocket | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Track missed heartbeats
  const missedPings = useRef(0);

  const restorePersistedCache = async () => {
    if (!persistor) return;
    const restored = await persistor.restoreClient();

    if (restored?.clientState) {
      queryClient.clear();
      hydrate(queryClient, restored.clientState as DehydratedState);
    }
  };

  const goOffline = async () => {
    if (onlineManager.isOnline()) {
      onlineManager.setOnline(false);
      toast.warning(t("you_are_offline"));
      await restorePersistedCache();
      queryClient.invalidateQueries({
        queryKey: ["refresh-token"],
      });
    }
  };

  const goOnline = async () => {
    if (!onlineManager.isOnline()) {
      onlineManager.setOnline(true);
      await restorePersistedCache();
      toast.success(t("welcome_back_you_are_online"));
    }
    setIsChecked(true);
  };

  const connectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
    }

    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = async () => {
        missedPings.current = 0;
        goOnline();

        // Start heartbeat
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            try {
              ws.send("ping");
              missedPings.current += 1;

              // if too many missed → offline
              if (missedPings.current >= OFFLINE_THRESHOLD) {
                goOffline();
              }
            } catch {
              goOffline();
            }
          }
        }, PING_INTERVAL);
      };

      ws.onmessage = () => {
        // reset missed count when we get any response
        missedPings.current = 0;
        goOnline();
      };

      ws.onclose = () => {
        clearInterval(pingIntervalRef.current!);
        pingIntervalRef.current = null;
        goOffline();

        // retry connect after backoff
        setTimeout(() => {
          if (!isRestoring) connectWebSocket();
        }, 5000);
      };

      ws.onerror = () => {
        goOffline();
      };
    } catch {
      setIsChecked(true);
    }
  };

  // Visibility handling (browser throttling fix)
  useEffect(() => {
    const handleVisibility = () => {
      if (!document.hidden && wsRef.current?.readyState !== WebSocket.OPEN) {
        connectWebSocket();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  useEffect(() => {
    if (!isRestoring) {
      connectWebSocket();
    }
    return () => {
      wsRef.current?.close();
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
    };
  }, [isRestoring]);

  return { isChecked };
}
