import { Question } from "@/types/questionnaire/question";

export interface BuilderState {
  questions: Question[];
  selectedId: string | null;
  dirty: boolean;
}

export type BuilderAction =
  | { type: "reset"; questions: Question[] }
  | { type: "select"; id: string | null }
  | { type: "addQuestion"; parentId: string | null; index?: number }
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
  for (const question of questions) {
    if (question.id === id) return question;
    const found = findQuestion(question.questions ?? [], id);
    if (found) return found;
  }
  return undefined;
}

export function findParentId(
  questions: Question[],
  id: string,
  parentId: string | null = null,
): string | null | undefined {
  for (const question of questions) {
    if (question.id === id) return parentId;
    const found = findParentId(question.questions ?? [], id, question.id);
    if (found !== undefined) return found;
  }
  return undefined;
}

export function collectIds(question: Question): string[] {
  return [question.id, ...(question.questions ?? []).flatMap(collectIds)];
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
    case "reset":
      return {
        questions: action.questions,
        selectedId: action.questions[0]?.id ?? null,
        dirty: false,
      };

    case "select":
      return { ...state, selectedId: action.id };

    case "addQuestion": {
      const question = newQuestion();
      const questions = mapTree(state.questions, (list, parentId) => {
        if (parentId !== action.parentId) return list;
        const index = action.index ?? list.length;
        return [...list.slice(0, index), question, ...list.slice(index)];
      });
      return { questions, selectedId: question.id, dirty: true };
    }

    case "updateQuestion": {
      const questions = mapTree(state.questions, (list) =>
        list.map((q) => (q.id === action.id ? { ...q, ...action.patch } : q)),
      );
      return { ...state, questions, dirty: true };
    }

    case "removeQuestions": {
      const ids = new Set(action.ids);
      const questions = mapTree(state.questions, (list) =>
        list.filter((q) => !ids.has(q.id)),
      );
      return {
        questions,
        selectedId: ids.has(state.selectedId ?? "")
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
      const ids = new Set(action.ids);
      const moved: Question[] = [];
      const walk = (list: Question[]) => {
        for (const q of list) {
          if (ids.has(q.id)) moved.push(q);
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
