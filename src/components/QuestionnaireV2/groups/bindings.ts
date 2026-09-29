import { sameResponsePath } from "@/components/QuestionnaireV2/form/engine/responseScope";
import {
  buildLinkIndex,
  initializeResponses,
  isQuestionEnabledInState,
} from "@/components/QuestionnaireV2/form/engine/store";
import type { QuestionValidationError } from "@/types/questionnaire/batch";
import type {
  QuestionnaireResponse,
  ResponsePath,
} from "@/types/questionnaire/form";
import type { Question } from "@/types/questionnaire/question";

import type { GroupField, RegisteredGroupDefinition } from "./registry";
import { compatibleGroupFields } from "./schema";

export function groupBindings(
  group: Question,
  definition: RegisteredGroupDefinition,
  questions: Question[],
  responses: Record<string, QuestionnaireResponse>,
  errors: readonly QuestionValidationError[],
  disabled: boolean,
): Record<string, GroupField | null> {
  const index = buildLinkIndex(questions);
  const states = new Map<
    string,
    { disabled: boolean; hidden: boolean; readOnly: boolean }
  >();
  const walk = (
    list: Question[],
    ancestorDisabled: boolean,
    ancestorHidden: boolean,
    ancestorReadOnly: boolean,
  ) => {
    for (const question of list) {
      const enabled = isQuestionEnabledInState(question, responses, index);
      const readOnly = ancestorReadOnly || !!question.read_only;
      const state = {
        disabled: ancestorDisabled || !enabled || readOnly,
        hidden:
          ancestorHidden ||
          (!enabled && question.disabled_display !== "protected"),
        readOnly,
      };
      states.set(question.id, state);
      walk(question.questions ?? [], state.disabled, state.hidden, readOnly);
    }
  };
  walk(questions, disabled, false, disabled);
  return Object.fromEntries(
    Object.entries(compatibleGroupFields(group, definition)).map(
      ([key, question]) => {
        if (!question) return [key, null];
        const state = states.get(question.id);
        return [
          key,
          {
            question,
            response: responses[question.id] ?? {
              question_id: question.id,
              link_id: question.link_id,
              structured_type: null,
              values: [],
            },
            disabled: state?.disabled ?? true,
            hidden: state?.hidden ?? true,
            errors: errors.filter((error) => error.question_id === question.id),
          },
        ];
      },
    ),
  );
}

/** One core-state update, so a selection and its newly enabled fields change together. */
export function updateGroupResponses(
  group: Question,
  definition: RegisteredGroupDefinition,
  questions: Question[],
  responses: Record<string, QuestionnaireResponse>,
  updates: Record<string, Partial<QuestionnaireResponse>>,
): Record<string, QuestionnaireResponse> {
  const fields = compatibleGroupFields(group, definition);
  const readOnly = new Set<string>();
  const walk = (list: Question[], locked: boolean) => {
    for (const question of list) {
      const nextLocked = locked || !!question.read_only;
      if (nextLocked) readOnly.add(question.id);
      walk(question.questions ?? [], nextLocked);
    }
  };
  walk(questions, false);
  const candidate = { ...responses };
  const changed: string[] = [];
  for (const [key, patch] of Object.entries(updates)) {
    const question = fields[key];
    if (!question || readOnly.has(question.id) || !responses[question.id])
      continue;
    // Identity belongs to core. A renderer may change only ordinary answer fields.
    const { values, note, taken_at, body_site, method } = patch;
    candidate[question.id] = {
      ...responses[question.id],
      ...(values !== undefined ? { values } : {}),
      ...(note !== undefined ? { note } : {}),
      ...(taken_at !== undefined ? { taken_at } : {}),
      ...(body_site !== undefined ? { body_site } : {}),
      ...(method !== undefined ? { method } : {}),
    };
    changed.push(key);
  }
  const before = groupBindings(
    group,
    definition,
    questions,
    responses,
    [],
    false,
  );
  let pending = changed;
  while (pending.length) {
    const after = groupBindings(
      group,
      definition,
      questions,
      candidate,
      [],
      false,
    );
    const rejected = new Set(
      pending.filter((key) => {
        const field = after[key]!;
        // Clearing a field while disabling it is valid; writing an unseen answer is not.
        return (
          field.disabled &&
          (before[key]?.disabled || field.response.values.length > 0)
        );
      }),
    );
    if (!rejected.size) break;
    for (const key of rejected) {
      const id = fields[key]!.id;
      candidate[id] = responses[id];
    }
    // A rejected controller cannot enable another write. Each pass removes patches.
    pending = pending.filter((key) => !rejected.has(key));
  }
  return candidate;
}

export type GroupRowAction =
  | { type: "add"; updates: Record<string, Partial<QuestionnaireResponse>> }
  | {
      type: "update";
      row: QuestionnaireResponse[];
      updates: Record<string, Partial<QuestionnaireResponse>>;
    }
  | { type: "remove"; row: QuestionnaireResponse[] };

/** Row references keep multiple edits/removals safe before React renders again. */
export function updateGroupRows(
  group: Question,
  definition: RegisteredGroupDefinition,
  questions: Question[],
  responses: Record<string, QuestionnaireResponse>,
  action: GroupRowAction,
): Record<string, QuestionnaireResponse> {
  const response = responses[group.id];
  if (!group.repeats || group.read_only || !response) return responses;
  const rows = response.sub_results ?? [];
  const index = action.type === "add" ? rows.length : rows.indexOf(action.row);
  if (index < 0) return responses;
  const next = [...rows];
  if (action.type === "remove") {
    next.splice(index, 1);
  } else {
    const initial =
      action.type === "add"
        ? initializeResponses(group.questions ?? [])
        : Object.fromEntries(
            action.row.map((answer) => [answer.question_id, answer]),
          );
    const updated = updateGroupResponses(
      group,
      definition,
      questions,
      { ...responses, ...initial },
      action.updates,
    );
    next[index] = Object.keys(initial).map((id) => updated[id]);
  }
  return { ...responses, [group.id]: { ...response, sub_results: next } };
}

/** An update clears only the edited row's changed answers; add/remove reindex every row. */
export function retainGroupRowErrors(
  errors: readonly QuestionValidationError[],
  path: ResponsePath,
  groupId: string,
  action: GroupRowAction,
  rows: readonly QuestionnaireResponse[][],
  nextRows: readonly QuestionnaireResponse[][],
): QuestionValidationError[] {
  if (action.type === "update") {
    const rowIndex = rows.indexOf(action.row);
    const rowPath = [...path, { questionId: groupId, rowIndex }];
    const before = new Set(action.row);
    const changed = new Set(
      (nextRows[rowIndex] ?? [])
        .filter((answer) => !before.has(answer))
        .map((answer) => answer.question_id),
    );
    return errors.filter(
      (error) =>
        !changed.has(error.question_id) ||
        (!!error.response_path &&
          !sameResponsePath(error.response_path, rowPath)),
    );
  }
  return errors.filter((error) => {
    if (
      sameResponsePath(error.response_path, path) &&
      error.question_id === groupId
    )
      return false;
    const rowPath = error.response_path ?? [];
    return (
      !sameResponsePath(rowPath.slice(0, path.length), path) ||
      rowPath[path.length]?.questionId !== groupId
    );
  });
}
