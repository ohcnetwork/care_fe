import { useSyncExternalStore } from "react";

import {
  type UsageSummary,
  getAccountSummary,
  getSessionSummary,
  subscribe,
} from "./usageTracker";

interface UsageSnapshot {
  session: UsageSummary;
  account: UsageSummary;
}

let cachedSnapshot: UsageSnapshot | null = null;

// `useSyncExternalStore` requires `getSnapshot` to return a referentially
// stable value between notifications, so we cache the snapshot object and
// only rebuild it after a notification flips `cachedSnapshot` to `null`.
function getSnapshot(): UsageSnapshot {
  if (!cachedSnapshot) {
    cachedSnapshot = {
      session: { ...getSessionSummary() },
      account: { ...getAccountSummary() },
    };
  }
  return cachedSnapshot;
}

function makeSubscribe(notify: () => void) {
  return subscribe(() => {
    cachedSnapshot = null;
    notify();
  });
}

export function useUsage(): UsageSnapshot {
  return useSyncExternalStore(makeSubscribe, getSnapshot, getSnapshot);
}
