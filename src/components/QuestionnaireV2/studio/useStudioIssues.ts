import { useDeferredValue, useMemo, useSyncExternalStore } from "react";

import { findActionIssues } from "@/components/QuestionnaireV2/builder/actionValidation";
import { reachableContextPaths } from "@/components/QuestionnaireV2/builder/actionVariables";
import { useActionRegistry } from "@/components/QuestionnaireV2/builder/actions/useActionRegistry";
import { findInvalidQuestions } from "@/components/QuestionnaireV2/builder/saveValidation";
import { actionReferencedLinkIds } from "@/components/QuestionnaireV2/shared/actionExpression";
import {
  getStructuredTypesVersion,
  subscribeToStructuredTypes,
} from "@/components/QuestionnaireV2/structured/pluginRegistry";
import {
  actionContextTypeFor,
  QuestionnaireAction,
} from "@/types/questionnaire/actions";
import { Question } from "@/types/questionnaire/question";
import { SubjectType } from "@/types/questionnaire/questionnaire";

interface UseStudioIssuesOptions {
  questions: Question[];
  actions: QuestionnaireAction[];
  subjectType: SubjectType | undefined;
}

/** Deferred validation for outline/canvas warnings and issue navigation.
 * Save still checks the live question tree, independently of this display. */
export function useStudioIssues({
  questions,
  actions,
  subjectType,
}: UseStudioIssuesOptions) {
  // The unknown-structured-type rule reads the plugin registry, which fills
  // in only after the federation manifests resolve — later than the first
  // render of a cold-loaded questionnaire. Without re-running on that, a
  // plugin-typed question would show false "Unknown structured type"
  // warnings (outline icons, canvas chips, issues popover) until an edit
  // happened to invalidate the memo.
  const structuredTypesVersion = useSyncExternalStore(
    subscribeToStructuredTypes,
    getStructuredTypesVersion,
    getStructuredTypesVersion,
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

  // What the backend can run and what an action may read; the actions'
  // own save rules ride the same deferred tree as the question rules.
  const registry = useActionRegistry();
  const contextPaths = useMemo(() => {
    if (registry.isLoading || registry.isError) return undefined;
    const rootType = subjectType && actionContextTypeFor(subjectType);
    return rootType ? reachableContextPaths(rootType, registry.fields) : [];
  }, [subjectType, registry.fields, registry.isLoading, registry.isError]);
  const actionIssues = useMemo(
    () =>
      findActionIssues(actions, {
        questions: deferredQuestions,
        instructions: registry.instructions,
        contextPaths,
      }),
    [actions, deferredQuestions, registry.instructions, contextPaths],
  );
  // Questions an action reads — the outline marks them so an author
  // retitling or deleting one knows something depends on it.
  const actionLinkIds = useMemo(
    () => new Set(actions.flatMap(actionReferencedLinkIds)),
    [actions],
  );

  return {
    issues,
    issueKeysByQuestionId,
    registry,
    contextPaths,
    actionIssues,
    actionLinkIds,
  };
}
