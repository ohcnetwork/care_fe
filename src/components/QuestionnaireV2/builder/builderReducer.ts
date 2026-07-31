import { EnableWhen, Question } from "@/types/questionnaire/question";

export interface BuilderState {
  questions: Question[];
  selectedId: string | null;
  dirty: boolean;
}

export type BuilderAction =
  | { type: "reset"; questions: Question[] }
  | { type: "replaceAll"; questions: Question[] }
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

/**
 * Deep-clones a question tree with fresh `id`s and `link_id`s (used by clone
 * and import, where reusing the source's ids would collide with the
 * originals once both exist as separate questionnaires/questions).
 *
 * `enable_when[].question` references point at a sibling's `link_id`, so a
 * naive per-question regeneration would leave those references dangling.
 * Instead this builds an old→new `link_id` map for the whole tree up front,
 * then rewrites every condition's `question` through that map — conditions
 * whose target isn't in the map (e.g. it pointed outside the copied subtree)
 * are dropped rather than left pointing at a stale id.
 */
export function regenerateQuestionIds(questions: Question[]): Question[] {
  const linkIdMap = new Map<string, string>();
  const mapLinkIds = (list: Question[]) => {
    for (const question of list) {
      linkIdMap.set(question.link_id, `Q-${crypto.randomUUID().slice(0, 8)}`);
      mapLinkIds(question.questions ?? []);
    }
  };
  mapLinkIds(questions);

  const remapEnableWhen = (
    enableWhen: EnableWhen[] | undefined,
  ): EnableWhen[] | undefined =>
    enableWhen
      ?.filter((condition) => linkIdMap.has(condition.question))
      .map((condition) => ({
        ...condition,
        question: linkIdMap.get(condition.question)!,
      }));

  const walk = (list: Question[]): Question[] =>
    list.map((question) => ({
      ...question,
      id: crypto.randomUUID(),
      link_id: linkIdMap.get(question.link_id)!,
      enable_when: remapEnableWhen(question.enable_when),
      questions: walk(question.questions ?? []),
    }));

  return walk(questions);
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
    case "reset":
      return {
        questions: action.questions,
        selectedId: action.questions[0]?.id ?? null,
        dirty: false,
      };

    case "replaceAll":
      return {
        questions: action.questions,
        selectedId: action.questions[0]?.id ?? null,
        dirty: true,
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
      const removedIds = collectSubtreeIds(state.questions, action.ids);
      const questions = mapTree(state.questions, (list) =>
        list.filter((q) => !ids.has(q.id)),
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
