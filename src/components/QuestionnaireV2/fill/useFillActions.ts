/**
 * The questionnaire actions a fill session offers a federated agent.
 *
 * These strings are agent-facing, not user-facing: descriptions are what an
 * LLM plans against and error strings are what it reads to correct itself,
 * so they stay in English and out of i18next (a locale-dependent contract
 * would make the agent's behaviour depend on the clinician's UI language).
 *
 * Nothing here writes state directly — `invokeAction` validates the input
 * against the schema and re-checks the scope before any `run` below is
 * reached.
 */
import { useCallback, useMemo, useSyncExternalStore } from "react";
import { z } from "zod";

import type {
  ActionDefinition,
  ActionDescriptor,
  ActionRunResult,
  ActionScope,
} from "@/lib/actions";
import {
  getActionsVersion,
  invokeAction,
  listActions,
  subscribeToActions,
  useRegisterAction,
} from "@/lib/actions";

import {
  buildLinkIndex,
  clearQuestionErrorsInState,
  entryHasContent,
  isQuestionEnabledInState,
  responsesAtom,
} from "@/components/QuestionnaireV2/renderer/store";

import type {
  QuestionnaireResponse,
  ResponseValue,
} from "@/types/questionnaire/form";
import type { Question } from "@/types/questionnaire/question";

import type { FormStore } from "./StoreRegistrar";
import type { FillFormEntry } from "./formSession";
import type { FillSubject } from "./subject";
import { isPatientBound } from "./subject";

type GetStore = (key: string) => FormStore | undefined;

const setResponseSchema = z.object({
  questionnaire_id: z.string().optional(),
  link_id: z.string(),
  values: z.array(z.union([z.string(), z.number(), z.boolean()])),
  note: z.string().optional(),
});

export type SetResponseInput = z.infer<typeof setResponseSchema>;

// `.default({})` so an agent that calls a no-argument action with no
// argument at all still parses — the alternative is a confusing
// "Invalid input" for the one action that takes nothing.
const listFormsSchema = z.object({}).default({});

type ListFormsInput = z.infer<typeof listFormsSchema>;

type CoercionResult =
  { ok: true; value: ResponseValue } | { ok: false; error: string };

/** 24-hour "HH:mm", optionally with seconds — what `<input type="time">`
 *  (and therefore `TimeInput`) round-trips. */
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

/** Question types an action may write. Everything else — groups, display
 *  blocks, structured questions (which carry request payloads, not
 *  scalars), and the types with no unambiguous primitive form — is
 *  rejected rather than guessed at. */
function coerceResponseValue(
  question: Question,
  raw: string | number | boolean,
): CoercionResult {
  switch (question.type) {
    case "string":
    case "text":
    case "url":
      return { ok: true, value: { type: "string", value: String(raw) } };

    case "choice":
      return coerceChoice(question, raw);

    case "integer":
    case "decimal": {
      const value = Number(raw);
      if (Number.isNaN(value)) {
        return {
          ok: false,
          error: `"${String(raw)}" is not a number (question "${question.link_id}" is ${question.type})`,
        };
      }
      return { ok: true, value: { type: "number", value } };
    }

    case "boolean": {
      const value = coerceBoolean(raw);
      if (value === undefined) {
        return {
          ok: false,
          error: `"${String(raw)}" is not a yes/no answer for question "${question.link_id}"`,
        };
      }
      return { ok: true, value: { type: "boolean", value } };
    }

    case "date":
    case "dateTime": {
      const value = new Date(String(raw));
      if (Number.isNaN(value.getTime())) {
        return {
          ok: false,
          error: `"${String(raw)}" is not a valid ${question.type} for question "${question.link_id}"`,
        };
      }
      return question.type === "date"
        ? { ok: true, value: { type: "date", value } }
        : { ok: true, value: { type: "dateTime", value } };
    }

    case "time": {
      // `TimeInput` writes exactly what `<input type="time">` produces, so
      // the stored shape is the raw "HH:mm" (optionally with seconds)
      // string — anything else renders empty in the field.
      const value = String(raw).trim();
      if (!TIME_PATTERN.test(value)) {
        return {
          ok: false,
          error: `"${value}" is not a time for question "${question.link_id}" (expected 24-hour HH:mm)`,
        };
      }
      return { ok: true, value: { type: "time", value } };
    }

    default:
      return {
        ok: false,
        error: `Question "${question.link_id}" is of type ${question.type}, which this action cannot set`,
      };
  }
}

/** `Boolean("false")` is `true` — a silent wrong answer on a clinical form
 *  is exactly what this choke point exists to prevent, so strings are
 *  matched against the words a model actually emits and anything else is
 *  an error. */
function coerceBoolean(raw: string | number | boolean): boolean | undefined {
  if (typeof raw === "boolean") return raw;
  if (typeof raw === "number") return raw !== 0;
  const normalized = raw.trim().toLowerCase();
  if (["true", "yes", "y", "1"].includes(normalized)) return true;
  if (["false", "no", "n", "0"].includes(normalized)) return false;
  return undefined;
}

