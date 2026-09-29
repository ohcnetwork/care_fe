import { useDeferredValue, useMemo, useSyncExternalStore } from "react";

import { findInvalidQuestions } from "@/components/QuestionnaireV2/builder/saveValidation";
import {
  getQuestionGroupsVersion,
  subscribeToQuestionGroups,
} from "@/components/QuestionnaireV2/groups/registry";
import { Question } from "@/types/questionnaire/question";

interface UseStudioIssuesOptions {
  questions: Question[];
}

/** Deferred validation for outline/canvas warnings and issue navigation.
 * Save still checks the live question tree, independently of this display. */
export function useStudioIssues({ questions }: UseStudioIssuesOptions) {
  // The unknown-structured-type rule reads the plugin registry, which fills
  // in only after the federation manifests resolve — later than the first
  // render of a cold-loaded questionnaire. Without re-running on that, a
  // plugin-typed question would show false "Unknown structured type"
  // warnings (outline icons, canvas chips, issues popover) until an edit
  // happened to invalidate the memo.
  const structuredTypesVersion = useSyncExternalStore(
    subscribeToQuestionGroups,
    getQuestionGroupsVersion,
    getQuestionGroupsVersion,
  );
  // Deferring the tree keeps typing responsive while warning displays catch
  // up. The page's save handler checks the live tree synchronously instead.
  const deferredQuestions = useDeferredValue(questions);
  const issues = useMemo(() => {
    // Referenced so the dependency is a real read, not one exhaustive-deps
    // would call spurious: the registry lookup happens inside
    // `findInvalidQuestions`, where the rule cannot see it.
    void structuredTypesVersion;
    return findInvalidQuestions(deferredQuestions);
  }, [deferredQuestions, structuredTypesVersion]);
  // First failing rule per question — powers the outline warning icons and
  // the canvas error chips alongside the top bar's popover.
  const issueKeysByQuestionId = useMemo(
    () =>
      new Map(
        issues.map(({ question, messageKey }) => [question.id, messageKey]),
      ),
    [issues],
  );

  return { issues, issueKeysByQuestionId };
}
