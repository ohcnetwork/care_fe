import { ReactNode, useEffect, useState } from "react";
import { toast } from "sonner";

import { NetworkStatusContext } from "./useNetworkstatus";

const PING_URL = "https://www.cloudflare.com/cdn-cgi/trace";
const OFFLINE_TIMEOUT = 60 * 60 * 1000;

interface NetworkStatusProviderProps {
  children: ReactNode;
}

export const NetworkStatusProvider = ({
  children,
}: NetworkStatusProviderProps) => {
  const getSearchKey = (params: object) => {
    return ["search-patient", JSON.stringify(params)];
  };

  const getInitialIsOnline = () => {
    const storedValue = localStorage.getItem("isOnline");
    return storedValue === null ? true : storedValue === "true";
  };

  const [isOnline, setIsOnlineState] = useState<boolean>(getInitialIsOnline);

  const setIsOnline = (value: boolean) => {
    setIsOnlineState(value);
    localStorage.setItem("isOnline", value.toString());

    if (!value) {
      localStorage.setItem("offlineSince", Date.now().toString());
    } else {
      localStorage.removeItem("offlineSince");
    }
  };

  const checkConnectionToRealServer = async () => {
    try {
      await fetch(PING_URL, { cache: "no-store" });

      const wasOffline = localStorage.getItem("isOnline") === "false";
      const offlineSinceStr = localStorage.getItem("offlineSince");

      if (wasOffline && offlineSinceStr) {
        const offlineSince = parseInt(offlineSinceStr, 10);
        const timeElapsed = Date.now() - offlineSince;

        if (timeElapsed >= OFFLINE_TIMEOUT) {
          setIsOnline(true);

          toast.success("You're back online. Auto-switched to online mode.");
        } else {
          toast.info(" Internet available. Click to  switch to online mode");
        }
      }
    } catch (error) {
      toast.warning("Internet is not available. Remain in offline mode.");
      setIsOnline(false);
      console.log("Error checking connection:", error);
    }
  };

  useEffect(() => {
    checkConnectionToRealServer();
  }, []);

  return (
    <NetworkStatusContext.Provider
      value={{
        isOnline,
        setIsOnline,
        getSearchKey,
      }}
    >
      {children}
    </NetworkStatusContext.Provider>
  );
};
