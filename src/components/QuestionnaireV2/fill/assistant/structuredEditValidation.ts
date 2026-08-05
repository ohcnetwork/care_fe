import type { z } from "zod";

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

/**
 * Validates one edit's `patch` against its type's published row schema.
 *
 * FAIL-CLOSED when no schema is published: an unvalidated `unknown`
 * patch entering the edit log has no shape guarantee, and a malformed
 * row can break that type's editor render for the rest of the session —
 * human edits included, since the log is shared. Nothing persists until
 * Save, which makes an assistant write safe to LAND in the log; it is
 * not a reason to skip validating what lands there.
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
