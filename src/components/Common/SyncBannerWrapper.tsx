import { useSync } from "@/context/SyncContext";

import { SyncBanner } from "./SyncBanner";

export function SyncBannerWrapper() {
  const { isSyncing, syncedCount, totalCount, resetSync } = useSync();

  return (
    <SyncBanner
      isVisible={isSyncing}
      syncedCount={syncedCount}
      totalCount={totalCount}
      onComplete={resetSync}
    />
  );
}
