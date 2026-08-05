import type { ProjectedRow } from "./types";

/**
 * Duplicate guard behind `useStructuredRows`'s `addRow`/`addRows`, kept
 * out of the hook so the hook stays wiring-only.
 *
 * For each `candidate`, decides whether adding it now would collide with
 * an existing key — a currently-visible, non-`softDeleted` row in `rows`,
 * or an EARLIER candidate in this same call already accepted. Returns one
 * boolean per candidate, `true` meaning "duplicate — do not add", in
 * candidate order.
 *
 * `duplicateKey` returning `undefined` means "this row can never
 * duplicate": never flagged, contributes no key to the seen set. A row
 * already marked soft-deleted (entered-in-error) does not block a fresh
 * add of the same key.
 *
 * Checked INCREMENTALLY: each accepted candidate's key joins the seen set
 * before the next is tested, so one batch cannot admit two identical rows.
 *
 * Pure: never mutates `rows` or `candidates`.
 */
export function findDuplicateCandidates<TRow extends object>(
  rows: readonly ProjectedRow<TRow>[],
  duplicateKey: ((row: TRow) => string | undefined) | undefined,
  candidates: readonly TRow[],
): readonly boolean[] {
  if (!duplicateKey) return candidates.map(() => false);

  const seen = new Set<string>();
  for (const entry of rows) {
    if (entry.softDeleted) continue;
    const key = duplicateKey(entry.row);
    if (key !== undefined) seen.add(key);
  }

  return candidates.map((candidate) => {
    const key = duplicateKey(candidate);
    if (key === undefined) return false;
    if (seen.has(key)) return true;
    seen.add(key); // incremental — joins the set before the next candidate
    return false;
  });
}