/** A choice question with a fixed option list may only receive one of its
 *  options — and it carries that option's `coding` through, the same way
 *  `initializeResponses` seeds pre-selected options. */
function coerceChoice(
  question: Question,
  raw: string | number | boolean,
): CoercionResult {
  const text = String(raw);
  const options = question.answer_option;
  if (!options?.length) {
    // A value-set-backed choice renders through `ValueSetSelect`, which
    // reads `values[0].coding` — an uncoded string would show the
    // clinician an EMPTY field while `forms.list` called it answered and
    // submit carried no code. Only a coded answer is a real answer here,
    // and this action has no parameter for one.
    if (question.answer_value_set) {
      return {
        ok: false,
        error: `Question "${question.link_id}" requires a coded value from a value set; free text is not accepted`,
      };
    }
    return { ok: true, value: { type: "string", value: text } };
  }
  const option =
    options.find((candidate) => candidate.value === text) ??
    options.find(
      (candidate) =>
        candidate.value.toLowerCase() === text.toLowerCase() ||
        candidate.display?.toLowerCase() === text.toLowerCase(),
    );
  if (!option) {
    return {
      ok: false,
      error: `"${text}" is not an option for question "${question.link_id}" (expected one of: ${options
        .map((candidate) => candidate.value)
        .join(", ")})`,
    };
  }
  return {
    ok: true,
    value: {
      type: "string",
      value: option.value,
      coding: option.code ?? undefined,
    },
  };
}

/** The question and every ancestor above it. The ancestors matter because
 *  `composeBatch` skips a disabled group WITHOUT descending into it — a
 *  child of a hidden group never reaches the server either, however
 *  enabled the child's own conditions are. */
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

/** Whether this question would take part in a submission right now — the
 *  same predicate `composeBatch` and `form/validation` apply. */
function isPathEnabled(
  path: Question[],
  responses: Record<string, QuestionnaireResponse>,
  linkIndex: Record<string, string>,
): boolean {
  return path.every((question) =>
    isQuestionEnabledInState(question, responses, linkIndex),
  );
}

/**
 * Apply one `questionnaire.response.set` call. Exported for node-side
 * assertions; the registry is the only production caller, and it has
 * already validated the input's SHAPE — everything checked here is about
 * the input's meaning against the live session.
 */
export function applySetResponse(
  input: SetResponseInput,
  forms: FillFormEntry[],
  getStore: GetStore,
): ActionRunResult {
  const form = input.questionnaire_id
    ? forms.find((entry) => entry.key === input.questionnaire_id)
    : (forms.find((entry) => entry.isPrimary) ?? forms[0]);
  if (!form) {
    return {
      ok: false,
      error: input.questionnaire_id
        ? `No open form with questionnaire id ${input.questionnaire_id}`
        : "No form is open in this session",
    };
  }

  const path = findQuestionPath(form.questionnaire.questions, input.link_id);
  if (!path) {
    return {
      ok: false,
      error: `No question with link id "${input.link_id}" in "${form.questionnaire.title}"`,
    };
  }
  const question = path[path.length - 1];
  if (
    question.type === "group" ||
    question.type === "display" ||
    question.type === "structured" ||
    question.structured_type
  ) {
    return {
      ok: false,
      error: `Question "${input.link_id}" is a ${question.type} question and cannot be answered with plain values`,
    };
  }
  if (question.read_only) {
    return { ok: false, error: `Question "${input.link_id}" is read-only` };
  }
  if (input.values.length > 1 && !question.repeats) {
    return {
      ok: false,
      error: `Question "${input.link_id}" takes a single value`,
    };
  }

  const store = getStore(form.key);
  if (!store) {
    return {
      ok: false,
      error: `Form "${form.questionnaire.title}" is not ready yet`,
    };
  }
  const previous = store.get(responsesAtom);
  const current = previous[question.id];
  if (!current) {
    // Every non-group question is seeded by `initializeResponses`, so a
    // miss means the form was swapped underneath us — writing a partial
    // record (no question_id, no link_id) would break submission.
    return {
      ok: false,
      error: `Question "${input.link_id}" is not part of the open form any more`,
    };
  }
  if (
    !isPathEnabled(path, previous, buildLinkIndex(form.questionnaire.questions))
  ) {
    // Accepting the write would look like success and then vanish at
    // submit — `composeBatch` drops disabled questions.
    return {
      ok: false,
      error: `Question "${input.link_id}" is currently disabled by its enable_when conditions and would not be submitted; answer the question it depends on first`,
    };
  }

  const values: ResponseValue[] = [];
  for (const raw of input.values) {
    const coerced = coerceResponseValue(question, raw);
    if (!coerced.ok) return coerced;
    values.push(coerced.value);
  }

  store.set(responsesAtom, {
    ...previous,
    [question.id]: {
      ...current,
      values,
      ...(input.note !== undefined && { note: input.note }),
    },
  });
  // The store's clear-on-edit invariant (`useQuestionResponse` does this
  // for a human edit): a corrected answer must drop the validation error
  // that flagged the old one, or the clinician sees a stale complaint.
  clearQuestionErrorsInState(store.get, store.set, question.id);
  return { ok: true };
}

