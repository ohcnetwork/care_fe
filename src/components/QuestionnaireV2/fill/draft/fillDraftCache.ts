/**
 * The dependency-free half of the local fill-draft layer: key prefix,
 * expiry rule and the sweeps. Login, signOut and the app-update path
 * import THIS module — never `fillDraftStore`, whose registry import
 * would drag every structured component into their chunks.
 */
export const FILL_DRAFT_PREFIX = "care_qn_fill_draft--";

const TTL_MS = 24 * 60 * 60 * 1000;

export function isFillDraftExpired(savedAt: string): boolean {
  const saved = new Date(savedAt).getTime();
  return isNaN(saved) || Date.now() - saved > TTL_MS;
}

/** Prefix sweep — registered at login, logout and app update so draft
 *  data never outlives the session that wrote it. */
export function clearQuestionnaireFillDrafts(): void {
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith(FILL_DRAFT_PREFIX)) localStorage.removeItem(key);
  }
}

/** Drop expired/corrupt drafts (any user) — run on fill page mount. */
export function sweepExpiredFillDrafts(): void {
  for (const key of Object.keys(localStorage)) {
    if (!key.startsWith(FILL_DRAFT_PREFIX)) continue;
    try {
      const draft = JSON.parse(localStorage.getItem(key) ?? "") as {
        savedAt?: string;
      };
      if (!draft.savedAt || isFillDraftExpired(draft.savedAt)) {
        localStorage.removeItem(key);
      }
    } catch {
      localStorage.removeItem(key);
    }
  }
}
