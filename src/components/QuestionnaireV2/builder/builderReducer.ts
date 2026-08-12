import {
  findFirstQuestion,
  regenerateQuestionIds,
} from "@/components/QuestionnaireV2/shared/questionTree";

import { EnableWhen, Question } from "@/types/questionnaire/question";

export interface BuilderState {
  questions: Question[];
  selectedId: string | null;
  dirty: boolean;
}

export type BuilderAction =
  | { type: "reset"; questions: Question[]; keepSelectedId?: string | null }
  | { type: "replaceAll"; questions: Question[] }
  | { type: "select"; id: string | null }
  | {
      type: "addQuestion";
      parentId: string | null;
      index?: number;
      /** Fields overriding `newQuestion()` defaults — the studio's "Add
       *  section" passes `{ type: "group" }` so the group lands atomically. */
      template?: Partial<Question>;
    }
  | { type: "duplicateQuestion"; id: string }
  | { type: "updateQuestion"; id: string; patch: Partial<Question> }
  | { type: "removeQuestions"; ids: string[] }
  | { type: "moveQuestion"; id: string; direction: "up" | "down" }
  | {
      type: "moveQuestions";
      ids: string[];
      targetParentId: string | null;
      index: number;
    };

export function newQuestion(): Question {
  return {
    id: crypto.randomUUID(),
    link_id: `Q-${crypto.randomUUID().slice(0, 8)}`,
    text: "",
    type: "string",
    questions: [],
  };
}

export function findQuestion(
  questions: Question[],
  id: string,
): Question | undefined {
  return findFirstQuestion(questions, (question) => question.id === id);
}

export function collectIds(question: Question): string[] {
  return [question.id, ...(question.questions ?? []).flatMap(collectIds)];
}

/**
 * Boolean conditions persist the strings "Yes"/"No" — never JSON booleans.
 * Deployed evaluators normalize dependent boolean responses to "Yes"/"No"
 * before comparing, so true/false answers would never match. Applies to
 * equals/not_equals only; `exists` compares against a literal boolean
 * (`normalizeExistsConditionAnswer`). Lives here so editor display and
 * load-time migration cannot drift.
 */
export function normalizeBooleanConditionAnswer(answer: unknown): "Yes" | "No" {
  if (answer === true || answer === "true" || answer === "Yes") return "Yes";
  return "No";
}

/**
 * `exists` answers persist as JSON booleans: the renderer enables an
 * `exists: false` dependent precisely when the controller has no value, and
 * the backend reaches the same reading only from a literal `false` — a
 * "No" string normalizes to True there and to "has a value" here, i.e. the
 * exact opposite of what the author picked.
 */
export function normalizeExistsConditionAnswer(answer: unknown): boolean {
  return (
    answer !== false && answer !== "false" && answer !== "No" && answer !== "no"
  );
}

/**
 * Builds a condition whose answer matches the shape its operator persists:
 * `exists` a literal boolean, equals/not_equals a string ("Yes"/"No" once the
 * target is boolean) and the comparison operators a number. Every operator or
 * answer edit in the visibility editor routes through here, so a stored answer
 * can never contradict its operator.
 */
export function buildCondition(
  question: string,
  operator: EnableWhen["operator"],
  answer: EnableWhen["answer"],
): EnableWhen {
  switch (operator) {
    case "exists":
      return {
        question,
        operator,
        answer: normalizeExistsConditionAnswer(answer),
      };
    case "equals":
    case "not_equals":
      return {
        question,
        operator,
        answer:
          typeof answer === "boolean"
            ? normalizeBooleanConditionAnswer(answer)
            : String(answer),
      };
    default:
      return {
        question,
        operator,
        answer: typeof answer === "number" ? answer : Number(answer) || 0,
      };
  }
}

/**
 * Repairs enable_when answers to the convention each operator needs:
 * equals/not_equals JSON true/false (or "true"/"false") become "Yes"/"No",
 * and `exists` answers written as strings by earlier builder versions become
 * booleans again. The equals/not_equals repair is keyed off the target
 * question's type so string questions that legitimately answer "true" are
 * left alone; `exists` carries no such string, whatever the target type.
 */
