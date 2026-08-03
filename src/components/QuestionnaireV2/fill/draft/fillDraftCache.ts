/**
 * The dependency-free half of the local fill-draft layer: key prefix,
 * expiry rule and the sweeps. signOut, the app-update path and the
 * post-auth-success boundary import THIS module — never `fillDraftStore`,
 * whose registry import would drag every structured component into their
 * chunks.
 *
 * Lifecycle: a fresh login by a DIFFERENT user sweeps every OTHER user's
 * drafts (`clearOtherUsersFillDrafts`) — the just-authenticated user's own
 * drafts survive, since re-login by the same account is the crash/session-
 * expiry recovery this layer exists for. signOut and an app update sweep
 * EVERYTHING (`clearQuestionnaireFillDrafts`) — there is no "same user"
 * exception once a session is deliberately ended. Expired/corrupt drafts,
 * for any user, are swept once at boot regardless of auth outcome
 * (`sweepExpiredFillDrafts`).
 */
export const FILL_DRAFT_PREFIX = "care_qn_fill_draft--";

const TTL_MS = 24 * 60 * 60 * 1000;

export function isFillDraftExpired(savedAt: string): boolean {
  const saved = new Date(savedAt).getTime();
  return isNaN(saved) || Date.now() - saved > TTL_MS;
}

/** Prefix sweep — registered at signOut and app update so draft data
 *  never outlives a deliberately-ended session. */
export function clearQuestionnaireFillDrafts(): void {
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith(FILL_DRAFT_PREFIX)) localStorage.removeItem(key);
  }
}

/**
 * Prefix sweep scoped to every OTHER user — registered at the post-auth-
 * success boundary (JWT sign-in and MFA verification) so a login by a
 * DIFFERENT account on a shared device gets a clean slate, while the
 * just-authenticated user's own draft (e.g. one left at the login form by
 * a session expiry) survives re-login. A key whose userId segment cannot
 * be parsed is treated as untrusted and removed, same as a corrupt entry.
 */
export function clearOtherUsersFillDrafts(currentUserId: string): void {
  for (const key of Object.keys(localStorage)) {
    if (!key.startsWith(FILL_DRAFT_PREFIX)) continue;
    const userId = key.slice(FILL_DRAFT_PREFIX.length).split("--")[0];
    if (!userId || userId !== currentUserId) {
      localStorage.removeItem(key);
    }
  }
}

/** Drop expired/corrupt drafts (any user) — run on fill page mount and at
 *  provider boot, independent of auth outcome. */
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
