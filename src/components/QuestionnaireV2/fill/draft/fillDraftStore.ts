import { entryHasContent } from "@/components/QuestionnaireV2/renderer/store";
import { STRUCTURED_TYPE_REGISTRY } from "@/components/QuestionnaireV2/structured/registry";

import type { QuestionnaireResponse } from "@/types/questionnaire/form";

import { FILL_DRAFT_PREFIX, isFillDraftExpired } from "./fillDraftCache";

/**
 * Local fill drafts — the crash/reload safety net. Draft data lives in
 * localStorage only under this prefix, scoped per user + subject +
 * questionnaire, TTL-bounded, and swept on login, logout and app update —
 * every eviction hook is deliberate; a new session boundary must join the
 * sweep list.
 */
const SCHEMA_VERSION = 1;

export interface FillDraftScope {
  userId: string;
  /** encounterId when encounter-bound, else patientId. */
  subjectKey: string;
  questionnaireId: string;
  /** `QuestionnaireRead.version` — a version bump invalidates the draft
   *  (the read spec exposes no modified_date yet). */
  questionnaireVersion: string;
}

interface StoredFillDraft {
  schemaVersion: number;
  savedAt: string;
  userId: string;
  questionnaireId: string;
  questionnaireVersion: string;
  subjectKey: string;
  responses: Record<string, QuestionnaireResponse>;
  structuredSkipped: boolean;
}

export interface LoadedFillDraft {
  responses: Record<string, QuestionnaireResponse>;
  savedAt: string;
  /** True when the saved session had structured answers the draft could
   *  not carry (draftPolicy "exclude") — the restore bar says so. */
  structuredSkipped: boolean;
}

function draftKey(scope: FillDraftScope): string {
  return `${FILL_DRAFT_PREFIX}${scope.userId}--${scope.subjectKey}--${scope.questionnaireId}`;
}

/**
 * Split responses into draft-safe entries and skipped structured content.
 * Types with `draftPolicy: "exclude"` (every adapted legacy type: their
 * values conflate prefetched server rows with user input, and `files`
 * holds raw File objects) never enter the draft — restoring stale
 * clinical rows and re-upserting them could clobber edits made elsewhere.
 */
function partitionForDraft(responses: Record<string, QuestionnaireResponse>): {
  safe: Record<string, QuestionnaireResponse>;
  structuredSkipped: boolean;
} {
  const safe: Record<string, QuestionnaireResponse> = {};
  let structuredSkipped = false;
  for (const [id, response] of Object.entries(responses)) {
    if (response.structured_type) {
      const policy = STRUCTURED_TYPE_REGISTRY[response.structured_type];
      if (policy.draftPolicy === "exclude") {
        if (response.values.some(entryHasContent)) structuredSkipped = true;
        continue;
      }
    }
    safe[id] = response;
  }
  return { safe, structuredSkipped };
}

/** Persist the working state; an all-empty state removes the key instead
 *  (never store empty drafts — FiltersCache's clean() convention). */
export function saveFillDraft(
  scope: FillDraftScope,
  responses: Record<string, QuestionnaireResponse>,
): void {
  const { safe, structuredSkipped } = partitionForDraft(responses);
  const hasContent = Object.values(safe).some(
    (response) => response.values.some(entryHasContent) || response.note,
  );
  if (!hasContent && !structuredSkipped) {
    clearFillDraft(scope);
    return;
  }
  const draft: StoredFillDraft = {
    schemaVersion: SCHEMA_VERSION,
    savedAt: new Date().toISOString(),
    userId: scope.userId,
    questionnaireId: scope.questionnaireId,
    questionnaireVersion: scope.questionnaireVersion,
    subjectKey: scope.subjectKey,
    responses: safe,
    structuredSkipped,
  };
  try {
    localStorage.setItem(draftKey(scope), JSON.stringify(draft));
  } catch {
    // Quota exceeded / storage disabled — autosave is best-effort.
  }
}

/** JSON round-trips Dates to ISO strings; date/dateTime entries revive to
 *  Date objects so the inputs' discriminant checks keep working. Exported
 *  for the server-draft (`?continue_draft=`) restore path, whose dump went
 *  through the same JSON flattening. */
export function reviveDraftResponses(
  responses: Record<string, QuestionnaireResponse>,
): Record<string, QuestionnaireResponse> {
  for (const response of Object.values(responses)) {
    for (const entry of response.values) {
      // Fresh from JSON.parse the declared Date is actually a string —
      // read through `unknown` at this one boundary.
      const raw = (entry as { value?: unknown }).value;
      if (
        (entry.type === "date" || entry.type === "dateTime") &&
        typeof raw === "string"
      ) {
        const revived = new Date(raw);
        entry.value = isNaN(revived.getTime()) ? undefined : revived;
      }
    }
  }
  return responses;
}

/** Load the draft for this exact scope; anything mismatched, expired or
 *  corrupt is removed and reported absent. */
export function loadFillDraft(
  scope: FillDraftScope,
): LoadedFillDraft | undefined {
  const key = draftKey(scope);
  const raw = localStorage.getItem(key);
  if (!raw) return undefined;
  try {
    const draft = JSON.parse(raw) as StoredFillDraft;
    if (
      draft.schemaVersion !== SCHEMA_VERSION ||
      draft.userId !== scope.userId ||
      draft.subjectKey !== scope.subjectKey ||
      draft.questionnaireId !== scope.questionnaireId ||
      draft.questionnaireVersion !== scope.questionnaireVersion ||
      isFillDraftExpired(draft.savedAt) ||
      typeof draft.responses !== "object" ||
      draft.responses === null
    ) {
      localStorage.removeItem(key);
      return undefined;
    }
    return {
      responses: reviveDraftResponses(draft.responses),
      savedAt: draft.savedAt,
      structuredSkipped: draft.structuredSkipped === true,
    };
  } catch {
    localStorage.removeItem(key);
    return undefined;
  }
}

export function clearFillDraft(scope: FillDraftScope): void {
  localStorage.removeItem(draftKey(scope));
}
