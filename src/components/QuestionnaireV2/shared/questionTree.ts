import { EnableWhen, Question } from "@/types/questionnaire/question";

/**
 * Pure question-tree utilities shared by manage/, builder/ and renderer/.
 * Nothing here touches builder state or React — reducer-coupled helpers stay
 * in builder/builderReducer.ts, presentation stays in QuestionTreeNav.tsx.
 */

export interface TreeItem {
  question: Question;
  number: string;
  children: TreeItem[];
}

/** Stable dotted ordinals at every authored depth: 1., 1.1., 1.1.1., … */
export function numberQuestions(questions: Question[]): TreeItem[] {
  const numberLevel = (list: Question[], prefix: string): TreeItem[] =>
    list.map((question, index) => {
      const number = `${prefix}${index + 1}.`;
      return {
        question,
        number,
        children: numberLevel(question.questions ?? [], number),
      };
    });
  return numberLevel(questions, "");
}

/** Pre-order numbered rows for flat selects, issue lists, and action labels. */
export function flattenNumberedQuestions(questions: Question[]): TreeItem[] {
  const flatten = (items: TreeItem[]): TreeItem[] =>
    items.flatMap((item) => [item, ...flatten(item.children)]);
  return flatten(numberQuestions(questions));
}

/** Pre-order depth-first search for the first question matching `predicate`
 *  — the one walk shape behind id lookup and the builder's save checks. */
export function findFirstQuestion(
  questions: Question[],
  predicate: (question: Question) => boolean,
): Question | undefined {
  for (const question of questions) {
    if (predicate(question)) return question;
    const found = findFirstQuestion(question.questions ?? [], predicate);
    if (found) return found;
  }
  return undefined;
}

/** Does `question` (or any of its descendants) have id `questionId`? */
function containsQuestion(question: Question, questionId: string): boolean {
  if (question.id === questionId) return true;
  return (question.questions ?? []).some((child) =>
    containsQuestion(child, questionId),
  );
}

/** Maps any question id (top-level or nested) to the index of its top-level
 *  ancestor in `questions` — so selecting a child in the tree nav pages to
 *  its containing top-level question. */
export function findTopLevelIndex(
  questions: Question[],
  questionId: string,
): number {
  const index = questions.findIndex((question) =>
    containsQuestion(question, questionId),
  );
  return index === -1 ? 0 : index;
}

/**
 * Looks up `questionId`'s own dotted number at any depth, or undefined
 * when the question does not belong to this tree.
 */
export function findQuestionNumber(
  questions: Question[],
  questionId: string,
): string | undefined {
  return flattenNumberedQuestions(questions).find(
    (item) => item.question.id === questionId,
  )?.number;
}

/** Questions that record answers (everything except `group` containers),
 *  at any depth — the count surfaces in canvas/outline "N questions" lines. */
export function countLeafQuestions(questions: Question[]): number {
  let count = 0;
  const walk = (list: Question[]) => {
    for (const question of list) {
      if (question.type === "group") walk(question.questions ?? []);
      else count += 1;
    }
  };
  walk(questions);
  return count;
}

/**
 * Deep-clones a question tree with fresh `id`s and `link_id`s, remapping
 * `enable_when` references through the whole copied tree. Missing or duplicate
 * link ids receive fresh values; only the first occurrence claims the remap.
 * `unmappedConditions` controls whether external references are dropped or
 * preserved for in-questionnaire duplication.
 */
/** A generated link id. Underscore, not hyphen: `q_<link_id>` must be a
 *  Python identifier for questionnaire actions to reference the answer
 *  (see `shared/actionExpression.ts`). */
export function freshLinkId(): string {
  return `Q_${crypto.randomUUID().slice(0, 8)}`;
}

export function regenerateQuestionIds(
  questions: Question[],
  options: { unmappedConditions?: "drop" | "keep" } = {},
): Question[] {
  return regenerateQuestionIdsWithMap(questions, options).questions;
}

/**
 * `regenerateQuestionIds` plus the old → new link_id map it built, for
 * callers that carry link_id references OUTSIDE the tree (the clone dialog
 * remaps the questionnaire's actions through it).
 */
export function regenerateQuestionIdsWithMap(
  questions: Question[],
  {
    unmappedConditions = "drop",
  }: { unmappedConditions?: "drop" | "keep" } = {},
): { questions: Question[]; linkIdMap: Map<string, string> } {
  const linkIdMap = new Map<string, string>();
  const mapLinkIds = (list: Question[]) => {
    for (const question of list) {
      if (question.link_id && !linkIdMap.has(question.link_id)) {
        linkIdMap.set(question.link_id, freshLinkId());
      }
      mapLinkIds(Array.isArray(question.questions) ? question.questions : []);
    }
  };
  mapLinkIds(questions);

  const remapEnableWhen = (
    enableWhen: EnableWhen[] | undefined,
  ): EnableWhen[] | undefined =>
    unmappedConditions === "keep"
      ? enableWhen?.map((condition) =>
          linkIdMap.has(condition.question)
            ? { ...condition, question: linkIdMap.get(condition.question)! }
            : condition,
        )
      : enableWhen
          ?.filter((condition) => linkIdMap.has(condition.question))
          .map((condition) => ({
            ...condition,
            question: linkIdMap.get(condition.question)!,
          }));

  // Same DFS preorder as mapLinkIds, so the occurrence that claimed the map
  // entry is also the first one seen here.
  const seen = new Set<string>();
  const walk = (list: Question[]): Question[] =>
    list.map((question) => {
      const mapped =
        question.link_id && !seen.has(question.link_id)
          ? linkIdMap.get(question.link_id)
          : undefined;
      if (question.link_id) seen.add(question.link_id);
      return {
        ...question,
        id: crypto.randomUUID(),
        link_id: mapped ?? freshLinkId(),
        enable_when: remapEnableWhen(question.enable_when),
        questions: walk(
          Array.isArray(question.questions) ? question.questions : [],
        ),
      };
    });

  return { questions: walk(questions), linkIdMap };
}
