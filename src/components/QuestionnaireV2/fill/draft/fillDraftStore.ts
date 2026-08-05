import { entryHasContent } from "@/components/QuestionnaireV2/form/engine/store";
import { resolveStructuredType } from "@/components/QuestionnaireV2/structured/registry";

import type { QuestionnaireResponse } from "@/types/questionnaire/form";
import type { Question } from "@/types/questionnaire/question";
import type { QuestionnaireRead } from "@/types/questionnaire/questionnaire";

import type { DroppedDraftAnswer } from "./draftMerge";
import { draftResponseHasContent, mergeDraftResponses } from "./draftMerge";
import { FILL_DRAFT_PREFIX, isFillDraftExpired } from "./fillDraftCache";

/**
 * Local fill drafts are the crash/reload safety net. They are scoped per
 * user, subject and entry questionnaire, TTL-bounded, and swept on session
 * boundaries; one key stores the whole fill session.
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
  /** `QuestionnaireRead.version` — a version bump invalidates this form. */
  questionnaireVersion: string;
  /** The questionnaire title captured with the draft. Optional for older v2
   *  drafts, so readers must fall back when it is absent. */
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

/**
 * Store one response in draft-safe form. Resolved structured questions keep
 * edit logs and drop projections so stale clinical rows are not re-upserted;
 * plain answers and unresolved structured responses are stored verbatim.
 */
export function draftResponseForStorage(
  response: QuestionnaireResponse,
): QuestionnaireResponse {
  if (!response.structured_type) return response;
  const resolved = resolveStructuredType(response.structured_type);
  if (!resolved) return response;
  return { ...response, values: [] };
}

/** Is this response one the draft deliberately leaves behind? An
 *  unresolvable structured type (its plugin isn't loaded) counts as
 *  "exclude": nothing here knows whether its values are serializable, and
 *  a restore would hand them to a component that may never come back.
 *  `files` is the only legitimate "exclude" among resolvable types (raw
 *  `File` objects cannot round-trip through JSON). */
function isDraftExcluded(response: QuestionnaireResponse): boolean {
  if (!response.structured_type) return false;
  const resolved = resolveStructuredType(response.structured_type);
  return !resolved || resolved.draftPolicy === "exclude";
}

/**
 * Split responses into draft-safe entries and skipped structured content.
 * `isDraftExcluded` responses never enter the draft — restoring stale
 * clinical rows and re-upserting them could clobber edits made elsewhere.
 * A "safe" entry still goes through `draftResponseForStorage`, which
 * strips a resolved structured question's projection down to its edit
 * log before it is stored.
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
    safe[id] = draftResponseForStorage(response);
  }
  return { safe, structuredSkipped };
}

/**
 * Preserve draft-excluded structured entries across whole-record replacement.
 * Those values are seeded from server data and cannot round-trip through the
 * draft, so Resume and Discard must not blank the only live copy on screen.
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

/**
 * Stable fingerprint of the draft-safe partition of the whole session.
 * Autosave uses it to ignore prefetched server rows and baseline projection
 * refreshes while still noticing clinician edits to draftable data.
 */
export function safeSessionSignature(forms: FillSessionFormState[]): string {
  return JSON.stringify(
    forms.map((form) => [
      form.questionnaire.id,
      partitionForDraft(form.responses).safe,
    ]),
  );
}

/** Persist the working state of every form in the session. A session with
 *  no draft-SAFE content removes the key instead (never store empty
 *  drafts — FiltersCache's clean() convention); draft-excluded structured
 *  answers alone are not content, only an annotation on a draft some
 *  plain answer already earned. */
export function saveFillDraft(
  scope: FillDraftScope,
  forms: FillSessionFormState[],
  /** Snapshots that belong to this draft but are NOT in the live session:
   *  a resume whose re-fetch of an added questionnaire failed. They ride
   *  through verbatim, because the alternative is that one transient
   *  network error during Resume silently and permanently deletes that
   *  form's drafted answers. */
  retained: DraftFormSnapshot[] = [],
): void {
  const { snapshots, anyContent } = snapshotSession(forms);
  const live = new Set(snapshots.map((snapshot) => snapshot.questionnaireId));
  const carried = retained.filter(
    (snapshot) => !live.has(snapshot.questionnaireId),
  );
  const carriedContent = carried.some((snapshot) =>
    Object.values(snapshot.responses).some(draftResponseHasContent),
  );
  if (!anyContent && !carriedContent) {
    clearFillDraft(scope);
    return;
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
    // Server dumps are untyped blobs — a `values`-less entry is possible
    // and must not throw the whole encounter overview.
    for (const entry of response.values ?? []) {
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
