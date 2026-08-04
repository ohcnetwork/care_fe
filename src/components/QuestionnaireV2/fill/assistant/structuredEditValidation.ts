import type { z } from "zod";

/**
 * Structured-write validation — spec §6 A2 / `structured.ts`'s
 * `isStructuredEditRecord` doc comment ("only the type's own zod row
 * schema can judge [a patch]"). A ported type publishes its row schema
 * from `model.ts` (design doc §4: "zod row schema for A2"); this module
 * is the one place that schema is consulted before a patch is folded into
 * the edit log, whether the write came from a human tap or the assistant.
 *
 * SCHEMA AUTHORING NOTE for whoever publishes the first one: use
 * `z.object({...}).strict()`, not a bare `z.object({...})`. Zod's default
 * behavior for an object schema is to silently STRIP unrecognized keys
 * rather than fail `safeParse` — `.strict()` is what actually delivers
 * "unknown fields rejected" (spec §6 A2's own wording). This module
 * parses whatever schema it is given; making an accepted patch's shape
 * exact is the schema author's responsibility, not this choke point's.
 *
 * HONESTY NOTE (batch report, read before wiring a new type to this):
 * checked 2026-08-05 — zero `structured/types/*` module defines a
 * `rowSchema` today (`grep -rl "z.object\\|from \"zod\"" structured/`
 * under `types/` returns nothing). {@link rowSchemaOf} is therefore
 * ALWAYS `undefined` for every currently-ported type, and {@link
 * validateStructuredPatch} ALWAYS rejects (fail-closed, not fail-open —
 * see its own doc comment) until a type publishes one. This is a real,
 * current gap, not a hypothetical: no schema was invented here to paper
 * over it, per this task's own instruction.
 */

/** Duck-typed on purpose — `rowSchema` is not (yet) a field on
 *  `StructuredTypeDefinitionV2`/`ResolvedStructuredType`
 *  (`structured/types.ts`, `structured/registry.ts`), both out of this
 *  task's territory. Reading it structurally means the moment a type
 *  module adds `rowSchema` to its registered definition, this picks it up
 *  with no further change here — nothing to wire twice. */
interface WithRowSchema {
  rowSchema?: z.ZodType;
}

export function rowSchemaOf(definition: unknown): z.ZodType | undefined {
  if (!definition || typeof definition !== "object") return undefined;
  return (definition as WithRowSchema).rowSchema;
}

export type StructuredPatchValidationResult =
  { ok: true; value: unknown } | { ok: false; error: string };

/**
 * Validates one edit's `patch` against its type's published row schema.
 *
 * FAIL-CLOSED when no schema is published, DELIBERATELY — not fail-open.
 * An unvalidated `unknown` patch entering the edit log would render
 * through that type's own component with no shape guarantee at all (a
 * missing required field, a field of the wrong JS type, an extra field
 * the type's `toRequests` doesn't expect) — worse than simply refusing
 * the write, since the edit log is shared with human edits to the same
 * question. "Nothing persists until Save" (D3/A2) is why an assistant
 * write is safe to LAND in the log; it is not a reason to skip validating
 * what lands there, since a malformed row can still break the editor's
 * OWN render for the rest of the session, human edits included.
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
  return { ok: true, value: parsed.data };
}
