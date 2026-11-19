import { ResponseContext } from "@/types/questionnaire/form";

/** A structured value record (`*Request`) or read record — both carry these. */
export type RecordLike = {
  id?: string;
  dirty?: boolean;
  [key: string]: unknown;
};

// Server-managed audit fields (who/when) that must not count as content drift.
const VOLATILE_FIELDS = new Set([
  "modified_date",
  "created_date",
  "updated_date",
  "recorded_date",
  "created_by",
  "updated_by",
  "modified_by",
]);

// Single-pass deep equality that skips volatile keys inline — no intermediate
// clones, and short-circuits on the first difference.
function deepEqualIgnoringVolatile(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (!a || !b || typeof a !== "object" || typeof b !== "object") return false;

  const aIsArray = Array.isArray(a);
  if (aIsArray !== Array.isArray(b)) return false;

  if (aIsArray) {
    const aa = a as unknown[];
    const bb = b as unknown[];
    if (aa.length !== bb.length) return false;
    for (let i = 0; i < aa.length; i++) {
      if (!deepEqualIgnoringVolatile(aa[i], bb[i])) return false;
    }
    return true;
  }

  const ao = a as Record<string, unknown>;
  const bo = b as Record<string, unknown>;
  let aCount = 0;
  for (const k of Object.keys(ao)) {
    if (VOLATILE_FIELDS.has(k)) continue;
    aCount++;
    if (!deepEqualIgnoringVolatile(ao[k], bo[k])) return false;
  }
  let bCount = 0;
  for (const k of Object.keys(bo)) {
    if (!VOLATILE_FIELDS.has(k)) bCount++;
  }
  return aCount === bCount;
}

export interface ContextDiff {
  matches: boolean;
  added: ResponseContext[]; // in fresh, not in draft
  removed: ResponseContext[]; // in draft, not in fresh
  changed: { id: string; draft: ResponseContext; fresh: ResponseContext }[];
}

/**
 * Compare a draft's saved context snapshot against freshly-fetched context,
 * keyed by record `id`, ignoring volatile server fields. An absent draft
 * snapshot (e.g. a draft saved before the context feature) yields `matches`.
 */
export function diffResponseContext(
  draft: ResponseContext[] | undefined,
  fresh: ResponseContext[] | undefined,
): ContextDiff {
  if (!draft) {
    return { matches: true, added: [], removed: [], changed: [] };
  }
  const freshArr = fresh ?? [];
  const draftById = new Map(draft.map((r) => [r.id, r]));
  const freshById = new Map(freshArr.map((r) => [r.id, r]));

  const added = freshArr.filter((r) => !draftById.has(r.id));
  const removed = draft.filter((r) => !freshById.has(r.id));
  const changed: ContextDiff["changed"] = [];
  for (const [id, d] of draftById) {
    const f = freshById.get(id);
    if (f && !deepEqualIgnoringVolatile(d, f)) {
      changed.push({ id, draft: d, fresh: f });
    }
  }

  return {
    matches: !added.length && !removed.length && !changed.length,
    added,
    removed,
    changed,
  };
}

/**
 * Merge recovered structured values. The draft is authoritative for what the
 * user wants — their edits to existing rows are preserved, and rows they newly
 * added are kept. Fresh context is used only to reconcile with the server:
 * drop draft rows the server deleted, and append rows the server added since
 * the draft was saved.
 *
 * @param draftValues   the draft's structured value rows (edits + new)
 * @param freshValues   the freshly re-seeded value rows (server rows, id-bearing)
 * @param freshContextIds ids currently present on the server (from fresh context)
 */
export function mergeRecoveredValues<T extends RecordLike>(
  draftValues: T[],
  freshValues: T[],
  freshContextIds: Set<string>,
): T[] {
  const draftIds = new Set(
    draftValues.map((v) => v.id).filter((id): id is string => id !== undefined),
  );
  // Keep every draft row that is new (no id) or still exists on the server —
  // this preserves the user's edits to existing rows.
  const kept = draftValues.filter((v) => !v.id || freshContextIds.has(v.id));
  // Append server rows the draft never saw (added since the draft was saved).
  const added = freshValues.filter((v) => v.id && !draftIds.has(v.id));
  return [...kept, ...added];
}
