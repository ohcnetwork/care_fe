import { useEffect } from "react";

import useAuthUser from "@/hooks/useAuthUser";

import { syncOfflineWrites } from "./offlinesync";

export const useSyncOfflineWrites = () => {
  const user = useAuthUser();

  useEffect(() => {
    console.log("Syncing offline writes useffect triggered");
    console.log("User useffect ID:", user?.external_id);
    if (user?.external_id && navigator.onLine) {
      console.log("User is online. Proceeding with sync useffect");
      syncOfflineWrites(user.external_id);
    }
  }, [user?.external_id, navigator.onLine]);
};
