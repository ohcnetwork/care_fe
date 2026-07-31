import { QuestionnaireScope } from "@/types/questionnaire/questionnaire";

/**
 * Query-key factory for every questionnaire-v2 query. All keys share the
 * `questionnaireKeys.all` root so `invalidateQueries({ queryKey:
 * questionnaireKeys.all })` reaches lists, details, organizations and
 * revisions structurally — a key built outside this factory would silently
 * opt out of that invalidation (and of the documented
 * setQueryData-before-invalidate save sequence in useUpdateQuestionnaire).
 *
 * Module-local by design: the repo has no global key-factory convention, so
 * this only standardizes the QuestionnaireV2 subtree.
 */
export const questionnaireKeys = {
  all: ["questionnairesV2"] as const,
  list: (scope: QuestionnaireScope, filters: unknown) =>
    [
      ...questionnaireKeys.all,
      scope.authContext,
      scope.facilityId,
      filters,
    ] as const,
  detail: (id: string) => [...questionnaireKeys.all, "detail", id] as const,
  organizations: (id: string) =>
    [...questionnaireKeys.all, "organizations", id] as const,
  revisions: (id: string) =>
    [...questionnaireKeys.all, "revisions", id] as const,
  revisionDetail: (id: string | undefined) =>
    [...questionnaireKeys.all, "revision-detail", id] as const,
};
