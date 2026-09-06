import { entryHasContent } from "@/components/QuestionnaireV2/form/engine/store";
import { resolveStructuredType } from "@/components/QuestionnaireV2/structured/registry";

import type { QuestionnaireResponse } from "@/types/questionnaire/form";
import type { Question } from "@/types/questionnaire/question";
import type { QuestionnaireRead } from "@/types/questionnaire/questionnaire";

import type { DroppedDraftAnswer } from "./draftMerge";
import { draftResponseHasContent, mergeDraftResponses } from "./draftMerge";
import {
  fillDraftStorageKey,
  isFillDraftExpired,
  removeFillDraftCache,
  writeFillDraftCache,
} from "./fillDraftCache";
import type { FillDraftScope } from "./fillDraftCore";
import {
  FILL_DRAFT_SCHEMA_VERSION,
  reviveDraftResponses,
} from "./fillDraftCore";
import {
  draftIntentResponse,
  initializeStructuredResponse,
} from "./structuredDraft";

/**
 * Local fill drafts — the crash/reload safety net. Draft data lives in
 * localStorage only under this prefix, scoped per user + subject + entry
 * questionnaire, TTL-bounded, and swept on another user's login or sign-out.
 * Expired drafts are swept at boot regardless of auth outcome. A user's own
 * drafts survive re-login, software updates and cache maintenance so unsaved
 * work remains recoverable (see `fillDraftCache.ts`).
 *
 * One key holds the WHOLE fill session: the route-mounted questionnaire
 * plus every questionnaire added to the same submission.
 */
export type { FillDraftScope } from "./fillDraftCore";

export interface DraftFormSnapshot {
  questionnaireId: string;
  /** `QuestionnaireRead.version` — a version bump invalidates this form
   *  (the read spec exposes no modified_date yet). */
  questionnaireVersion: string;
  /** The questionnaire's title as it read when the draft was written —
   *  the only human name available when a resume can no longer FETCH the
   *  questionnaire. Optional because v2 drafts written before this field
   *  existed are still valid; every reader must fall back. */
  title?: string;
  responses: Record<string, QuestionnaireResponse>;
  structuredSkipped: boolean;
}

interface StoredFillDraft {
  schemaVersion: number;
  savedAt: string;
  userId: string;
  subjectKey: string;
  entryQuestionnaireId: string;
  contextKey?: string;
  forms: DraftFormSnapshot[];
}

export interface LoadedFillDraft {
  forms: DraftFormSnapshot[];
  savedAt: string;
  /** True when the saved session had structured answers the draft could
   *  not carry (draftPolicy "exclude") — the restore bar says so. */
  structuredSkipped: boolean;
  /**
   * Drop notice for the primary form, computed against the questionnaire's
   * current questions before the clinician chooses Resume or Discard.
   * Added forms are merged later when the host re-fetches them on resume.
   */
  dropped: DroppedDraftAnswer[];
}

/** File payloads and plugin types that opt out cannot round-trip through
 * JSON. Unknown plugin types are excluded until their definition is loaded. */
function isDraftExcluded(response: QuestionnaireResponse): boolean {
  if (!response.structured_type) return false;
  const resolved = resolveStructuredType(response.structured_type);
  return !resolved || resolved.draftPolicy === "exclude";
}

/** Keep serializable responses and all notes; annotate omitted file/plugin
 * values so recovery can explain which sections need re-entry. */
function partitionForDraft(responses: Record<string, QuestionnaireResponse>): {
  safe: Record<string, QuestionnaireResponse>;
  structuredSkipped: boolean;
} {
  const safe: Record<string, QuestionnaireResponse> = {};
  let structuredSkipped = false;
  for (const [id, response] of Object.entries(responses)) {
    if (isDraftExcluded(response)) {
      if (response.values.some(entryHasContent)) structuredSkipped = true;
      // Files/plugin values may be unsafe to serialize, but their notes
      // are ordinary clinician input and must survive reloads.
      safe[id] = { ...response, values: [], draft_context: undefined };
      continue;
    }
    safe[id] = response;
  }
  return { safe, structuredSkipped };
}

/** Restore structured answers against live server baselines. Values that
 * cannot be drafted (files and excluded plugins) remain in the live store;
 * serializable edits rebase onto freshly fetched clinical records. */
export function preserveExcludedStructured(
  current: Record<string, QuestionnaireResponse>,
  next: Record<string, QuestionnaireResponse>,
): Record<string, QuestionnaireResponse> {
  const merged = { ...next };
  for (const [id, response] of Object.entries(current)) {
    if (!response.structured_type) continue;
    const fresh = merged[id];
    // Same guard the draft overlay uses: only where the question still
    // exists with the same structured_type.
    if (fresh && fresh.structured_type === response.structured_type) {
      if (isDraftExcluded(response)) {
        merged[id] = { ...response, note: fresh.note ?? response.note };
      } else if (response.draft_context !== undefined) {
        merged[id] = initializeStructuredResponse(
          fresh,
          response.draft_context,
        );
      }
    }
  }
  return merged;
}

/**
 * Creation-time merge for resume paths: draft entries overlay the fresh
 * seed where the current question still accepts their shape and options.
 * Call sites that do not surface the drop list use this wrapper.
 */
export function mergeDraftIntoSeed(
  questions: Question[],
  draft: Record<string, QuestionnaireResponse>,
): Record<string, QuestionnaireResponse> {
  return mergeDraftResponses(questions, draft).responses;
}

/** The live working state of one form, as the fill host reads it out of
 *  that form's store. */
export interface FillSessionFormState {
  questionnaire: QuestionnaireRead;
  responses: Record<string, QuestionnaireResponse>;
}

