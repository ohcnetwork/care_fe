import { useEffect, useMemo, useSyncExternalStore } from "react";

import {
  FILL_DRAFT_TTL_MS,
  getFillDraftsVersion,
  notifyFillDraftsChanged,
  subscribeToFillDrafts,
} from "./fillDraftCache";
import { listLocalFillDrafts } from "./fillDraftList";

const serverSnapshot = () => 0;

export function useLocalFillDrafts(userId: string, subjectKey: string) {
  const version = useSyncExternalStore(
    subscribeToFillDrafts,
    getFillDraftsVersion,
    serverSnapshot,
  );
  const drafts = useMemo(
    () => listLocalFillDrafts(userId, subjectKey),
    [userId, subjectKey, version],
  );

  useEffect(() => {
    if (!drafts.length) return;
    const expiresAt = Math.min(
      ...drafts.map((draft) => Date.parse(draft.savedAt) + FILL_DRAFT_TTL_MS),
    );
    const timeout = setTimeout(
      notifyFillDraftsChanged,
      Math.min(2 ** 31 - 1, Math.max(1, expiresAt - Date.now() + 1)),
    );
    return () => clearTimeout(timeout);
  }, [drafts]);

  return drafts;
}
