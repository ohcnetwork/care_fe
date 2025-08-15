import React, { createContext, useCallback, useContext, useState } from "react";

import { syncOfflineRecords } from "@/OfflineSupport/syncmanger";

interface SyncContextType {
  isSyncing: boolean;
  syncedCount: number;
  totalCount: number;
  startSync: (userId: string, facilityId?: string) => Promise<void>;
  resetSync: () => void;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncedCount, setSyncedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [syncInProgress, setSyncInProgress] = useState(false);

  const startSync = useCallback(async (userId: string, facilityId?: string) => {
    if (isSyncing || syncInProgress) return;

    setSyncInProgress(true);
    try {
      await syncOfflineRecords(
        userId,
        (syncedCount, totalCount) => {
          setSyncedCount(syncedCount);
          setTotalCount(totalCount);
        },
        (totalCount) => {
          setIsSyncing(true);
          setSyncedCount(0);
          setTotalCount(totalCount);
        },
        () => {},
        facilityId,
      );
    } catch (error) {
      console.error("Sync failed:", error);
      setIsSyncing(false);
    } finally {
      setSyncInProgress(false);
    }
  }, []);

  const resetSync = useCallback(() => {
    setIsSyncing(false);
    setSyncedCount(0);
    setTotalCount(0);
  }, []);

  return (
    <SyncContext.Provider
      value={{
        isSyncing,
        syncedCount,
        totalCount,
        startSync,
        resetSync,
      }}
    >
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  const context = useContext(SyncContext);
  if (context === undefined) {
    throw new Error("useSync must be used within a SyncProvider");
  }
  return context;
}
