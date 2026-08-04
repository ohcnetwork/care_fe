/**
 * Canonical list of structured question types — the single runtime source
 * the `StructuredQuestionType` union derives from. Lives in the types layer
 * so `src/types/*` never imports from the components tree (the legacy
 * arrangement derived this union from
 * `components/Questionnaire/data/StructuredFormData`, inverting the layer
 * dependency).
 *
 * Adding a type here is step one of the checklist in
 * `src/components/QuestionnaireV2/structured/` — the total registry there
 * refuses to compile until the new member has a definition.
 */
export const STRUCTURED_QUESTION_TYPES = [
  "allergy_intolerance",
  "medication_request",
  "medication_statement",
  "symptom",
  "diagnosis",
  "encounter",
  "time_of_death",
  "files",
  "service_request",
  "charge_item",
  "appointment",
] as const;

export type StructuredQuestionType = (typeof STRUCTURED_QUESTION_TYPES)[number];

/**
 * A structured type contributed at runtime by a federation plugin. Always
 * namespaced `{plugin_slug}.{type_name}` — bare names stay reserved for
 * core, so a plugin can never shadow a built-in type. The template literal
 * documents the shape to the type system; the real gate is
 * `PLUGIN_STRUCTURED_TYPE_PATTERN` below (TS cannot express the character
 * class), enforced at registration and by `isPluginStructuredTypeName`.
 */
export type PluginStructuredTypeName = `${string}.${string}`;

/** The one definition of a well-formed plugin type id. Both the registry's
 *  throw-on-register check and the `isPluginStructuredTypeName` guard read
 *  it, so there is a single source for the rule. */
export const PLUGIN_STRUCTURED_TYPE_PATTERN = /^[a-z0-9_]+\.[a-z0-9_]+$/;

/**
 * What a `structured_type` field may hold: a core type or a plugin one.
 * Keeping the core union as a member means a `switch`/`===` on a core
 * literal still narrows — the template-literal member never swallows it.
 */
export type StructuredTypeValue =
  StructuredQuestionType | PluginStructuredTypeName;

/** Narrows a `structured_type` back to a core member — the guard anything
 *  keyed on the closed core union (a total `Record`, a core-only handler
 *  map) needs now that the field also admits plugin ids. */
export function isCoreStructuredType(
  value: string,
): value is StructuredQuestionType {
  return (STRUCTURED_QUESTION_TYPES as readonly string[]).includes(value);
}

/** Narrows a registered plugin type's id to `PluginStructuredTypeName` —
 *  what a consumer holding the definition's `string` `type` needs to put it
 *  where a `StructuredTypeValue` is expected, without a cast. */
export function isPluginStructuredTypeName(
  value: string,
): value is PluginStructuredTypeName {
  return PLUGIN_STRUCTURED_TYPE_PATTERN.test(value);
}

/**
 * What a clinician DID to a structured section, as opposed to what the
 * section currently shows.
 *
 * The three-way split this belongs to (spec §3): BASELINE is what the
 * server had — owned by the query layer, never written into the response;
 * EDITS are user intent, the only thing drafts persist and the only thing
 * that compiles into requests; PROJECTION is `baseline + edits`, computed
 * for display and parked in `values[0].value` so every existing reader
 * (answered predicate, outline ticks, readonly renderers, server-draft
 * dumps) keeps working untouched.
 *
 * `rowId` is stable and client-owned: the SERVER ID for a row that exists
 * on the server, a uuid for a row the clinician added. It replaces the
 * index-based row identity the legacy widgets used, which is what made
 * Diagnosis' sorted display order disagree with its write-back order.
 *
 * `patch` is the COMPLETE row, not a field diff, for every op:
 *   - `add`    — the new row.
 *   - `update` — the row as it now reads (baseline row with the
 *                clinician's fields applied).
 *   - `remove` — the row as it last read before removal, so the differ can
 *                build an entered-in-error soft-delete body (which for the
 *                upsert-style endpoints is a whole datapoint, not an id).
 * Full rows are what let `toRequests(edits, ctx)` be genuinely
 * self-sufficient: `composeBatch` stays a pure function with no access to
 * the TanStack cache, and a draft restored after a failed baseline fetch
 * still carries everything a submit needs.
 */
export type StructuredEditOp = "add" | "update" | "remove";

export interface StructuredEdit<TRow> {
  /** Server id for a row that exists on the server; uuid for an add. */
  rowId: string;
  op: StructuredEditOp;
  patch: TRow;
}

