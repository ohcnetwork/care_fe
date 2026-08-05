import type { QuestionnaireResponse } from "@/types/questionnaire/form";
import type { StructuredEditRecord } from "@/types/questionnaire/structured";
import { sanitizeStructuredEditLog } from "@/types/questionnaire/structured";

import type {
  StructuredBatchEntry,
  StructuredRequestContext,
} from "@/components/QuestionnaireV2/structured/types";

/**
 * Sanitized structured edit log: the user intent that compiles into requests
 * and persists in drafts. Missing logs read as empty, malformed entries are
 * dropped, and duplicate row edits collapse to the latest per row id.
 */
export function structuredEditsOf(
  response: QuestionnaireResponse | undefined,
): StructuredEditRecord[] {
  return sanitizeStructuredEditLog(response?.edits);
}

/**
 * Structural subset of a resolved structured type needed for v2 compile,
 * kept registry-free so this module can run in plain tests.
 */
export interface StructuredV2Compiler {
  toRequests: (
    edits: readonly StructuredEditRecord[],
    context: StructuredRequestContext,
  ) => Promise<StructuredBatchEntry[]>;
}

/**
 * Compile structured v2 edits into domain requests. Only clinician edits reach
 * `toRequests`; untouched projected server rows produce no requests, and an
 * empty log short-circuits before calling type code.
 */
export async function composeStructuredV2Requests(
  definition: StructuredV2Compiler,
  response: QuestionnaireResponse,
  context: StructuredRequestContext,
): Promise<StructuredBatchEntry[]> {
  const edits = structuredEditsOf(response);
  if (edits.length === 0) return [];
  return definition.toRequests(edits, context);
}
