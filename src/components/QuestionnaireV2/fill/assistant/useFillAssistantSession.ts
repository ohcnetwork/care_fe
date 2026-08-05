/**
 * Builds the assistant capability's session-scoped handle. Each hook call has
 * its own `latestRef`; methods read it at call time so they see the current
 * forms and stores for this mount, never another mount's state.
 */
import type { RefObject } from "react";
import { useCallback, useEffect, useRef } from "react";

import {
  buildLinkIndex,
  clearQuestionErrorsInState,
  entryHasContent,
  isQuestionEnabledInState,
  responsesAtom,
} from "@/components/QuestionnaireV2/form/engine/store";
import {
  projectionResponseValues,
  resolveStructuredSlotState,
  resolveStructuredType,
  structuredDataAny,
} from "@/components/QuestionnaireV2/structured/registry";

import { applyEditToLog } from "@/components/QuestionnaireV2/structured/core/editLog";
import { projectRows } from "@/components/QuestionnaireV2/structured/core/projectRows";
import type {
  EditLog,
  RowEdit,
} from "@/components/QuestionnaireV2/structured/core/types";

import type {
  QuestionnaireResponse,
  ResponseValue,
} from "@/types/questionnaire/form";
import type { Question } from "@/types/questionnaire/question";
import type { StructuredEditRecord } from "@/types/questionnaire/structured";

import type { FormStore } from "@/components/QuestionnaireV2/fill/StoreRegistrar";
import type { FillFormEntry } from "@/components/QuestionnaireV2/fill/formSession";
import type { FillSubject } from "@/components/QuestionnaireV2/fill/subject";
import { rendererSubjectOf } from "@/components/QuestionnaireV2/fill/subject";

import {
  checkSetValueBounds,
  coercePlainResponseValue,
  formatLocalDate,
  type RawAnswerValue,
} from "./coercion";
import {
  rowSchemaOf,
  validateStructuredPatch,
} from "./structuredEditValidation";
import type {
  ApplyStructuredEditInput,
  AssistantResult,
  FillAssistantHandle,
  FormDescriptor,
  PlainValueEntry,
  PlainValueSummary,
  QuestionDescriptor,
  StructuredQuestionSummary,
} from "./types";
import { registerTestBridgeSession } from "./windowTestBridge";

type GetStore = (key: string) => FormStore | undefined;

interface SessionSnapshot {
  subject: FillSubject;
  forms: FillFormEntry[];
  getStore: GetStore;
}

function ok(): { ok: true } {
  return { ok: true };
}
function fail(error: string): { ok: false; error: string } {
  return { ok: false, error };
}

/** The question and every ancestor above it, found by `link_id`. The
 *  ancestors matter because `composeBatch` skips a disabled group
 *  WITHOUT descending — a hidden group's child never reaches the server
 *  however enabled the child's own conditions are. */
function findQuestionPath(
  questions: Question[],
  linkId: string,
): Question[] | undefined {
  for (const question of questions) {
    if (question.link_id === linkId) return [question];
    const nested = findQuestionPath(question.questions ?? [], linkId);
    if (nested) return [question, ...nested];
  }
  return undefined;
}

function isPathEnabled(
  path: Question[],
  responses: Record<string, QuestionnaireResponse>,
  linkIndex: Record<string, string>,
): boolean {
  return path.every((question) =>
    isQuestionEnabledInState(question, responses, linkIndex),
  );
}

function resolveForm(
  formKey: string | undefined,
  forms: FillFormEntry[],
): FillFormEntry | undefined {
  if (formKey) return forms.find((entry) => entry.key === formKey);
  return forms.find((entry) => entry.isPrimary) ?? forms[0];
}

/** `Date` -> the same plain, round-trippable string `setValue` accepts
 *  back and `serializeValues.ts` submits — `date` collapses to local
 *  `YYYY-MM-DD`, `dateTime` to full ISO. Never returns a `Date` object:
 *  every handle method is meant to be JSON-safe, since it may be read
 *  across module federation or Playwright's `page.evaluate`. */
function toPlainEntry(entry: ResponseValue): PlainValueEntry {
  if (entry.value === undefined) return null;
  if (entry.value instanceof Date) {
    return entry.type === "date"
      ? formatLocalDate(entry.value)
      : entry.value.toISOString();
  }
  if (typeof entry.value === "object") return null; // defensive; never hit for a plain question
  return entry.value;
}

