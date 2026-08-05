import { resolveStructuredType } from "@/components/QuestionnaireV2/structured/registry";

import type { QuestionnaireResponse } from "@/types/questionnaire/form";

import type {
  DraftFormSnapshot,
  FillDraftScope,
  FillSessionFormState,
} from "./fillDraftCore";
import * as core from "./fillDraftCore";

/**
 * The local fill draft store as the app uses it: `fillDraftCore` with the
 * structured-type registry wired in. The split exists because the registry
 * pulls the whole structured component tree (and Vite-only config) in, which
 * the core's own gates must not depend on to be testable.
 */
export {
  clearFillDraft,
  loadFillDraft,
  mergeDraftIntoSeed,
  reviveDraftResponses,
} from "./fillDraftCore";
export type {
  DraftFormSnapshot,
  FillDraftScope,
  FillSessionFormState,
  LoadedFillDraft,
} from "./fillDraftCore";

/** See `fillDraftCore.draftResponseForStorage`. */
export function draftResponseForStorage(
  response: QuestionnaireResponse,
): QuestionnaireResponse {
  return core.draftResponseForStorage(response, resolveStructuredType);
}

/** See `fillDraftCore.preserveExcludedStructured`. */
export function preserveExcludedStructured(
  current: Record<string, QuestionnaireResponse>,
  next: Record<string, QuestionnaireResponse>,
): Record<string, QuestionnaireResponse> {
  return core.preserveExcludedStructured(current, next, resolveStructuredType);
}

/** See `fillDraftCore.sessionEditSignature`. */
export function sessionEditSignature(forms: FillSessionFormState[]): string {
  return core.sessionEditSignature(forms, resolveStructuredType);
}

/** See `fillDraftCore.saveFillDraft`. */
export function saveFillDraft(
  scope: FillDraftScope,
  forms: FillSessionFormState[],
  retained: DraftFormSnapshot[] = [],
  mayClear = true,
): boolean {
  return core.saveFillDraft(
    scope,
    forms,
    resolveStructuredType,
    retained,
    mayClear,
  );
}
