import type {
  StructuredEditOp,
  StructuredEditRecord,
  StructuredQuestionType,
} from "@/types/questionnaire/structured";

/**
 * Which rows of a structured question an assistant edit may name, and
 * which ops that question's type actually compiles.
 *
 * The session-level handle never sees a question's fetched baseline — that
 * lives inside the mounted editor's `useStructuredRows`. What it does see
 * is the projection (`baseline + edits`, content only), and every upsert
 * type keys a baseline row by the SERVER id while carrying that same id in
 * the row content (`toBaselineRows` and its `toXRow` in each type's
 * `model.ts`). So a baseline row's identity is recoverable from the
 * content, and a row this session added carries no id until it is saved.
 *
 * Dependency-free (`import type` only) so `node --test` can exercise it
 * directly — see `rowAddressing.test.ts`.
 */

export interface StructuredRowAddressing {
  /** Rows an `update`/`remove` may name: this question's baseline rows
   *  plus everything the pending edit log already carries. */
  rowIds: readonly string[];
  /** The ops this type turns into a request, or honors as an undo of a
   *  row it has not saved yet. ABSENT means the full shipped vocabulary —
   *  what a list type, whose `toRequests` reads all three of
   *  `resolveChanges`' sets, accepts. Present only where a type drops one:
   *  an op it never compiles is a write the caller is told succeeded that
   *  changes the form without changing the record. */
  ops?: readonly StructuredEditOp[];
  /** Set only for a type whose `toRequests` compiles ONE fixed rowId and
   *  silently discards every other — no op may name anything else. */
  requiredRowId?: string;
}

/** `encounter` is the one core type whose baseline row is keyed by an id
 *  the row content does not carry (the encounter id in its PUT URL —
 *  `types/encounter/model.ts`'s `toBaselineRows`) and whose `toRequests`
 *  filters the log down to that exact id. An edit recorded under any other
 *  rowId — the `"singleton"` convention included — renders, dirties the
 *  form, rides into the draft, and then submits nothing. */
const ENCOUNTER_TYPE: StructuredQuestionType = "encounter";

/**
 * `encounter` has no remove verb at all: there is no delete endpoint, its
 * `toRequests` builds its PUT from `updates[0] ?? creates[0]` and never
 * reads `removes`, and no editor gesture records one. A recorded `remove`
 * would hide the baseline row from `projectRows`, un-rendering the whole
 * section (`EncounterEditor` returns `null` with no row), while submitting
 * nothing and leaving the form dirty.
 *
 * The other single-row types keep the full vocabulary, checked the same
 * way: `time_of_death` and `appointment` are create-only, so the only
 * rowId a `remove` can name is one of their own pending adds
 * (`resolveRowAddressing` addresses nothing else for them) — which
 * `applyEditToLog` annihilates, exactly the clear gesture `clearRow`
 * performs for a clinician.
 */
const ENCOUNTER_OPS: readonly StructuredEditOp[] = ["add", "update"];

export function resolveRowAddressing(input: {
  type: string;
  projection: readonly unknown[];
  pendingEdits: readonly StructuredEditRecord[];
  encounterId: string | undefined;
}): StructuredRowAddressing {
  const { type, projection, pendingEdits, encounterId } = input;
  if (type === ENCOUNTER_TYPE) {
    // No encounter in context: `toRequests` returns [] before it reads the
    // log at all, so no op compiles — including the `add` that needs no
    // rowId to prove.
    if (!encounterId) return { rowIds: [], ops: [] };
    return {
      rowIds: [encounterId],
      ops: ENCOUNTER_OPS,
      requiredRowId: encounterId,
    };
  }
  return {
    rowIds: [
      ...new Set([
        ...baselineRowIds(projection, sessionRowIds(pendingEdits)),
        ...pendingEdits.map((edit) => edit.rowId),
      ]),
    ],
  };
}

/** The server id a row's CONTENT carries, if any — the one reading of
 *  `id` this module and the edit gate share. */
export function rowIdOf(row: unknown): string | undefined {
  if (!row || typeof row !== "object") return undefined;
  const id = (row as { id?: unknown }).id;
  return typeof id === "string" && id ? id : undefined;
}

/** Ids carried by rows this session CREATED. The projection is not purely
 *  baseline-derived — `projectRows` renders an `add`'s patch verbatim, and
 *  every upsert row schema declares `id` as optional — so an id that
 *  arrived on an add patch proves nothing about the server. Their `rowId`s
 *  are unioned back in below, so excluding these can never cost a real
 *  baseline row its addressability. */
function sessionRowIds(
  pendingEdits: readonly StructuredEditRecord[],
): ReadonlySet<string> {
  const ids = new Set<string>();
  for (const edit of pendingEdits) {
    if (edit.op !== "add") continue;
    const id = rowIdOf(edit.patch);
    if (id) ids.add(id);
  }
  return ids;
}

/** The server ids the projection proves this question already holds.
 *  A type whose row content carried an `id` that is NOT its baseline key
 *  would make that id addressable and the resulting edit an orphan — the
 *  two must stay in sync, as every shipped `toBaselineRows` keeps them. */
function baselineRowIds(
  projection: readonly unknown[],
  sessionIds: ReadonlySet<string>,
): string[] {
  const ids: string[] = [];
  for (const row of projection) {
    const id = rowIdOf(row);
    if (id && !sessionIds.has(id)) ids.push(id);
  }
  return ids;
}
