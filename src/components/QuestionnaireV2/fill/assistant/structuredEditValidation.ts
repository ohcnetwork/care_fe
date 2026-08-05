import type { z } from "zod";

import type { StructuredEditOp } from "@/types/questionnaire/structured";

import type { StructuredRowAddressing } from "./rowAddressing";
import { rowIdOf } from "./rowAddressing";

/**
 * Validates assistant structured patches against the type's published row
 * schema before they enter the shared edit log. Schema authors should publish
 * strict zod objects so unknown fields fail instead of being stripped.
 */

/** Duck-typed on purpose — `rowSchema` is a field on
 *  `StructuredTypeDefinition` (`structured/types.ts`) but not on the
 *  `ResolvedStructuredType` view this actually receives; the resolver's
 *  spread carries it through at runtime, and reading it structurally
 *  picks it up without coupling this module to either type. */
interface WithRowSchema {
  rowSchema?: z.ZodType;
}

export function rowSchemaOf(definition: unknown): z.ZodType | undefined {
  if (!definition || typeof definition !== "object") return undefined;
  return (definition as WithRowSchema).rowSchema;
}

export type StructuredPatchValidationResult =
  { ok: true; value: unknown } | { ok: false; error: string };

/** The shipped edit vocabulary, as a runtime list. `op` is typed
 *  `StructuredEditOp` on the handle's input, but the caller is untrusted
 *  JS (a federated plugin, the window test bridge) where the type proves
 *  nothing — and an off-vocabulary op sails through `applyEditToLog` into
 *  the log as an entry nothing projects and `resolveChanges` drops: a
 *  phantom dirty edit that costs the clinician an unsaved-changes prompt
 *  over a no-op. */
const STRUCTURED_EDIT_OPS: readonly StructuredEditOp[] = [
  "add",
  "update",
  "remove",
];

export function isStructuredEditOp(op: string): op is StructuredEditOp {
  return (STRUCTURED_EDIT_OPS as readonly string[]).includes(op);
}

export type StructuredEditTargetResult =
  { ok: true } | { ok: false; error: string };

/** One edit as the gate below reads it. `patch` is the complete row for
 *  every op — the same convention `RowEdit.patch` follows — and is taken
 *  here, before `validateStructuredPatch` sees it, because the identity a
 *  row's content claims is part of what the edit is addressing. */
export interface StructuredEditTarget {
  op: string;
  rowId?: string;
  patch: unknown;
}

/**
 * What an edit is allowed to address — which op, which row — checked
 * before the patch is validated.
 *
 * The op must be one the question's type COMPILES
 * (`StructuredRowAddressing.ops`). An op the type drops is not a harmless
 * no-op: the edit still renders, dirties the form and rides into the
 * autosave draft, and for a type whose baseline row a `remove` hides, the
 * section stops rendering entirely.
 *
 * `update`/`remove` name a row that must already exist — the question's
 * baseline rows and its pending edits, as `resolveRowAddressing`
 * recovers them. A rowId from neither is rejected rather than recorded:
 * `projectRows` would show it while the editor's orphan-prune effect
 * excises it again behind a "rows were dropped" notice, so the caller was
 * told "ok" for a write that vanished.
 *
 * `add` needs no such proof — it CREATES the identity, whether the caller
 * mints one or reuses a create-only type's `"singleton"` convention
 * (`time_of_death`, `appointment`), which coalesces onto that same
 * rowId's existing entry. `requiredRowId` is the exception: a type that
 * compiles exactly one rowId drops every other op, `add` included.
 *
 * What an `add` may NOT do is name a server row in its CONTENT: every
 * upsert row schema declares `id` as optional, and an `id` on a created
 * row is sent verbatim in the upsert datapoint — rewriting whichever
 * record already holds it (the same reason `MedicationRequestEditor`
 * strips the id off a historical row it re-adds). It also makes the id
 * look baseline-derived in the projection, so a follow-up `update` names
 * a row the server never had.
 */