export function migrateLegacyBooleanEnableWhen(
  questions: Question[],
): Question[] {
  const typeByLinkId = new Map<string, Question["type"]>();
  const indexTypes = (list: Question[]) => {
    for (const question of list) {
      if (!typeByLinkId.has(question.link_id)) {
        typeByLinkId.set(question.link_id, question.type);
      }
      indexTypes(question.questions ?? []);
    }
  };
  indexTypes(questions);

  const needsMigration = (condition: EnableWhen): boolean => {
    // Ahead of the target-type guard: an `exists` answer is never a
    // meaningful string, so these need repairing on non-boolean targets too.
    if (condition.operator === "exists") {
      return typeof condition.answer !== "boolean";
    }
    if (typeByLinkId.get(condition.question) !== "boolean") return false;
    return (
      (condition.operator === "equals" ||
        condition.operator === "not_equals") &&
      (typeof condition.answer === "boolean" ||
        condition.answer === "true" ||
        condition.answer === "false")
    );
  };

  const migrate = (condition: EnableWhen): EnableWhen =>
    buildCondition(
      condition.question,
      condition.operator,
      // Migration must not change how a stored rule evaluates. Only a literal
      // `false` ever read as "target is empty" — every legacy `exists` string,
      // "No" included, already evaluated as "target is answered" in both the
      // renderer and the backend, so it heals to `true`, not to its own
      // author-facing reading. Below, `buildCondition` leaves equals/not_equals
      // strings byte-identical (a string target may legitimately compare to
      // "true"), so the boolean convention is applied here, where the target
      // type is known to be boolean.
      condition.operator === "exists"
        ? true
        : normalizeBooleanConditionAnswer(condition.answer),
    );

  return mapTree(questions, (list) =>
    list.map((question) => {
      if (!question.enable_when?.some(needsMigration)) return question;
      return {
        ...question,
        enable_when: question.enable_when.map((condition) =>
          needsMigration(condition) ? migrate(condition) : condition,
        ),
      };
    }),
  );
}

/**
 * Deep copy of one question subtree for the studio's Duplicate action:
 * fresh ids/link_ids via the shared regeneration walk, with enable_when
 * targets INSIDE the subtree remapped to the copies and targets OUTSIDE it
 * preserved verbatim (`unmappedConditions: "keep"`) — the duplicate keeps
 * the same visibility rules as its source.
 */
function cloneSubtree(question: Question): Question {
  const copy = regenerateQuestionIds([question], {
    unmappedConditions: "keep",
  })[0];
  return copy.text ? { ...copy, text: `${copy.text} (copy)` } : copy;
}

/**
 * Resolves `ids` against `questions` and unions in every descendant id of
 * each match, so callers can reason about whole subtrees rather than just
 * the literal ids provided. Ids that cannot be found are skipped.
 */
function collectSubtreeIds(questions: Question[], ids: string[]): Set<string> {
  const result = new Set<string>();
  for (const id of ids) {
    const question = findQuestion(questions, id);
    if (!question) continue;
    for (const collected of collectIds(question)) {
      result.add(collected);
    }
  }
  return result;
}

/** The `link_id`s a delete takes with it — conditions naming one of these
 *  can no longer resolve. Walks only the removed subtrees. */
function collectSubtreeLinkIds(
  questions: Question[],
  ids: string[],
): Set<string> {
  const result = new Set<string>();
  const walk = (question: Question) => {
    result.add(question.link_id);
    for (const child of question.questions ?? []) walk(child);
  };
  for (const id of ids) {
    const question = findQuestion(questions, id);
    if (question) walk(question);
  }
  return result;
}

/**
 * Drops the visibility conditions naming a removed `link_id`. Without this a
 * dangling condition survives the save (`saveValidation` only rejects targets
 * it can type-check) and every evaluator resolves the missing response to
 * `false`, hiding the dependent question forever with nothing on screen to
 * explain it. A question left with no conditions becomes unconditionally
 * visible, which is the recoverable end of that trade.
 *
 * Returns the same reference when nothing matched, so the surrounding
 * `mapTree` keeps identity for untouched questions.
 */
function dropConditionsTargeting(
  question: Question,
  removedLinkIds: Set<string>,
): Question {
  if (!question.enable_when?.length) return question;
  const enable_when = question.enable_when.filter(
    (condition) => !removedLinkIds.has(condition.question),
  );
  return enable_when.length === question.enable_when.length
    ? question
    : { ...question, enable_when };
}