function snapshotSession(forms: FillSessionFormState[]): {
  snapshots: DraftFormSnapshot[];
  anyContent: boolean;
} {
  const snapshots: DraftFormSnapshot[] = [];
  let anyContent = false;
  for (const form of forms) {
    const { safe, structuredSkipped } = partitionForDraft(form.responses);
    const hasContent = Object.values(safe).some(draftResponseHasContent);
    // Skipped values annotate an existing draft; only recoverable edits
    // create one. Server-prefilled rows are not clinician input.
    if (hasContent) anyContent = true;
    snapshots.push({
      questionnaireId: form.questionnaire.id,
      questionnaireVersion: String(form.questionnaire.version),
      title: form.questionnaire.title,
      responses: safe,
      structuredSkipped,
    });
  }
  return { snapshots, anyContent };
}

/** Files cannot be restored, but choosing/replacing a file must still arm
 * the navigation prompt. Fingerprint file metadata without serializing blobs. */
function excludedEditIntent(
  responses: Record<string, QuestionnaireResponse>,
): unknown[] {
  return Object.values(responses).flatMap((response) => {
    if (response.structured_type !== "files") return [];
    return response.values.flatMap((entry) => {
      if (entry.type !== "files") return [];
      return (entry.value ?? []).map((file) => [
        response.question_id,
        file.name,
        file.file_data.name,
        file.file_data.size,
        file.file_data.lastModified,
      ]);
    });
  });
}

/** Fingerprint clinician input, ignoring server-prefill values and their
 * baseline metadata. The same baseline also drives draft content detection. */
export function sessionEditSignature(forms: FillSessionFormState[]): string {
  return JSON.stringify(
    forms.map((form) => [
      form.questionnaire.id,
      Object.fromEntries(
        Object.entries(partitionForDraft(form.responses).safe).map(
          ([id, response]) => [id, draftIntentResponse(response)],
        ),
      ),
      excludedEditIntent(form.responses),
    ]),
  );
}

/** Persist all forms in one session. Only recoverable user input earns a
 * draft; clearing that input removes a draft this session previously wrote.
 * Returns whether this write stored a draft successfully. */
export function saveFillDraft(
  scope: FillDraftScope,
  forms: FillSessionFormState[],
  /** Snapshots that belong to this draft but are NOT in the live session:
   *  a resume whose re-fetch of an added questionnaire failed. They ride
   *  through verbatim, because the alternative is that one transient
   *  network error during Resume silently and permanently deletes that
   *  form's drafted answers. */
  retained: DraftFormSnapshot[] = [],
  /** Whether an empty session may DELETE whatever is stored under this
   *  key. Only a session that has already stored a draft of its own may:
   *  emptiness means "the clinician removed their answers" solely for a
   *  session whose answers were ever in there. An edit the draft excludes
   *  (a file attachment) drives a save while leaving the
   *  safe partition empty, and that emptiness is nobody's deletion —
   *  clearing on it destroys an earlier session's recoverable answers and
   *  trades them for work that cannot be drafted at all. */
  mayClear = true,
): boolean {
  const { snapshots, anyContent } = snapshotSession(forms);
  const live = new Set(snapshots.map((snapshot) => snapshot.questionnaireId));
  const carried = retained.filter(
    (snapshot) => !live.has(snapshot.questionnaireId),
  );
  const carriedContent = carried.some((snapshot) =>
    Object.values(snapshot.responses).some(draftResponseHasContent),
  );
  if (!anyContent && !carriedContent) {
    if (mayClear) clearFillDraft(scope);
    return false;
  }
  const draft: StoredFillDraft = {
    schemaVersion: FILL_DRAFT_SCHEMA_VERSION,
    savedAt: new Date().toISOString(),
    userId: scope.userId,
    subjectKey: scope.subjectKey,
    entryQuestionnaireId: scope.entryQuestionnaireId,
    contextKey: scope.contextKey,
    forms: [...snapshots, ...carried],
  };
  try {
    return writeFillDraftCache(scope, JSON.stringify(draft));
  } catch {
    // Quota exceeded / storage disabled — autosave is best-effort, and a
    // write that never landed earns no authority to delete later.
    return false;
  }
}

/**
 * Load the draft for this exact scope; mismatched, expired or corrupt entries
 * are removed. Primary-form version changes go through compatibility merge so
 * restorable answers survive and dropped answers are named for the restore bar.
 */
export function loadFillDraft(
  scope: FillDraftScope,
  questions: Question[],
): LoadedFillDraft | undefined {
  try {
    const raw = localStorage.getItem(fillDraftStorageKey(scope));
    if (!raw) return undefined;
    const draft = JSON.parse(raw) as StoredFillDraft;
    const primary = draft.forms?.find(
      (form) => form.questionnaireId === scope.entryQuestionnaireId,
    );
    if (
      draft.schemaVersion !== FILL_DRAFT_SCHEMA_VERSION ||
      draft.userId !== scope.userId ||
      draft.subjectKey !== scope.subjectKey ||
      draft.entryQuestionnaireId !== scope.entryQuestionnaireId ||
      draft.contextKey !== scope.contextKey ||
      isFillDraftExpired(draft.savedAt) ||
      !primary
    ) {
      removeFillDraftCache(scope);
      return undefined;
    }
    for (const form of draft.forms) {
      form.responses = reviveDraftResponses(form.responses);
    }
    const { dropped } = mergeDraftResponses(questions, primary.responses);
    return {
      forms: draft.forms,
      savedAt: draft.savedAt,
      structuredSkipped: draft.forms.some((form) => form.structuredSkipped),
      dropped,
    };
  } catch {
    removeFillDraftCache(scope);
    return undefined;
  }
}

export function clearFillDraft(scope: FillDraftScope): void {
  removeFillDraftCache(scope);
}
