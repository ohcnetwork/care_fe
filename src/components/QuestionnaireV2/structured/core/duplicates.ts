import type { ProjectedRow } from "./types";

/**
 * §8's duplicate guard, extracted so `useStructuredRows`'s `addRow`/
 * `addRows` stay wiring-only (no branching logic in the hook file — see
 * `useStructuredRows.ts`'s file-level doc comment).
 *
 * For each `candidate`, decides whether adding it right now would collide
 * with an existing key — either a currently-visible, non-`softDeleted` row
 * in `rows` (the CURRENT PROJECTION, per annex `p1-state-core.md` §8), or
 * an EARLIER candidate in this same call already marked as accepted.
 * Returns one boolean per candidate, `true` meaning "duplicate — do not
 * add", in the same order as `candidates`.
 *
 * `duplicateKey` returning `undefined` for a row means "this row can never
 * duplicate" (§8) — such a row is never flagged, and never blocks a later
 * candidate either, since it contributes no key to the seen-set.
 *
 * `rows` is filtered to non-`softDeleted` entries before seeding the seen
 * set — `SymptomQuestion.tsx:640`'s `verification_status !==
 * "entered_in_error"` rule, generalized: a row marked entered-in-error no
 * longer blocks a fresh add of the same key.
 *
 * Checked INCREMENTALLY across `candidates` — each accepted candidate's key
 * joins the seen set before the next one is tested — a deliberate
 * divergence from the legacy `HistoricalRecordSelector` flow, which tests
 * every selection against the pre-add list only and therefore lets two
 * identical historical rows in at once (`SymptomQuestion.tsx:776-779`).
 *
 * Pure and total: never mutates `rows` or `candidates`.
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
