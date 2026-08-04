/**
 * The assistant capability's session-scoped handle — replaces
 * `fill/useFillActions.ts` and the module-global registry it read from
 * (`src/lib/actions/`, deleted). See `types.ts` for the full contract and
 * the batch report for the care_scribe handover notes.
 *
 * SESSION-SCOPED, NOT A MODULE GLOBAL. `createHandle` below closes over a
 * `latestRef` that is private to ONE call of this hook — every method
 * reads `latestRef.current` at CALL TIME, so it always sees this mount's
 * current `forms`/`getStore`, never another mount's. Two
 * `QuestionnaireFillPage`s mounted at once each get their own `useRef`,
 * their own closures, their own handle object: nothing here is keyed by a
 * shared Map the way the old `src/lib/actions/registry.ts` was (a single
 * `Map<string, ActionDefinition>` that a second mount's registration would
 * silently overwrite for a shared action id). The only shared state is
 * `windowTestBridge.ts`'s `Map<sessionId, handle>`, which exists
 * specifically to hold MORE THAN ONE handle at a time, keyed by a random
 * id minted per mount — not a last-write-wins slot.
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

/** The question and every ancestor above it, found by `link_id` — same
 *  walk (and the same reason: `composeBatch` skips a disabled group
 *  WITHOUT descending, so a hidden group's child never reaches the server
 *  however enabled the child's own conditions are) as the old registry's
 *  `findQuestionPath`. */
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

function setValueImpl(
  snapshot: SessionSnapshot,
  formKey: string | undefined,
  questionId: string,
  values: PlainValueEntry[],
  note: string | undefined,
): AssistantResult {
  const form = resolveForm(formKey, snapshot.forms);
  if (!form) return fail(formNotFoundError(formKey));
  const path = findQuestionPath(form.questionnaire.questions, questionId);
  if (!path) return fail(noSuchQuestionError(questionId, form));
  const question = path[path.length - 1];

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
  if (question.read_only) {
    return fail(`Question "${questionId}" is read-only`);
  }
  if (values.length > 1 && !question.repeats) {
    return fail(`Question "${questionId}" takes a single value`);
  }
  const rawValues = values as RawAnswerValue[];
  const bounds = checkSetValueBounds(rawValues, note);
  if (!bounds.ok) return fail(bounds.error ?? "Invalid input");

  const store = snapshot.getStore(form.key);
  if (!store)
    return fail(`Form "${form.questionnaire.title}" is not ready yet`);
  const previous = store.get(responsesAtom);
  const current = previous[question.id];
  if (!current) {
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
  const form = resolveForm(formKey, snapshot.forms);
  if (!form) return fail(formNotFoundError(formKey));
  const path = findQuestionPath(form.questionnaire.questions, questionId);
  if (!path) return fail(noSuchQuestionError(questionId, form));
  const question = path[path.length - 1];

  if (question.type !== "structured" || !question.structured_type) {
    return fail(`Question "${questionId}" is not a structured question`);
  }
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

  const definition = resolveStructuredType(question.structured_type);
  if (!definition) {
    return fail(`Unknown structured type "${question.structured_type}"`);
  }
  if (definition.contract !== 2) {
    // The legacy (v1) contract has no edit log to append to — it reads
    // and writes the whole `values[0].value` array by hand, keyed by a
    // `dirty` flag on each entry. Rejecting rather than guessing at a
    // fake edit-log shape for it.
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

  // THE SAME EDIT-LOG PATH A HUMAN TAP TAKES: `applyEditToLog` is the
  // exact function every `useStructuredRows` mutator calls
  // (`core/editLog.ts`'s own doc comment names this as its intended
  // caller: "the exact function the assistant's `applyStructuredEdit`
  // path will call in a later phase"). No `baseline` is supplied — this
  // handle is constructed at the SESSION level, above any single
  // structured question's mounted editor, so it has no access to that
  // question's fetched server rows (only the mounted `useStructuredRows`
  // instance does). `applyEditToLog`'s own doc comment documents this as
  // a deliberate, safe fallback: without a baseline it resolves a
  // resurrection/re-add conservatively to "update" rather than risking a
  // duplicate-create "add" — see `resolveOpAgainstBaseline`.
  const currentLog = (response.edits ?? []) as EditLog<Record<string, unknown>>;
  const nextEdit: RowEdit<Record<string, unknown>> = {
    rowId,
    op: edit.op,
    patch: validated.value as Record<string, unknown>,
  };
  const nextLog = applyEditToLog(currentLog, nextEdit, {});

  // Projection, generically: `projectRows(undefined, log, {})` renders
  // every add/update patch's own content (no baseline to merge against —
  // see the doc comment above) exactly the way step 3 of `projectRows`'
  // own doc comment describes for the "baseline not yet known" window.
  // This does NOT apply a type's own `isEmptyRow` filter (that predicate
  // lives in each type's `model.ts`, out of this generic handle's
  // reach) — see the batch report for the one type (`time_of_death`)
  // where that is a known, narrow display-only gap.
  const projectedRows = projectRows(undefined, nextLog, {}).map(
    (entry) => entry.row,
  );
  const nextValues: ResponseValue[] =
    projectedRows.length === 0
      ? []
      : ([
          { type: question.structured_type, value: projectedRows },
        ] as unknown as ResponseValue[]);

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
 * Builds this fill session's assistant handle. Session-scoped: the handle
 * object is created once (a `useRef`) and its methods always read the
 * LATEST `forms`/`getStore`/`subject` through a mutable ref updated every
 * render — never a stale closure, and never a module-global lookup.
 *
 * Also wires the internal change-notification fan-out `subscribe()`
 * exposes: one effect subscribes to every currently mounted form's
 * `responsesAtom` (re-subscribing whenever `forms`/`storesVersion`
 * change, so a form added or removed mid-session is picked up), and fans
 * every fire out to whatever listeners `subscribe()` has collected. A
 * human edit, an assistant write, and a baseline-refresh projection
 * update all go through the same atom, so all three notify identically.
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
