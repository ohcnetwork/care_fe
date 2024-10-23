import { useEffect } from "react";

type onMessage = (data: any) => void;

export const useMessageListener = (onMessage: onMessage) => {
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      onMessage?.(e.data);
    };
    navigator.serviceWorker?.addEventListener?.("message", handleMessage);

    return () => {
      navigator.serviceWorker?.removeEventListener?.("message", handleMessage);
    };
  });
};
