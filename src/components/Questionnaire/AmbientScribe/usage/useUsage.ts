import { useSyncExternalStore } from "react";

import {
  type LogEntry,
  type UsageRecord,
  type UsageSummary,
  getAccountSummary,
  getLogs,
  getRecentCalls,
  getSessionSummary,
  subscribe,
} from "./usageTracker";

interface UsageSnapshot {
  session: UsageSummary;
  account: UsageSummary;
  recentCalls: UsageRecord[];
  logs: LogEntry[];
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
      // Slice so the toolbar gets a fresh array reference per snapshot —
      // important for `useSyncExternalStore` change detection.
      recentCalls: getRecentCalls().slice(),
      logs: getLogs().slice(),
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