export function checkStructuredEditTarget(
  edit: StructuredEditTarget,
  addressing: StructuredRowAddressing,
): StructuredEditTargetResult {
  const { op, rowId, patch } = edit;
  if (!isStructuredEditOp(op)) {
    return {
      ok: false,
      error: `"${op}" is not a structured edit operation (expected ${STRUCTURED_EDIT_OPS.join(", ")})`,
    };
  }
  const { rowIds, ops, requiredRowId } = addressing;
  if (ops && !ops.includes(op)) {
    const accepted = ops.length
      ? `; it compiles ${ops.join(", ")}`
      : " in its current context";
    return {
      ok: false,
      error: `This question's type does not compile op "${op}"${accepted}; an edit recorded under it changes the form without changing the record`,
    };
  }
  if (requiredRowId !== undefined && rowId !== requiredRowId) {
    return {
      ok: false,
      error: `This question edits exactly one row, "${requiredRowId}"; an edit under any other row id is not submitted`,
    };
  }
  if (op === "add") {
    const claimed = rowIdOf(patch);
    if (claimed !== undefined) {
      return {
        ok: false,
        error: `A new row must not carry an id; "${claimed}" names a record that already exists, and adding a row under it overwrites that record. Use op "update" to change an existing row`,
      };
    }
    return { ok: true };
  }
  if (!rowId) {
    return { ok: false, error: `rowId is required for op "${op}"` };
  }
  if (!rowIds.includes(rowId)) {
    return {
      ok: false,
      error: `No row with id "${rowId}" on this question; ${describeAddressable(rowIds)}`,
    };
  }
  return { ok: true };
}

/** Bounded on purpose: a long-list question (a full medication history)
 *  would otherwise put every server id into one error string. */
const LISTED_ROW_IDS = 20;

function describeAddressable(rowIds: readonly string[]): string {
  if (rowIds.length === 0) {
    return 'it holds no rows yet — use op "add" to record one';
  }
  const listed = rowIds.slice(0, LISTED_ROW_IDS).join(", ");
  const rest =
    rowIds.length > LISTED_ROW_IDS
      ? ` and ${rowIds.length - LISTED_ROW_IDS} more`
      : "";
  return `its rows are ${listed}${rest}`;
}

/** Serialized-size ceiling for one row patch — the structured
 *  counterpart of `coercion.ts`'s `MAX_RESPONSE_TEXT_LENGTH`, and DoS
 *  hardening of the same shape: a row schema bounds a patch's SHAPE, never
 *  its size, and an unbounded one rides the edit log into the local
 *  autosave, where a quota failure costs the whole session its
 *  crash-safety net. */
export const MAX_STRUCTURED_PATCH_CHARS = 100_000;

/**
 * Validates one edit's `patch` against its type's published row schema.
 *
 * FAIL-CLOSED when no schema is published: an unvalidated `unknown`
 * patch entering the edit log has no shape guarantee, and a malformed
 * row can break that type's editor render for the rest of the session —
 * human edits included, since the log is shared. Nothing persists until
 * Save, which makes an assistant write safe to LAND in the log; it is
 * not a reason to skip validating what lands there.
 *
 * The accepted value is returned CLONED: a caller that keeps a reference
 * to the object it passed in must not be able to mutate the row after it
 * has been validated (zod's own output detaches an object schema's own
 * fields, but a `z.unknown()`/`z.custom()` field carries the caller's
 * reference straight through).
 */
export function validateStructuredPatch(
  schema: z.ZodType | undefined,
  patch: unknown,
): StructuredPatchValidationResult {
  if (!schema) {
    return {
      ok: false,
      error:
        "This structured type has not published a row validation schema yet, so the assistant cannot safely write to it",
    };
  }
  const size = serializedSize(patch);
  if (size === undefined) {
    return {
      ok: false,
      error: "This row cannot be stored; it must be JSON-serializable",
    };
  }
  if (size > MAX_STRUCTURED_PATCH_CHARS) {
    return {
      ok: false,
      error: `This row is too large (max ${MAX_STRUCTURED_PATCH_CHARS} characters serialized)`,
    };
  }
  const parsed = schema.safeParse(patch);
  if (!parsed.success) {
    const problems = parsed.error.issues
      .map((issue) => {
        const path = issue.path.join(".");
        return path ? `${path}: ${issue.message}` : issue.message;
      })
      .join("; ");
    return { ok: false, error: `Invalid row: ${problems}` };
  }
  try {
    return { ok: true, value: structuredClone(parsed.data) };
  } catch {
    return {
      ok: false,
      error: "This row cannot be stored; it must be JSON-serializable",
    };
  }
}

/** `undefined` when the value cannot be serialized at all (a cycle, a
 *  `BigInt`) — itself a rejection, since the same value would break the
 *  draft autosave that has to write this log to localStorage. */
function serializedSize(patch: unknown): number | undefined {
  try {
    return JSON.stringify(patch)?.length ?? 0;
  } catch {
    return undefined;
  }
}
