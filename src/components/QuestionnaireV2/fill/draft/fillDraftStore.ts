import {
  entryHasContent,
  initializeResponses,
} from "@/components/QuestionnaireV2/renderer/store";
import { STRUCTURED_TYPE_REGISTRY } from "@/components/QuestionnaireV2/structured/registry";

import type { QuestionnaireResponse } from "@/types/questionnaire/form";
import type { Question } from "@/types/questionnaire/question";
import type { QuestionnaireRead } from "@/types/questionnaire/questionnaire";

import { FILL_DRAFT_PREFIX, isFillDraftExpired } from "./fillDraftCache";

/**
 * Local fill drafts — the crash/reload safety net. Draft data lives in
 * localStorage only under this prefix, scoped per user + subject +
 * entry questionnaire, TTL-bounded, and swept on login, logout and app
 * update — every eviction hook is deliberate; a new session boundary must
 * join the sweep list.
 *
 * One key holds the WHOLE fill session: the route-mounted questionnaire
 * plus every questionnaire added to the same submission.
 */
const SCHEMA_VERSION = 2;

export interface FillDraftScope {
  userId: string;
  /** encounterId when encounter-bound, else patientId. */
  subjectKey: string;
  /** The route-mounted questionnaire's id — the session key. */
  entryQuestionnaireId: string;
}

export interface DraftFormSnapshot {
  questionnaireId: string;
  /** `QuestionnaireRead.version` — a version bump invalidates this form
   *  (the read spec exposes no modified_date yet). */
  questionnaireVersion: string;
  responses: Record<string, QuestionnaireResponse>;
  structuredSkipped: boolean;
}

interface StoredFillDraft {
  schemaVersion: number;
  savedAt: string;
  userId: string;
  subjectKey: string;
  entryQuestionnaireId: string;
  forms: DraftFormSnapshot[];
}

export interface LoadedFillDraft {
  forms: DraftFormSnapshot[];
  savedAt: string;
  /** True when the saved session had structured answers the draft could
   *  not carry (draftPolicy "exclude") — the restore bar says so. */
  structuredSkipped: boolean;
}

function draftKey(scope: FillDraftScope): string {
  return `${FILL_DRAFT_PREFIX}${scope.userId}--${scope.subjectKey}--${scope.entryQuestionnaireId}`;
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

/** The creation-time merge rule, shared by resume paths: draft entries
 *  overlay the fresh seed only when the question still exists with the
 *  same structured_type. */
export function mergeDraftIntoSeed(
  questions: Question[],
  draft: Record<string, QuestionnaireResponse>,
): Record<string, QuestionnaireResponse> {
  const seeded = initializeResponses(questions);
  for (const [id, response] of Object.entries(draft)) {
    const fresh = seeded[id];
    if (fresh && fresh.structured_type === response.structured_type) {
      seeded[id] = { ...response, link_id: fresh.link_id };
    }
  }
  return seeded;
}

/** Persist the working state of every form in the session; an all-empty
 *  session removes the key instead (never store empty drafts —
 *  FiltersCache's clean() convention). */
export function saveFillDraft(
  scope: FillDraftScope,
  forms: Array<{
    questionnaire: QuestionnaireRead;
    responses: Record<string, QuestionnaireResponse>;
  }>,
): void {
  const snapshots: DraftFormSnapshot[] = [];
  let anyContent = false;
  for (const form of forms) {
    const { safe, structuredSkipped } = partitionForDraft(form.responses);
    const hasContent = Object.values(safe).some(
      (response) => response.values.some(entryHasContent) || response.note,
    );
    if (hasContent || structuredSkipped) anyContent = true;
    snapshots.push({
      questionnaireId: form.questionnaire.id,
      questionnaireVersion: String(form.questionnaire.version),
      responses: safe,
      structuredSkipped,
    });
  }
  if (!anyContent) {
    clearFillDraft(scope);
    return;
  }
  const draft: StoredFillDraft = {
    schemaVersion: SCHEMA_VERSION,
    savedAt: new Date().toISOString(),
    userId: scope.userId,
    subjectKey: scope.subjectKey,
    entryQuestionnaireId: scope.entryQuestionnaireId,
    forms: snapshots,
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

/** Load the draft session for this exact scope; anything mismatched,
 *  expired or corrupt is removed and reported absent. Only the PRIMARY
 *  form's version is checked here — added forms are version-checked when
 *  the host re-fetches them on resume. v1 drafts fail the schemaVersion
 *  check and are removed; that is the whole migration. */
export function loadFillDraft(
  scope: FillDraftScope,
  primaryVersion: string,
): LoadedFillDraft | undefined {
  const key = draftKey(scope);
  const raw = localStorage.getItem(key);
  if (!raw) return undefined;
  try {
    const draft = JSON.parse(raw) as StoredFillDraft;
    const primary = draft.forms?.find(
      (form) => form.questionnaireId === scope.entryQuestionnaireId,
    );
    if (
      draft.schemaVersion !== SCHEMA_VERSION ||
      draft.userId !== scope.userId ||
      draft.subjectKey !== scope.subjectKey ||
      draft.entryQuestionnaireId !== scope.entryQuestionnaireId ||
      isFillDraftExpired(draft.savedAt) ||
      !primary ||
      primary.questionnaireVersion !== primaryVersion
    ) {
      localStorage.removeItem(key);
      return undefined;
    }
    for (const form of draft.forms) {
      form.responses = reviveDraftResponses(form.responses);
    }
    return {
      forms: draft.forms,
      savedAt: draft.savedAt,
      structuredSkipped: draft.forms.some((form) => form.structuredSkipped),
    };
  } catch {
    localStorage.removeItem(key);
    return undefined;
  }
}

export function clearFillDraft(scope: FillDraftScope): void {
  localStorage.removeItem(draftKey(scope));
}