/** Immutably map every questions array in the tree (root included). */
export function mapTree(
  questions: Question[],
  fn: (list: Question[], parentId: string | null) => Question[],
  parentId: string | null = null,
): Question[] {
  return fn(questions, parentId).map((question) =>
    question.questions?.length || question.type === "group"
      ? {
          ...question,
          questions: mapTree(question.questions ?? [], fn, question.id),
        }
      : question,
  );
}

export function builderReducer(
  state: BuilderState,
  action: BuilderAction,
): BuilderState {
  switch (action.type) {
    case "reset": {
      // Boolean conditions are repaired on load; the fix lands with the next
      // save (state stays clean — dirty: false).
      const questions = migrateLegacyBooleanEnableWhen(action.questions);
      return {
        questions,
        // Selection is builder working state — a post-save reset keeps the
        // user's place when the previously selected question still exists.
        selectedId:
          action.keepSelectedId &&
          findQuestion(questions, action.keepSelectedId)
            ? action.keepSelectedId
            : (questions[0]?.id ?? null),
        dirty: false,
      };
    }

    case "replaceAll":
      return {
        questions: action.questions,
        selectedId: action.questions[0]?.id ?? null,
        dirty: true,
      };

    case "select":
      return { ...state, selectedId: action.id };

    case "addQuestion": {
      const question = { ...newQuestion(), ...action.template };
      const questions = mapTree(state.questions, (list, parentId) => {
        if (parentId !== action.parentId) return list;
        const index = action.index ?? list.length;
        return [...list.slice(0, index), question, ...list.slice(index)];
      });
      return { questions, selectedId: question.id, dirty: true };
    }

    case "duplicateQuestion": {
      const source = findQuestion(state.questions, action.id);
      if (!source) return state;
      const copy = cloneSubtree(source);
      const questions = mapTree(state.questions, (list) => {
        const index = list.findIndex((q) => q.id === action.id);
        if (index === -1) return list;
        return [...list.slice(0, index + 1), copy, ...list.slice(index + 1)];
      });
      return { questions, selectedId: copy.id, dirty: true };
    }

    case "updateQuestion": {
      const questions = mapTree(state.questions, (list) =>
        list.map((q) => (q.id === action.id ? { ...q, ...action.patch } : q)),
      );
      return { ...state, questions, dirty: true };
    }

    case "removeQuestions": {
      const ids = new Set(action.ids);
      const removedIds = collectSubtreeIds(state.questions, action.ids);
      const removedLinkIds = collectSubtreeLinkIds(state.questions, action.ids);
      const questions = mapTree(state.questions, (list) =>
        list
          .filter((q) => !ids.has(q.id))
          .map((q) => dropConditionsTargeting(q, removedLinkIds)),
      );
      return {
        questions,
        selectedId: removedIds.has(state.selectedId ?? "")
          ? (questions[0]?.id ?? null)
          : state.selectedId,
        dirty: true,
      };
    }

    case "moveQuestion": {
      const questions = mapTree(state.questions, (list) => {
        const index = list.findIndex((q) => q.id === action.id);
        if (index === -1) return list;
        const target = action.direction === "up" ? index - 1 : index + 1;
        if (target < 0 || target >= list.length) return list;
        const next = [...list];
        [next[index], next[target]] = [next[target], next[index]];
        return next;
      });
      return { ...state, questions, dirty: true };
    }

    case "moveQuestions": {
      const movedSubtreeIds = collectSubtreeIds(state.questions, action.ids);
      if (
        action.targetParentId !== null &&
        movedSubtreeIds.has(action.targetParentId)
      ) {
        // Target is the moved question itself or one of its descendants —
        // that parent won't exist anymore once the subtree is excised, so
        // moving there would silently drop the data. No-op instead.
        return state;
      }

      const ids = new Set(action.ids);
      const moved: Question[] = [];
      const walk = (list: Question[]) => {
        for (const q of list) {
          if (ids.has(q.id)) {
            moved.push(q);
            continue;
          }
          walk(q.questions ?? []);
        }
      };
      walk(state.questions);
      const withoutMoved = mapTree(state.questions, (list) =>
        list.filter((q) => !ids.has(q.id)),
      );
      const questions = mapTree(withoutMoved, (list, parentId) => {
        if (parentId !== action.targetParentId) return list;
        const index = Math.min(action.index, list.length);
        return [...list.slice(0, index), ...moved, ...list.slice(index)];
      });
      return { ...state, questions, dirty: true };
    }
  }
}
