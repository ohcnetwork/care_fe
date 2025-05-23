import { toast } from "sonner";

import { OfflineRouteKey, offlineRoutes } from "@/Utils/request/api";
import mutate from "@/Utils/request/mutate";

import { AppCacheDB } from "./dexiepersister";

export const syncOfflineWrites = async (userId: string, isOnline: boolean) => {
  const db = new AppCacheDB();
  console.log("Syncing offline writes...");
  console.log("User ID:", userId);
  if (!isOnline || !userId) return;
  console.log("User is online. Proceeding with sync...");
  const pendingWrites = await db.offlineWrites
    .where("userId")
    .equals(userId)
    .and((w) => w.syncStatus === "pending")
    .toArray();
  console.log("Pending writes:", pendingWrites);
  for (const write of pendingWrites) {
    try {
      const route = offlineRoutes[write.syncrouteKey as OfflineRouteKey];
      const mutationFn = mutate(route, {
        pathParams: write.pathParams as any,
      });

      await mutationFn(write.payload);

      await db.offlineWrites.update(write.id, {
        syncStatus: "success",
        lastAttemptAt: Date.now(),
      });
      toast.success("Sync successful");
    } catch (error: any) {
      toast.error("Sync failed:", error);

      const update: any = {
        syncStatus: "failed",
        lastAttemptAt: Date.now(),
        lastError: error?.message || "Unknown error",
        retries: (write.retries || 0) + 1,
      };

      if (error?.response?.status === 409) {
        update.syncStatus = "conflict";
      }

      await db.offlineWrites.update(write.id, update);
    }
  }
};