/**
 * The type-erased edit, as it is stored on a `QuestionnaireResponse`, in a
 * local draft and in a server draft's `response_dump`. A row shape is
 * opaque outside its own type module — the same honesty `unknown[]` buys
 * `ResolvedStructuredType`'s data reads — so `patch` widens to `unknown`
 * and the ONE sanctioned narrowing back happens at the registry boundary,
 * where key-correlation already guarantees the pairing.
 */
export type StructuredEditRecord = StructuredEdit<unknown>;

const STRUCTURED_EDIT_OPS: readonly string[] = ["add", "update", "remove"];

/** Is this parsed-JSON value a well-formed edit? Drafts and server dumps
 *  are untrusted blobs (a hand-edited localStorage entry, a dump written
 *  by an older build), and a malformed entry reaching a type's differ
 *  would surface as a batch 400 after everything was typed in. `patch` is
 *  deliberately NOT checked here — only the type's own zod row schema can
 *  judge it (spec §6 A2), and `toRequests` already runs inside
 *  `StructuredBuildError`'s containment boundary. */
export function isStructuredEditRecord(
  value: unknown,
): value is StructuredEditRecord {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as { rowId?: unknown; op?: unknown };
  return (
    typeof candidate.rowId === "string" &&
    candidate.rowId.length > 0 &&
    typeof candidate.op === "string" &&
    STRUCTURED_EDIT_OPS.includes(candidate.op)
  );
}

/**
 * The ingestion-boundary gate for a raw, untrusted edit log (master plan
 * "Carry-forwards out of Phase 1" item 1). Drops malformed entries (per
 * {@link isStructuredEditRecord}) and — the carry-forward's actual
 * subject — collapses a **duplicate `rowId`** to its LAST entry's content,
 * kept at its FIRST entry's position.
 *
 * WHY THIS EXISTS. `structured/core/changes.ts`'s `resolveChanges`
 * dispatches a rowId at its FIRST log position (content resolved from a
 * last-write-wins map); `structured/core/projectRows.ts`'s added-rows loop
 * instead surfaces a rowId at the position of whichever entry the SAME
 * last-write map happens to hold (its LAST occurrence in a duplicated log),
 * because it walks `log` directly rather than a pre-deduplicated view. For
 * a log with at most one entry per `rowId` — the only shape
 * `editLog.ts`'s `applyEditToLog` can ever build — first and last
 * occurrence are the same position, so the two loops always agree. They
 * stop agreeing only for a log with more than one entry sharing a `rowId`,
 * which is reachable exclusively through an untrusted source (a
 * hand-edited `localStorage` draft, a server dump written by an older
 * build) — never through the reducer (`structured/types/appointment/
 * model.test.ts`'s former "KNOWN GAP" case, now closed, pins exactly this:
 * a doubly-malformed log made `projectRows` and `resolveChanges` pick two
 * different rows).
 *
 * Reconciling the two loops' internal ORDERING rules would mean touching
 * two independently reviewed, heavily hardened modules to handle a shape
 * neither can legitimately produce on its own. The honest fix is upstream
 * of both: never hand either loop a log with more than one entry per
 * `rowId` in the first place. This function is that gate. Call it wherever
 * an untrusted log enters either path — `structured/core/
 * useStructuredRows.ts`'s `edits` derivation (feeds `projectRows`) and
 * `fill/submit/composeStructured.ts`'s `structuredEditsOf` (feeds
 * `resolveChanges`, via `toRequests`) both do — so a doubly-malformed
 * input is reduced to a well-formed one (at most one entry per `rowId`)
 * before either loop ever sees it, and the two loops' historical
 * disagreement becomes unreachable through any real ingestion path.
 *
 * Order preserved is Map insertion order: re-`set`ting an existing key
 * updates its value without moving its position, so a duplicated rowId's
 * surviving entry sits at its FIRST occurrence — matching
 * `resolveChanges`' own dispatch position by construction, not by
 * coincidence.
 */
export function sanitizeStructuredEditLog(
  raw: unknown,
): StructuredEditRecord[] {
  if (!Array.isArray(raw)) return [];
  const byRowId = new Map<string, StructuredEditRecord>();
  for (const entry of raw) {
    if (!isStructuredEditRecord(entry)) continue;
    byRowId.set(entry.rowId, entry);
  }
  return [...byRowId.values()];
}
