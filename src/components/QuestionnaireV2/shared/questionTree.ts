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

/** Top-level questions get 1., 2., …; children get parent.child (1.1., 1.2.). */
export function numberQuestions(questions: Question[]): TreeItem[] {
  return questions.map((question, i) => ({
    question,
    number: `${i + 1}.`,
    children: (question.questions ?? []).map((child, j) => ({
      question: child,
      number: `${i + 1}.${j + 1}.`,
      children: [],
    })),
  }));
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
 * Looks up `questionId`'s own dotted number (e.g. "3." or "3.1.") from
 * `numberQuestions`'s two-level output. Returns undefined for ids nested
 * deeper than that (grandchildren+), since `numberQuestions` only numbers
 * top-level questions and their immediate children — callers should fall
 * back to the top-level ancestor's ordinal in that case.
 */
export function findQuestionNumber(
  questions: Question[],
  questionId: string,
): string | undefined {
  for (const item of numberQuestions(questions)) {
    if (item.question.id === questionId) return item.number;
    const child = item.children.find(
      (childItem) => childItem.question.id === questionId,
    );
    if (child) return child.number;
  }
  return undefined;
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
 *
 * Imported/hand-edited trees can carry missing or duplicate `link_id`s. Only
 * the FIRST occurrence of an old link_id claims the map entry (so enable_when
 * references still resolve deterministically); every other occurrence —
 * duplicate or missing — gets its own fresh link_id, instead of collapsing
 * all of them onto one shared regenerated id.
 */
export function regenerateQuestionIds(questions: Question[]): Question[] {
  const freshLinkId = () => `Q-${crypto.randomUUID().slice(0, 8)}`;

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
    enableWhen
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

  return walk(questions);
}
