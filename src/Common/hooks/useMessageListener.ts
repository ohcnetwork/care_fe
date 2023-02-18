import { useEffect } from "react";

type onMessage = (data: any) => void;

export const useMessageListener = (onMessage: onMessage) => {
  useEffect(() => {
    navigator.serviceWorker.onmessage = (e) => {
      onMessage(e.data);
    };

    return () => {
      navigator.serviceWorker.onmessage = null;
    };
  });
};