function summarizePlainValue(
  response: QuestionnaireResponse | undefined,
): PlainValueSummary {
  if (!response) return { values: [] };
  return { values: response.values.map(toPlainEntry), note: response.note };
}

/** Descriptor for one structured question — resolves its slot state the
 *  same way `StructuredSlot` does, so "ready" here means the same thing
 *  it means on screen. */
function structuredSummary(
  question: Question,
  form: FillFormEntry,
  subjectContext: Partial<
    Record<"patientId" | "encounterId" | "facilityId", string>
  >,
  response: QuestionnaireResponse | undefined,
): StructuredQuestionSummary {
  const type = question.structured_type as string;
  const slotState = resolveStructuredSlotState(
    type,
    form.questionnaire.subject_type,
    subjectContext,
  );
  const definition =
    slotState.kind === "unknown_type" ? undefined : slotState.definition;
  return {
    type,
    contract: definition?.contract,
    slotState: slotState.kind,
    rowSchema: rowSchemaOf(definition),
    projection: structuredDataAny(response),
  };
}

function buildQuestionDescriptors(
  form: FillFormEntry,
  subjectContext: Partial<
    Record<"patientId" | "encounterId" | "facilityId", string>
  >,
  getStore: GetStore,
): QuestionDescriptor[] {
  const store = getStore(form.key);
  const responses = store?.get(responsesAtom) ?? {};
  const linkIndex = buildLinkIndex(form.questionnaire.questions);
  const descriptors: QuestionDescriptor[] = [];

  const walk = (list: Question[], ancestorsEnabled: boolean) => {
    for (const question of list) {
      const enabled =
        ancestorsEnabled &&
        isQuestionEnabledInState(question, responses, linkIndex);
      if (question.type !== "group") {
        const response = responses[question.id];
        const isStructured =
          question.type === "structured" && !!question.structured_type;
        descriptors.push({
          id: question.link_id,
          text: question.text,
          type: question.type,
          required: !!question.required,
          enabled,
          answered: !!response?.values.some(entryHasContent),
          ...(question.answer_option?.length
            ? { options: question.answer_option.map((option) => option.value) }
            : {}),
          ...(isStructured
            ? {
                structured: structuredSummary(
                  question,
                  form,
                  subjectContext,
                  response,
                ),
              }
            : { value: summarizePlainValue(response) }),
        });
      }
      walk(question.questions ?? [], enabled);
    }
  };
  walk(form.questionnaire.questions, true);
  return descriptors;
}

function listFormsImpl(forms: FillFormEntry[]): FormDescriptor[] {
  return forms.map((form) => ({
    key: form.key,
    title: form.questionnaire.title,
    isPrimary: form.isPrimary,
  }));
}

function getValueImpl(
  snapshot: SessionSnapshot,
  formKey: string | undefined,
  questionId: string,
): AssistantResult<PlainValueSummary> {
  const form = resolveForm(formKey, snapshot.forms);
  if (!form) return fail(formNotFoundError(formKey));
  const path = findQuestionPath(form.questionnaire.questions, questionId);
  if (!path) return fail(noSuchQuestionError(questionId, form));
  const question = path[path.length - 1];
  const store = snapshot.getStore(form.key);
  const response = store?.get(responsesAtom)[question.id];
  return { ok: true, value: summarizePlainValue(response) };
}

function formNotFoundError(formKey: string | undefined): string {
  return formKey
    ? `No open form with questionnaire id ${formKey}`
    : "No form is open in this session";
}

function noSuchQuestionError(questionId: string, form: FillFormEntry): string {
  return `No question with link id "${questionId}" in "${form.questionnaire.title}"`;
}

interface WritableQuestion {
  question: Question;
  store: FormStore;
  previous: Record<string, QuestionnaireResponse>;
  response: QuestionnaireResponse;
}

/** The gates shared by both write paths (`setValue`,
 *  `applyStructuredEdit`): the question must exist in the resolved form,
 *  not be read-only, have a live store entry and a response slot, and be
 *  enabled — itself and every ancestor — since `composeBatch` would never
 *  submit a disabled question's answer. */
