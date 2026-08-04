import {
  entryHasContent,
  initializeResponses,
} from "@/components/QuestionnaireV2/form/engine/store";
import { isV2Definition } from "@/components/QuestionnaireV2/structured/contract";
import { resolveStructuredType } from "@/components/QuestionnaireV2/structured/registry";

import type { QuestionnaireResponse } from "@/types/questionnaire/form";
import type { Question } from "@/types/questionnaire/question";
import type { QuestionnaireRead } from "@/types/questionnaire/questionnaire";

import { FILL_DRAFT_PREFIX, isFillDraftExpired } from "./fillDraftCache";

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
}

function draftKey(scope: FillDraftScope): string {
  return `${FILL_DRAFT_PREFIX}${scope.userId}--${scope.subjectKey}--${scope.entryQuestionnaireId}`;
}

/**
 * One response as a draft stores it.
 *
 * A contract-v2 structured question keeps its EDIT LOG and drops its
 * PROJECTION: those rows are the query layer's copy of the server's data,
 * which a draft has no business persisting and every business
 * re-fetching. Persisting them is what made `draftPolicy: "exclude"` a
 * blanket policy in the first place — restoring stale clinical rows and
 * re-upserting them could clobber edits made elsewhere. Edits are small,
 * JSON-safe and meaningful without the baseline (each carries its whole
 * row, per the canonical edit vocabulary), so a restore re-fetches the
 * rows and re-projects the log on top.
 *
 * Everything else — plain answers, v1 structured values — is stored
 * verbatim (same object reference), which is what keeps the v1 path
 * byte-identical: this function is a no-op for every response that isn't a
 * resolved contract-v2 structured question.
 */
export function draftResponseForStorage(
  response: QuestionnaireResponse,
): QuestionnaireResponse {
  if (!response.structured_type) return response;
  const resolved = resolveStructuredType(response.structured_type);
  if (!resolved || !isV2Definition(resolved)) return response;
  return { ...response, values: [] };
}

/**
 * Split responses into draft-safe entries and skipped structured content.
 * Types with `draftPolicy: "exclude"` (every adapted legacy type: their
 * values conflate prefetched server rows with user input, and `files`
 * holds raw File objects) never enter the draft — restoring stale
 * clinical rows and re-upserting them could clobber edits made elsewhere.
 * A "safe" entry still goes through `draftResponseForStorage`, which
 * strips a contract-v2 structured question's projection down to its edit
 * log before it is stored.
 */
function partitionForDraft(responses: Record<string, QuestionnaireResponse>): {
  safe: Record<string, QuestionnaireResponse>;
  structuredSkipped: boolean;
} {
  const safe: Record<string, QuestionnaireResponse> = {};
  let structuredSkipped = false;
  for (const [id, response] of Object.entries(responses)) {
    if (response.structured_type) {
      const resolved = resolveStructuredType(response.structured_type);
      // An unresolvable type (its plugin isn't loaded) is treated as
      // "exclude": nothing here knows whether its values are serializable,
      // and a restore would hand them to a component that may never come
      // back. Under contract v2 `files` is the only legitimate "exclude"
      // (raw `File` objects); under v1 every type is excluded because its
      // values conflate prefetched server rows with user input.
      if (!resolved || resolved.draftPolicy === "exclude") {
        if (response.values.some(entryHasContent)) structuredSkipped = true;
        continue;
      }
    }
    safe[id] = draftResponseForStorage(response);
  }
  return { safe, structuredSkipped };
}

/**
 * Does this stored response hold anything a draft exists to preserve?
 *
 * Plain answers and notes as before — plus, for a contract-v2 structured
 * question, the EDIT LOG, because `partitionForDraft` deliberately
 * stripped its `values`. Without this clause a section full of pending
 * clinical edits would read as empty, `saveFillDraft` would take its
 * clear-on-empty branch and the draft would be DELETED instead of written
 * (P1-3, inverted). Baseline rows still do not count as content: they were
 * never in the stored copy. Byte-identical to the pre-shim inline check
 * for v1 (`edits` is always absent there).
 */
export function draftResponseHasContent(
  response: QuestionnaireResponse,
): boolean {
  if (response.values.some(entryHasContent)) return true;
  if ((response.edits?.length ?? 0) > 0) return true;
  return !!response.note;
}

/** Is this response one the draft deliberately leaves behind? Mirrors
 *  `partitionForDraft`'s rule, including its treatment of an unresolvable
 *  type as "exclude". */
function isDraftExcluded(response: QuestionnaireResponse): boolean {
  if (!response.structured_type) return false;
  const resolved = resolveStructuredType(response.structured_type);
  return !resolved || resolved.draftPolicy === "exclude";
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
 * A stable fingerprint of everything a draft WOULD store for this session:
 * the draft-safe partition of every form's responses.
 *
 * Autosave compares it against the last value it saw, so a structured
 * widget writing its prefetched server rows (draftPolicy "exclude" — never
 * part of a draft) cannot register as a clinician edit. Without this the
 * mere act of opening a clinical form lit the Draft chip, armed the
 * unsaved-changes prompt and persisted a draft nobody asked for.
 *
 * v1 structured types stay out of the signature entirely (excluded by
 * `partitionForDraft`, per `draftPolicy`). Contract-v2 types are IN it, but
 * as their edit log with the projection stripped
 * (`draftResponseForStorage`) — so a baseline refetch (which only ever
 * rewrites `values`) is invisible to this fingerprint, and a clinician's
 * edit (which rewrites `edits`) is visible. The exclusion above is no
 * longer the only mechanism that keeps a passive refresh from registering
 * as a change.
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