interface FormQuestionSummary {
  link_id: string;
  text: string;
  type: string;
  required: boolean;
  options?: string[];
  answered: boolean;
  /** False while the question's (or an ancestor's) enable_when conditions
   *  are unmet — it is not on the clinician's canvas and a write to it
   *  would be rejected. */
  enabled: boolean;
}

/** Apply one `questionnaire.forms.list` call — the agent's map of the
 *  session. Exported for node-side assertions. */
export function listFormsSummary(
  forms: FillFormEntry[],
  getStore: GetStore,
): ActionRunResult {
  return {
    ok: true,
    data: forms.map((form) => {
      const responses = getStore(form.key)?.get(responsesAtom) ?? {};
      const linkIndex = buildLinkIndex(form.questionnaire.questions);
      const questions: FormQuestionSummary[] = [];
      // `ancestorsEnabled` rides down the walk for the same reason
      // `composeBatch` stops descending: a hidden group hides its whole
      // subtree, whatever the children's own conditions say.
      const walk = (list: Question[], ancestorsEnabled: boolean) => {
        for (const question of list) {
          const enabled =
            ancestorsEnabled &&
            isQuestionEnabledInState(question, responses, linkIndex);
          if (question.type !== "group") {
            const options = question.answer_option?.map(
              (option) => option.value,
            );
            questions.push({
              link_id: question.link_id,
              text: question.text,
              type: question.type,
              required: !!question.required,
              ...(options?.length ? { options } : {}),
              answered: !!responses[question.id]?.values.some(entryHasContent),
              enabled,
            });
          }
          walk(question.questions ?? [], enabled);
        }
      };
      walk(form.questionnaire.questions, true);
      return {
        questionnaire_id: form.key,
        title: form.questionnaire.title,
        questions,
      };
    }),
  };
}

/**
 * Registers this fill session's actions and returns what the Scribe mount
 * needs: the descriptors visible in this scope, and an `invoke` bound to
 * it. Only patient-bound sessions register anything — a location/device
 * fill has no patient scope to gate on, so it offers the agent nothing.
 */
export function useFillActions({
  subject,
  forms,
  getStore,
}: {
  subject: FillSubject;
  forms: FillFormEntry[];
  getStore: GetStore;
}): {
  descriptors: ActionDescriptor[];
  invoke: (actionId: string, input: unknown) => Promise<ActionRunResult>;
} {
  const patientId = isPatientBound(subject) ? subject.patientId : undefined;
  const encounterId =
    subject.type === "encounter" ? subject.encounterId : undefined;
  // Memoized on the primitives: the subject union arrives as a fresh
  // object literal from the route element on every render.
  const scope = useMemo<ActionScope>(
    () => ({ patientId, encounterId }),
    [patientId, encounterId],
  );

  const setResponseDefinition =
    useMemo<ActionDefinition<SetResponseInput> | null>(() => {
      if (!patientId) return null;
      return {
        id: "questionnaire.response.set",
        description:
          "Set the answer values for a non-structured question in the open questionnaire session, addressed by link_id.",
        parameters: {
          questionnaire_id: {
            type: "string",
            description: "Target form; defaults to the primary form",
          },
          link_id: {
            type: "string",
            description: "The question's link id",
            required: true,
          },
          values: {
            type: "array of string|number|boolean",
            description: "One entry per repeat",
            required: true,
          },
          note: {
            type: "string",
            description: "Optional note on the response",
          },
        },
        schema: setResponseSchema,
        scope,
        run: (input) => applySetResponse(input, forms, getStore),
      };
    }, [patientId, scope, forms, getStore]);

  const listFormsDefinition =
    useMemo<ActionDefinition<ListFormsInput> | null>(() => {
      if (!patientId) return null;
      return {
        id: "questionnaire.forms.list",
        description:
          "List the questionnaires open in this fill session and their questions, with each question's link id, type, options, whether it is already answered, and whether it is currently enabled (a disabled question is off the canvas and cannot be set).",
        parameters: {},
        schema: listFormsSchema,
        scope,
        run: () => listFormsSummary(forms, getStore),
      };
    }, [patientId, scope, forms, getStore]);

  useRegisterAction(setResponseDefinition);
  useRegisterAction(listFormsDefinition);

  // Re-list whenever the registry changes: the definitions above register
  // in an effect (so after the first paint), and other parts of the page
  // may register their own later.
  const version = useSyncExternalStore(
    subscribeToActions,
    getActionsVersion,
    getActionsVersion,
  );
  const descriptors = useMemo(() => listActions(scope), [version, scope]);
  const invoke = useCallback(
    (actionId: string, input: unknown) => invokeAction(actionId, input, scope),
    [scope],
  );

  return { descriptors, invoke };
}
