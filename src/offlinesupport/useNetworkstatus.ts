import { createContext, useContext } from "react";

interface NetworkStatusContextType {
  isOnline: boolean;
  setIsOnline: (value: boolean) => void;
  getSearchKey: (params: object) => string[];
}

export const NetworkStatusContext = createContext<NetworkStatusContextType>({
  isOnline: true,
  setIsOnline: () => {},
  getSearchKey: () => [],
});

export const useNetworkStatus = () => {
  const ctx = useContext(NetworkStatusContext);
  if (!ctx) {
    throw new Error(
      "'useNetworkStatus' must be used within a 'NetworkStatusProvider'",
    );
  }
  return ctx;
};
