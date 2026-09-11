import {
  FILL_DRAFT_PREFIX,
  fillDraftStorageKey,
  fillDraftStorageKeys,
  isFillDraftExpired,
  removeFillDraftCache,
} from "./fillDraftCache";
import type { FillDraftScope } from "./fillDraftCore";
import { FILL_DRAFT_SCHEMA_VERSION } from "./fillDraftCore";

/** Metadata only: overview consumers never receive the patient's answers. */
export interface LocalFillDraftSummary {
  key: string;
  scope: FillDraftScope;
  title?: string;
  savedAt: string;
  formCount: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonemptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function isResponseValues(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.every((entry) => isRecord(entry) && isNonemptyString(entry.type))
  );
}

function isResponses(value: unknown): boolean {
  return (
    isRecord(value) &&
    Object.entries(value).every(
      ([id, response]) =>
        isRecord(response) &&
        response.question_id === id &&
        typeof response.link_id === "string" &&
        (response.structured_type === null ||
          isNonemptyString(response.structured_type)) &&
        isResponseValues(response.values) &&
        (response.note === undefined || typeof response.note === "string") &&
        (response.draft_context === undefined ||
          isResponseValues(response.draft_context)),
    )
  );
}

/** Validate each envelope against its actual storage key before listing it.
 * Keep reads pure: invalid entries are ignored; cache sweeps handle deletion. */
function readSummary(
  key: string,
  userId: string,
  subjectKey: string,
): LocalFillDraftSummary | undefined {
  try {
    const draft: unknown = JSON.parse(localStorage.getItem(key) ?? "null");
    if (
      !isRecord(draft) ||
      draft.schemaVersion !== FILL_DRAFT_SCHEMA_VERSION ||
      draft.userId !== userId ||
      draft.subjectKey !== subjectKey ||
      !isNonemptyString(draft.entryQuestionnaireId) ||
      (draft.contextKey !== undefined && !isNonemptyString(draft.contextKey)) ||
      typeof draft.savedAt !== "string" ||
      isFillDraftExpired(draft.savedAt) ||
      !Array.isArray(draft.forms) ||
      !draft.forms.length
    )
      return undefined;

    const scope: FillDraftScope = {
      userId,
      subjectKey,
      entryQuestionnaireId: draft.entryQuestionnaireId,
      ...(draft.contextKey === undefined
        ? {}
        : { contextKey: draft.contextKey as string }),
    };
    if (fillDraftStorageKey(scope) !== key) return undefined;

    const ids = new Set<string>();
    let primary: Record<string, unknown> | undefined;
    for (const form of draft.forms) {
      if (
        !isRecord(form) ||
        !isNonemptyString(form.questionnaireId) ||
        typeof form.questionnaireVersion !== "string" ||
        (form.title !== undefined && typeof form.title !== "string") ||
        typeof form.structuredSkipped !== "boolean" ||
        !isResponses(form.responses) ||
        ids.has(form.questionnaireId)
      )
        return undefined;
      ids.add(form.questionnaireId);
      if (form.questionnaireId === scope.entryQuestionnaireId) primary = form;
    }
    if (!primary) return undefined;
    return {
      key,
      scope,
      title:
        typeof primary.title === "string"
          ? primary.title.trim() || undefined
          : undefined,
      savedAt: draft.savedAt,
      formCount: draft.forms.length,
    };
  } catch {
    return undefined;
  }
}

/** Current user's drafts for exactly one subject, newest first. No registry,
 * API requests, response revival or storage mutations are needed to list. */
export function listLocalFillDrafts(
  userId: string,
  subjectKey: string,
): LocalFillDraftSummary[] {
  if (!userId || !subjectKey) return [];
  const prefix = `${FILL_DRAFT_PREFIX}${userId}--${subjectKey}--`;
  return fillDraftStorageKeys()
    .filter((key) => key.startsWith(prefix))
    .flatMap((key) => {
      const summary = readSummary(key, userId, subjectKey);
      return summary ? [summary] : [];
    })
    .sort(
      (left, right) =>
        Date.parse(right.savedAt) - Date.parse(left.savedAt) ||
        left.key.localeCompare(right.key),
    );
}

export function discardLocalFillDraft(scope: FillDraftScope): boolean {
  return removeFillDraftCache(scope);
}
