import { entryHasContent } from "@/components/QuestionnaireV2/form/engine/store";
import { resolveStructuredType } from "@/components/QuestionnaireV2/structured/registry";

import type { QuestionnaireResponse } from "@/types/questionnaire/form";
import type { Question } from "@/types/questionnaire/question";
import type { QuestionnaireRead } from "@/types/questionnaire/questionnaire";

import type { DroppedDraftAnswer } from "./draftMerge";
import { draftResponseHasContent, mergeDraftResponses } from "./draftMerge";
import { FILL_DRAFT_PREFIX, isFillDraftExpired } from "./fillDraftCache";
import { reviveDraftResponses } from "./fillDraftCore";

/**
 * Local fill drafts — the crash/reload safety net. Draft data lives in
 * localStorage only under this prefix, scoped per user + subject + entry
 * questionnaire, TTL-bounded, and swept on an OTHER user's login, on
 * signOut and on app update — every eviction hook is deliberate; a new
 * session boundary must join the sweep list. Expired drafts are swept at
 * boot regardless of auth outcome. A user's OWN drafts deliberately
 * survive their own re-login — that is the crash/session-expiry recovery
 * this layer exists for, not a bug (see `fillDraftCache.ts`).
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

function draftKey(scope: FillDraftScope): string {
  return `${FILL_DRAFT_PREFIX}${scope.userId}--${scope.subjectKey}--${scope.entryQuestionnaireId}`;
}

/** Is this response one the draft deliberately leaves behind? Types with
 *  `draftPolicy: "exclude"` (every adapted legacy type: their values
 *  conflate prefetched server rows with user input, and `files` holds raw
 *  File objects) never enter the draft — restoring stale clinical rows and
 *  re-upserting them could clobber edits made elsewhere. An unresolvable
 *  type (its plugin isn't loaded) is treated as "exclude": nothing here
 *  knows whether its values are serializable, and a restore would hand
 *  them to a component that may never come back. */
function isDraftExcluded(response: QuestionnaireResponse): boolean {
  if (!response.structured_type) return false;
  const resolved = resolveStructuredType(response.structured_type);
  return !resolved || resolved.draftPolicy === "exclude";
}

/**
 * Split responses into draft-safe entries and skipped structured content.
 * `isDraftExcluded` responses never enter the draft; everything else is
 * stored verbatim (a `draftPolicy: "serialize"` structured type's values
 * are plain request objects and round-trip through JSON).
 */
function partitionForDraft(responses: Record<string, QuestionnaireResponse>): {
  safe: Record<string, QuestionnaireResponse>;
  structuredSkipped: boolean;
} {
  const safe: Record<string, QuestionnaireResponse> = {};
  let structuredSkipped = false;
  for (const [id, response] of Object.entries(responses)) {
    if (isDraftExcluded(response)) {
      if (response.values.some(entryHasContent)) structuredSkipped = true;
      continue;
    }
    safe[id] = response;
  }
  return { safe, structuredSkipped };
}

/**
 * Overlay the draft-excluded structured entries a store already holds onto
 * a record that is about to REPLACE it.
 *
 * Resume and Discard both swap a form's whole responses record. Structured
 * types with `draftPolicy: "exclude"` are by definition not in the draft,
 * and the adapted widgets seed them once from a server prefetch in a mount
 * effect that never re-runs — so a plain replacement blanks the patient's
 * existing allergies/medications/diagnoses on screen, and re-entering them
 * upserts DUPLICATE clinical records. The live values are the only copy;
 * they carry across untouched.
 */
export function preserveExcludedStructured(
  current: Record<string, QuestionnaireResponse>,
  next: Record<string, QuestionnaireResponse>,
): Record<string, QuestionnaireResponse> {
  const merged = { ...next };
  for (const [id, response] of Object.entries(current)) {
    if (!isDraftExcluded(response)) continue;
    const fresh = merged[id];
    // Same guard the draft overlay uses: only where the question still
    // exists with the same structured_type.
    if (fresh && fresh.structured_type === response.structured_type) {
      merged[id] = response;
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
    // `structuredSkipped` ANNOTATES a draft (the restore bar warns about
    // it); it never creates one on its own. Adapted structured widgets
    // seed prefetched server rows into the store in mount effects, so
    // counting the flag as content wrote a phantom draft for a session the
    // clinician never touched — and let that phantom overwrite a real
    // stored draft on the very next visit.
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

/** What the clinician changed on responses the draft deliberately leaves
 *  behind. Their `values` are read by nothing here on purpose — that is
 *  where excluded widgets park prefetched server rows from mount
 *  effects — but the note is the clinician's own typing. */
function excludedNoteIntent(
  responses: Record<string, QuestionnaireResponse>,
): Array<[string, string | undefined]> {
  const intent: Array<[string, string | undefined]> = [];
  for (const [id, response] of Object.entries(responses)) {
    if (!isDraftExcluded(response)) continue;
    intent.push([id, response.note]);
  }
  return intent;
}

/**
 * Stable fingerprint of the clinician's un-submitted work across the whole
 * session: the draft-safe partition plus the note on draft-EXCLUDED
 * responses. Autosave compares it against the last value it saw, so a
 * structured widget writing its prefetched server rows (draftPolicy
 * "exclude" — never part of a draft) cannot register as a clinician edit.
 * Without this the mere act of opening a clinical form lit the Draft chip,
 * armed the unsaved-changes prompt and persisted a draft nobody asked for.
 */
export function sessionEditSignature(forms: FillSessionFormState[]): string {
  return JSON.stringify(
    forms.map((form) => [
      form.questionnaire.id,
      partitionForDraft(form.responses).safe,
      excludedNoteIntent(form.responses),
    ]),
  );
}

/** Persist the working state of every form in the session. A session with
 *  no draft-SAFE content removes the key instead (never store empty
 *  drafts — FiltersCache's clean() convention); draft-excluded structured
 *  answers alone are not content, only an annotation on a draft some
 *  plain answer already earned.
 *
 *  Returns whether a draft is stored under this scope afterwards, which is
 *  what a caller tracks to decide its own `mayClear` on later saves. */
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
   *  (a note on a structured question) drives a save while leaving the
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
    schemaVersion: SCHEMA_VERSION,
    savedAt: new Date().toISOString(),
    userId: scope.userId,
    subjectKey: scope.subjectKey,
    entryQuestionnaireId: scope.entryQuestionnaireId,
    forms: [...snapshots, ...carried],
  };
  try {
    localStorage.setItem(draftKey(scope), JSON.stringify(draft));
    return true;
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
      !primary
    ) {
      localStorage.removeItem(key);
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
    localStorage.removeItem(key);
    return undefined;
  }
}

export function clearFillDraft(scope: FillDraftScope): void {
  localStorage.removeItem(draftKey(scope));
}