function resolveWritableQuestion(
  snapshot: SessionSnapshot,
  formKey: string | undefined,
  questionId: string,
): AssistantResult<WritableQuestion> {
  const form = resolveForm(formKey, snapshot.forms);
  if (!form) return fail(formNotFoundError(formKey));
  const path = findQuestionPath(form.questionnaire.questions, questionId);
  if (!path) return fail(noSuchQuestionError(questionId, form));
  const question = path[path.length - 1];

  if (question.read_only) {
    return fail(`Question "${questionId}" is read-only`);
  }
  const store = snapshot.getStore(form.key);
  if (!store)
    return fail(`Form "${form.questionnaire.title}" is not ready yet`);
  const previous = store.get(responsesAtom);
  const response = previous[question.id];
  if (!response) {
    return fail(
      `Question "${questionId}" is not part of the open form any more`,
    );
  }
  const linkIndex = buildLinkIndex(form.questionnaire.questions);
  if (!isPathEnabled(path, previous, linkIndex)) {
    return fail(
      `Question "${questionId}" is currently disabled by its enable_when conditions and would not be submitted; answer the question it depends on first`,
    );
  }
  return { ok: true, value: { question, store, previous, response } };
}

function setValueImpl(
  snapshot: SessionSnapshot,
  formKey: string | undefined,
  questionId: string,
  values: PlainValueEntry[],
  note: string | undefined,
): AssistantResult {
  const resolved = resolveWritableQuestion(snapshot, formKey, questionId);
  if (!resolved.ok) return resolved;
  const { question, store, previous, response: current } = resolved.value;

  if (
    question.type === "group" ||
    question.type === "display" ||
    question.type === "structured" ||
    question.structured_type
  ) {
    return fail(
      `Question "${questionId}" is a ${question.type} question and cannot be answered with plain values`,
    );
  }
  if (values.length > 1 && !question.repeats) {
    return fail(`Question "${questionId}" takes a single value`);
  }
  const rawValues = values as RawAnswerValue[];
  const bounds = checkSetValueBounds(rawValues, note);
  if (!bounds.ok) return fail(bounds.error ?? "Invalid input");

  const coerced: ResponseValue[] = [];
  for (const raw of rawValues) {
    const result = coercePlainResponseValue(question, raw);
    if (!result.ok) return fail(result.error);
    coerced.push(result.value);
  }

  store.set(responsesAtom, {
    ...previous,
    [question.id]: {
      ...current,
      values: coerced,
      ...(note !== undefined && { note }),
    },
  });
  clearQuestionErrorsInState(store.get, store.set, question.id);
  return ok();
}

function applyStructuredEditImpl(
  snapshot: SessionSnapshot,
  formKey: string | undefined,
  questionId: string,
  edit: ApplyStructuredEditInput,
): AssistantResult<{ rowId: string }> {
  const resolved = resolveWritableQuestion(snapshot, formKey, questionId);
  if (!resolved.ok) return resolved;
  const { question, store, previous, response } = resolved.value;

  if (question.type !== "structured" || !question.structured_type) {
    return fail(`Question "${questionId}" is not a structured question`);
  }

  const definition = resolveStructuredType(question.structured_type);
  if (!definition) {
    return fail(`Unknown structured type "${question.structured_type}"`);
  }
  if (definition.contract !== 2) {
    // `contract` is typed as the literal 2, but a runtime-registered
    // (module-federated) plugin definition is untyped JS at this boundary
    // — reject anything that doesn't declare the current contract rather
    // than appending to an edit log the type may not maintain.
    return fail(
      `Structured type "${question.structured_type}" is on the legacy contract and does not accept assistant edits yet`,
    );
  }

  if ((edit.op === "update" || edit.op === "remove") && !edit.rowId) {
    return fail(`rowId is required for op "${edit.op}"`);
  }
  const rowId = edit.rowId ?? crypto.randomUUID();

  const validated = validateStructuredPatch(
    rowSchemaOf(definition),
    edit.patch,
  );
  if (!validated.ok) return fail(validated.error);

  // Same edit-log path a human tap takes: `applyEditToLog` is the exact
  // function every `useStructuredRows` mutator calls. No `baseline` is
  // supplied — this handle lives at the session level, above any single
  // question's mounted editor, so it cannot see that question's fetched
  // server rows. Without a baseline, `applyEditToLog` resolves a
  // resurrection/re-add conservatively to "update" rather than risking a
  // duplicate-create "add" — see `resolveOpAgainstBaseline`.
  const currentLog = (response.edits ?? []) as EditLog<Record<string, unknown>>;
  const nextEdit: RowEdit<Record<string, unknown>> = {
    rowId,
    op: edit.op,
    patch: validated.value as Record<string, unknown>,
  };
  const nextLog = applyEditToLog(currentLog, nextEdit, {});

  // Projection without a baseline renders every add/update patch's own
  // content (`projectRows`' "baseline not yet known" behavior). It does
  // NOT apply the type's own `isEmptyRow` filter — that predicate lives
  // in each type's `model.ts`, out of this generic handle's reach — so an
  // all-empty row can appear in the display projection (display-only:
  // submit derives from `edits`, not from this mirror).
  const projectedRows = projectRows(undefined, nextLog, {}).map(
    (entry) => entry.row,
  );
  const nextValues = projectionResponseValues(
    question.structured_type,
    projectedRows,
  );

  store.set(responsesAtom, {
    ...previous,
    [question.id]: {
      ...response,
      values: nextValues,
      edits: nextLog as StructuredEditRecord[],
    },
  });
  clearQuestionErrorsInState(store.get, store.set, question.id);
  return { ok: true, value: { rowId } };
}

