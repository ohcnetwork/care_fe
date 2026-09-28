import type { FillDraftScope } from "./fillDraftCore";
import { fillDraftScopeKey } from "./fillDraftCore";

/**
 * Dependency-free local draft cache helpers: key prefix, expiry and sweeps.
 * Other-user login removes unrelated drafts on shared devices; sign-out
 * removes all drafts; expired or corrupt entries are swept at boot.
 * Software updates and cache maintenance preserve unsaved questionnaire work.
 */
export const FILL_DRAFT_PREFIX = "care_qn_fill_draft--";

export const FILL_DRAFT_TTL_MS = 24 * 60 * 60 * 1000;

let version = 0;
const listeners = new Set<() => void>();

export function getFillDraftsVersion(): number {
  return version;
}

export function notifyFillDraftsChanged(): void {
  version += 1;
  for (const listener of listeners) listener();
}

function handleStorage(event: StorageEvent): void {
  if (event.key === null || event.key.startsWith(FILL_DRAFT_PREFIX)) {
    notifyFillDraftsChanged();
  }
}

/** Same-tab mutations notify directly; browser storage events cover other tabs. */
export function subscribeToFillDrafts(listener: () => void): () => void {
  if (listeners.size === 0 && typeof window !== "undefined") {
    window.addEventListener("storage", handleStorage);
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && typeof window !== "undefined") {
      window.removeEventListener("storage", handleStorage);
    }
  };
}

export function fillDraftStorageKey(scope: FillDraftScope): string {
  return `${FILL_DRAFT_PREFIX}${fillDraftScopeKey(scope)}`;
}

export function fillDraftStorageKeys(): string[] {
  try {
    return Object.keys(localStorage).filter((key) =>
      key.startsWith(FILL_DRAFT_PREFIX),
    );
  } catch {
    return [];
  }
}

export function writeFillDraftCache(
  scope: FillDraftScope,
  serialized: string,
): boolean {
  try {
    localStorage.setItem(fillDraftStorageKey(scope), serialized);
    notifyFillDraftsChanged();
    return true;
  } catch {
    return false;
  }
}

function removeKey(key: string): boolean {
  if (localStorage.getItem(key) === null) return false;
  localStorage.removeItem(key);
  return true;
}

/** Idempotent scoped removal. False means storage could not be accessed. */
export function removeFillDraftCache(scope: FillDraftScope): boolean {
  try {
    if (removeKey(fillDraftStorageKey(scope))) notifyFillDraftsChanged();
    return true;
  } catch {
    return false;
  }
}

function removeMatchingDrafts(matches: (key: string) => boolean): void {
  let changed = false;
  for (const key of fillDraftStorageKeys()) {
    try {
      if (matches(key)) changed = removeKey(key) || changed;
    } catch {
      // Storage is best-effort and must not block authentication or app boot.
    }
  }
  if (changed) notifyFillDraftsChanged();
}

export function isFillDraftExpired(savedAt: string): boolean {
  const saved = new Date(savedAt).getTime();
  return isNaN(saved) || Date.now() - saved > FILL_DRAFT_TTL_MS;
}

/** Prefix sweep on sign-out, when the user deliberately ends their session. */
export function clearQuestionnaireFillDrafts(): void {
  removeMatchingDrafts(() => true);
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
  removeMatchingDrafts((key) => {
    const userId = key.slice(FILL_DRAFT_PREFIX.length).split("--")[0];
    return !userId || userId !== currentUserId;
  });
}

/** Drop expired/corrupt drafts (any user) — run on fill page mount and at
 *  provider boot, independent of auth outcome. */
export function sweepExpiredFillDrafts(): void {
  removeMatchingDrafts((key) => {
    try {
      const draft = JSON.parse(localStorage.getItem(key) ?? "") as {
        savedAt?: string;
      };
      return !draft.savedAt || isFillDraftExpired(draft.savedAt);
    } catch {
      return true;
    }
  });
}
