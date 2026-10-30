import type { Question } from "@/types/questionnaire/question";

/**
 * Ids to hide in the outline for a search query, shaped for
 * `QuestionTreeNav`'s `hiddenIds` prop so numbering stays stable while
 * filtering. Matching is on question text, case-insensitive. A matching
 * question keeps its whole subtree visible (searching a section shows its
 * questions) and its ancestors (a matching child keeps the section row).
 */
export function searchHiddenIds(
  questions: Question[],
  query: string,
): Set<string> {
  const needle = query.trim().toLowerCase();
  const hidden = new Set<string>();
  if (!needle) return hidden;

  const visit = (question: Question, ancestorMatch: boolean): boolean => {
    const selfMatch = (question.text || "").toLowerCase().includes(needle);
    let childMatch = false;
    for (const child of question.questions ?? []) {
      childMatch = visit(child, ancestorMatch || selfMatch) || childMatch;
    }
    if (!selfMatch && !childMatch && !ancestorMatch) {
      hidden.add(question.id);
    }
    return selfMatch || childMatch;
  };
  for (const question of questions) visit(question, false);
  return hidden;
}
