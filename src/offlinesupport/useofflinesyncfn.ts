import { useEffect } from "react";

import useAuthUser from "@/hooks/useAuthUser";

import { syncOfflineWrites } from "./offlinesync";
import { useNetworkStatus } from "./useNetworkstatus";

export const useSyncOfflineWrites = () => {
  const user = useAuthUser();
  const { isOnline } = useNetworkStatus();

  useEffect(() => {
    console.log("Syncing offline writes useffect triggered");
    console.log("User useffect ID:", user?.external_id);
    if (user?.external_id && isOnline) {
      console.log("User is online. Proceeding with sync useffect");
      syncOfflineWrites(user.external_id, isOnline);
    }
  }, [user?.external_id, isOnline]);
};