function createHandle(
  latestRef: RefObject<SessionSnapshot>,
  listeners: Set<() => void>,
): FillAssistantHandle {
  return {
    listForms: () => listFormsImpl(latestRef.current.forms),
    listQuestions: (formKey) => {
      const form = resolveForm(formKey, latestRef.current.forms);
      if (!form) return [];
      const { patientId, encounterId, facilityId } = rendererSubjectOf(
        latestRef.current.subject,
      );
      return buildQuestionDescriptors(
        form,
        { patientId, encounterId, facilityId },
        latestRef.current.getStore,
      );
    },
    getValue: (formKey, questionId) =>
      getValueImpl(latestRef.current, formKey, questionId),
    setValue: (formKey, questionId, values, note) =>
      setValueImpl(latestRef.current, formKey, questionId, values, note),
    applyStructuredEdit: (formKey, questionId, edit) =>
      applyStructuredEditImpl(latestRef.current, formKey, questionId, edit),
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

export interface UseFillAssistantSessionArgs {
  subject: FillSubject;
  forms: FillFormEntry[];
  getStore: GetStore;
  /** Bumped whenever `StoreRegistrar` registers or unregisters a form's
   *  jotai store — read only to retrigger the subscription effect below;
   *  `getStore` itself is a stable `useCallback` reading through a ref
   *  (`QuestionnaireFillPage.tsx`'s `storesRef`), so its identity never
   *  changes on its own. */
  storesVersion: number;
}

/**
 * Builds the assistant handle and wires change notifications. The handle is
 * created once and reads latest session state through a ref; subscriptions
 * follow the mounted form stores so human edits, assistant writes and
 * projection refreshes notify through the same channel.
 */
export function useFillAssistantSession({
  subject,
  forms,
  getStore,
  storesVersion,
}: UseFillAssistantSessionArgs): FillAssistantHandle {
  const latestRef = useRef<SessionSnapshot>({ subject, forms, getStore });
  latestRef.current = { subject, forms, getStore };

  // The `subscribe()` fan-out list — one Set per hook instance (per
  // mounted session), never shared across mounts.
  const listenersRef = useRef<Set<() => void>>(new Set());

  const handleRef = useRef<FillAssistantHandle | undefined>(undefined);
  if (!handleRef.current) {
    handleRef.current = createHandle(latestRef, listenersRef.current);
  }

  const notify = useCallback(() => {
    listenersRef.current.forEach((listener) => listener());
  }, []);

  useEffect(() => {
    const unsubscribes = forms
      .map((form) => getStore(form.key)?.sub(responsesAtom, notify))
      .filter((unsub): unsub is () => void => !!unsub);
    return () => unsubscribes.forEach((unsub) => unsub());
  }, [forms, getStore, storesVersion, notify]);

  // Test bridge (Playwright drivability) — see `windowTestBridge.ts`'s own
  // doc comment for the gate. Registers/unregisters this exact handle
  // instance for the lifetime of the mount; a second concurrently mounted
  // session registers its OWN entry under its OWN random id, so both are
  // independently reachable via `window.__CARE_FILL_ASSISTANT__.list()`.
  useEffect(() => registerTestBridgeSession(handleRef.current!), []);

  return handleRef.current;
}
