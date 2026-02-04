import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";

import careConfig from "@careConfig";

import {
  AppVersionInfo,
  fetchBuildMeta,
  getStoredVersionInfo,
  performAppUpdate,
  setStoredVersionInfo,
} from "@/lib/appVersion";

interface UseAppVersionReturn {
  /** Current stored version info (version + lastUpdatedAt) */
  versionInfo: AppVersionInfo | null;
  /** Whether an update is available but waiting for user confirmation */
  pendingUpdate: string | null;
  /** Whether a version check is in progress */
  isChecking: boolean;
  /** Manually trigger an update check. Returns true if update is available. */
  checkForUpdate: () => Promise<boolean>;
  /** Apply the pending update (clears caches and reloads) */
  updateApp: () => Promise<void>;
}

/**
 * Hook for managing app version updates with React Query.
 *
 * On initial mount:
 * - If no stored version (first visit): stores current version without reload
 * - If stored version differs from server: auto-updates (clears caches + reloads)
 *
 * On subsequent polling checks:
 * - If version differs: sets pendingUpdate state (user must confirm)
 */
export function useAppVersion(): UseAppVersionReturn {
  const queryClient = useQueryClient();
  const isInitialCheckRef = useRef(true);
  const [pendingUpdate, setPendingUpdate] = useState<string | null>(null);
  const [versionInfo, setVersionInfo] = useState<AppVersionInfo | null>(() =>
    getStoredVersionInfo(),
  );

  const { data, isFetching, refetch } = useQuery({
    queryKey: ["build-meta"],
    queryFn: fetchBuildMeta,
    refetchInterval: careConfig.appUpdateCheckInterval,
    refetchIntervalInBackground: false,
    retry: false,
    staleTime: careConfig.appUpdateCheckInterval,
  });

  useEffect(() => {
    if (!data?.version) return;

    const storedInfo = getStoredVersionInfo();
    const isInitial = isInitialCheckRef.current;
    isInitialCheckRef.current = false;

    // First visit: store version without reload
    if (!storedInfo) {
      const newInfo: AppVersionInfo = {
        version: data.version,
        lastUpdatedAt: new Date().toISOString(),
      };
      setStoredVersionInfo(newInfo);
      setVersionInfo(newInfo);
      return;
    }

    // Version matches: no update needed
    if (storedInfo.version === data.version) {
      return;
    }

    // Version differs
    if (isInitial) {
      // Initial check: auto-update
      performAppUpdate(data.version);
    } else {
      // Polling check: notify user, wait for confirmation
      setPendingUpdate(data.version);
    }
  }, [data?.version]);

  const checkForUpdate = useCallback(async (): Promise<boolean> => {
    // Invalidate and refetch to get fresh data
    await queryClient.invalidateQueries({ queryKey: ["build-meta"] });
    const result = await refetch();
    const fetchedVersion = result.data?.version;
    if (
      fetchedVersion &&
      versionInfo &&
      fetchedVersion !== versionInfo.version
    ) {
      setPendingUpdate(fetchedVersion);
      return true;
    }
    return false;
  }, [queryClient, refetch, versionInfo]);

  const updateApp = useCallback(async () => {
    if (pendingUpdate) {
      await performAppUpdate(pendingUpdate);
    }
  }, [pendingUpdate]);

  return {
    versionInfo,
    pendingUpdate,
    isChecking: isFetching,
    checkForUpdate,
    updateApp,
  };
}
