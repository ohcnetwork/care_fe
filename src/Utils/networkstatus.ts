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

export default function useNetworkStatus() {
  const [isChecked, setIsChecked] = useState(false);
  const isRestoring = useIsRestoring();
  const queryClient = useQueryClient();
  const persistor = createUserPersister();
  const { t } = useTranslation();
  const wsRef = useRef<WebSocket | null>(null);
  const messageTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
      toast.success(t("welcome_back_you_are_online"));
      setIsChecked(true);
    }
  };

  const connectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    // Clear existing timers
    if (messageTimerRef.current) {
      clearTimeout(messageTimerRef.current);
    }
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
    }

    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!onlineManager.isOnline()) {
          toast.success(t("welcome_back_you_are_online"));
        }
        onlineManager.setOnline(true);

        setIsChecked(true);

        // Start 8-second timer for message detection
        messageTimerRef.current = setTimeout(() => {
          goOffline();
        }, 8000);

        // Send initial ping
        ws.send("ping");

        // Start sending ping every 5 seconds
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send("ping");
          }
        }, 5000);
      };

      ws.onmessage = () => {
        if (messageTimerRef.current) {
          clearTimeout(messageTimerRef.current);
        }

        messageTimerRef.current = setTimeout(() => {
          goOffline();
        }, 8000);

        // Go online if currently offline (when messages resume)
        if (!onlineManager.isOnline()) {
          goOnline();
        }
      };

      ws.onclose = (event) => {
        // Clear all timers
        if (messageTimerRef.current) {
          clearTimeout(messageTimerRef.current);
        }
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
        }

        // Attempt to reconnect after 5 seconds (unless it's a normal closure)
        if (event.code !== 1000) {
          setTimeout(() => {
            if (!isRestoring) {
              connectWebSocket();
            }
          }, 10000);
        }
      };

      ws.onerror = (_error) => {
        // Clear all timers
        if (messageTimerRef.current) {
          clearTimeout(messageTimerRef.current);
        }
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
        }
      };
    } catch (_error) {
      setIsChecked(true);
    }
  };

  useEffect(() => {
    if (!isRestoring) {
      connectWebSocket();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (messageTimerRef.current) {
        clearTimeout(messageTimerRef.current);
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
    };
  }, [isRestoring]);

  return { isChecked };
}
