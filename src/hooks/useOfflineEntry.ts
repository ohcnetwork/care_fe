import { useQueryParams } from "raviger";
import { useEffect, useState } from "react";

import { AppCacheDB, OfflineWritesEntry } from "@/OfflineSupport/AppcacheDB";

export function useOfflineEntry() {
  const [{ offlineEntryId }] = useQueryParams();
  const [offlineEntry, setOfflineEntry] = useState<OfflineWritesEntry | null>(
    null,
  );
  const [isLoadingOfflineEntry, setIsLoadingOfflineEntry] = useState(false);
  const db = new AppCacheDB();

  useEffect(() => {
    if (offlineEntryId) {
      const loadOfflineEntry = async () => {
        setIsLoadingOfflineEntry(true);
        try {
          const entry = await db.OfflineWrites.get(offlineEntryId);

          if (entry) {
            setOfflineEntry(entry);
          }
        } catch (error) {
          console.error("Error loading offline entry:", error);
        } finally {
          setIsLoadingOfflineEntry(false);
        }
      };
      loadOfflineEntry();
    } else {
      setOfflineEntry(null);
      setIsLoadingOfflineEntry(false);
    }
  }, [offlineEntryId]);

  return {
    offlineEntryId,
    offlineEntry,
    isLoadingOfflineEntry,
  };
}
