import { remapActionLinkIds } from "@/components/QuestionnaireV2/shared/actionExpression";
import {
  findFirstQuestion,
  findRegisteredGroupParent,
  freshLinkId,
  regenerateQuestionIds,
} from "@/components/QuestionnaireV2/shared/questionTree";

import { QuestionnaireAction } from "@/types/questionnaire/actions";
import { EnableWhen, Question } from "@/types/questionnaire/question";
import { swapElements } from "@/Utils/array";

export interface BuilderState {
  questions: Question[];
  /** Submit-time automations — questionnaire-level, edited by the studio's
   *  Actions panel and saved in the same PUT as the question tree. */
  actions: QuestionnaireAction[];
  selectedId: string | null;
  dirty: boolean;
}

export type BuilderAction =
  | {
      type: "reset";
      questions: Question[];
      actions: QuestionnaireAction[];
      keepSelectedId?: string | null;
    }
  | { type: "setActions"; actions: QuestionnaireAction[] }
  /** Rename one question's link_id and follow the rename through every
   *  enable_when target and action reference — the Actions panel uses it
   *  to make a legacy `Q-…` id nameable from an expression. */
  | { type: "renameLinkId"; id: string; linkId: string }
  | {
      type: "replaceAll";
      questions: Question[];
      linkIdMap?: Map<string, string>;
    }
  | { type: "select"; id: string | null }
  | {
      type: "addQuestion";
      parentId: string | null;
      index?: number;
      /** Fields overriding `newQuestion()` defaults — the studio's "Add
       *  section" passes `{ type: "group" }` so the group lands atomically. */
      template?: Partial<Question>;
    }
  | { type: "duplicateQuestion"; id: string; text?: string }
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
    link_id: freshLinkId(),
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
      return { question, operator, answer: answer === true };
    case "equals":
    case "not_equals":
      return { question, operator, answer: String(answer) };
    default:
      return {
        question,
        operator,
        answer: typeof answer === "number" ? answer : Number(answer) || 0,
      };
  }
}

/**
 * Deep copy of one question subtree for the studio's Duplicate action:
 * fresh ids/link_ids via the shared regeneration walk, with enable_when
 * targets INSIDE the subtree remapped to the copies and targets OUTSIDE it
 * preserved verbatim (`unmappedConditions: "keep"`) — the duplicate keeps
 * the same visibility rules as its source.
 */
function cloneSubtree(question: Question, text?: string): Question {
  const copy = regenerateQuestionIds([question], {
    unmappedConditions: "keep",
  })[0];
  return text ? { ...copy, text } : copy;
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
      const { questions } = action;
      return {
        questions,
        actions: action.actions,
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

    case "setActions":
      return { ...state, actions: action.actions, dirty: true };

    case "renameLinkId": {
      const target = findQuestion(state.questions, action.id);
      if (
        !target ||
        target.link_id === action.linkId ||
        findRegisteredGroupParent(state.questions, action.id)
      )
        return state;
      const previous = target.link_id;
      const linkIdMap = new Map([[previous, action.linkId]]);
      if (target.type === "group" && target.structured_type) {
        const prefix = `${previous}__`;
        for (const id of collectIds(target)) {
          const child = findQuestion(target.questions ?? [], id);
          if (child?.link_id.startsWith(prefix)) {
            linkIdMap.set(
              child.link_id,
              `${action.linkId}__${child.link_id.slice(prefix.length)}`,
            );
          }
        }
      }
      const questions = mapTree(state.questions, (list) =>
        list.map((question) => {
          const enableWhen = question.enable_when?.map((condition) =>
            linkIdMap.has(condition.question)
              ? { ...condition, question: linkIdMap.get(condition.question)! }
              : condition,
          );
          const renamed = linkIdMap.has(question.link_id)
            ? { ...question, link_id: linkIdMap.get(question.link_id)! }
            : question;
          return enableWhen ? { ...renamed, enable_when: enableWhen } : renamed;
        }),
      );
      return {
        ...state,
        questions,
        actions: remapActionLinkIds(state.actions, linkIdMap),
        dirty: true,
      };
    }

    // Preserve questionnaire actions while remapping references to re-imported
    // questions. Unrelated references remain visible to save-time validation.
    case "replaceAll":
      return {
        ...state,
        questions: action.questions,
        actions: action.linkIdMap
          ? remapActionLinkIds(state.actions, action.linkIdMap)
          : state.actions,
        selectedId: action.questions[0]?.id ?? null,
        dirty: true,
      };

    case "select":
      return {
        ...state,
        selectedId: action.id
          ? (findRegisteredGroupParent(state.questions, action.id)?.id ??
            action.id)
          : null,
      };

    case "addQuestion": {
      if (action.parentId) {
        const parent = findQuestion(state.questions, action.parentId);
        if (
          parent?.structured_type ||
          findRegisteredGroupParent(state.questions, action.parentId)
        )
          return state;
      }
      const question = { ...newQuestion(), ...action.template };
      const questions = mapTree(state.questions, (list, parentId) => {
        if (parentId !== action.parentId) return list;
        const index = action.index ?? list.length;
        return [...list.slice(0, index), question, ...list.slice(index)];
      });
      return { ...state, questions, selectedId: question.id, dirty: true };
    }

    case "duplicateQuestion": {
      if (findRegisteredGroupParent(state.questions, action.id)) return state;
      const source = findQuestion(state.questions, action.id);
      if (!source) return state;
      const copy = cloneSubtree(source, action.text);
      const questions = mapTree(state.questions, (list) => {
        const index = list.findIndex((q) => q.id === action.id);
        if (index === -1) return list;
        return [...list.slice(0, index + 1), copy, ...list.slice(index + 1)];
      });
      return { ...state, questions, selectedId: copy.id, dirty: true };
    }

    case "updateQuestion": {
      if (findRegisteredGroupParent(state.questions, action.id)) return state;
      const questions = mapTree(state.questions, (list) =>
        list.map((q) => (q.id === action.id ? { ...q, ...action.patch } : q)),
      );
      return { ...state, questions, dirty: true };
    }

    case "removeQuestions": {
      const editableIds = action.ids.filter(
        (id) => !findRegisteredGroupParent(state.questions, id),
      );
      if (!editableIds.length) return state;
      const ids = new Set(editableIds);
      const removedIds = collectSubtreeIds(state.questions, editableIds);
      const questions = mapTree(state.questions, (list) =>
        list.filter((q) => !ids.has(q.id)),
      );
      return {
        ...state,
        questions,
        selectedId: removedIds.has(state.selectedId ?? "")
          ? (questions[0]?.id ?? null)
          : state.selectedId,
        dirty: true,
      };
    }

    case "moveQuestion": {
      if (findRegisteredGroupParent(state.questions, action.id)) return state;
      const questions = mapTree(state.questions, (list) => {
        const index = list.findIndex((q) => q.id === action.id);
        if (index === -1) return list;
        const target = action.direction === "up" ? index - 1 : index + 1;
        return swapElements(list, index, target);
      });
      return { ...state, questions, dirty: true };
    }

    case "moveQuestions": {
      if (
        action.ids.some((id) =>
          findRegisteredGroupParent(state.questions, id),
        ) ||
        (action.targetParentId !== null &&
          (findQuestion(state.questions, action.targetParentId)
            ?.structured_type ||
            findRegisteredGroupParent(state.questions, action.targetParentId)))
      )
        return state;
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
