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
      // Both scoping ids ride along: `authContext` alone does not separate
      // two facility_organization mounts from each other, and a list cached
      // under one organization must never be served to another.
      scope.facilityId,
      scope.facilityOrganizationId,
      filters,
    ] as const,
  detail: (id: string) => [...questionnaireKeys.all, "detail", id] as const,
  /**
   * `variant` is load-bearing, not decoration: the instance
   * (`get_organizations`) and facility (`get_facility_organizations`)
   * endpoints return different collections for the SAME questionnaire id,
   * so one questionnaire opened from both mounts in a session would
   * otherwise serve each other's payload from cache.
   */
  organizations: (id: string, variant: "instance" | "facility") =>
    [...questionnaireKeys.all, "organizations", variant, id] as const,
  revisions: (id: string) =>
    [...questionnaireKeys.all, "revisions", id] as const,
  revisionDetail: (id: string | undefined) =>
    [...questionnaireKeys.all, "revision-detail", id] as const,
};

/**
 * The action registry (`action_configuration/instructions|fields`) — what
 * the backend can run and what a condition may reference. Static per
 * deployment, so consumers set a long `staleTime`.
 */
export const actionRegistryKeys = {
  all: ["actionRegistry"] as const,
  instructions: () => [...actionRegistryKeys.all, "instructions"] as const,
  fields: () => [...actionRegistryKeys.all, "fields"] as const,
};

/**
 * Keys for the server-side `form_submission` drafts the fill page saves and
 * resumes (`useSaveServerDraft`, `?continue_draft=`) and the encounter
 * overview lists. Hand-built literals here were a correctness hazard: the
 * only thing separating the detail key from the list key was singular vs
 * plural, spelled out across three files.
 */
export const formSubmissionKeys = {
  all: ["formSubmissions"] as const,
  /**
   * Prefix for every list query — the invalidation target after a draft
   * save. Deliberately NARROWER than `all`: invalidating a DETAIL query
   * from a page that navigates away in the same tick makes React Query
   * cancel the resulting refetch and revert the cache to the pre-save dump
   * (see `useSaveServerDraft`), so a re-resume would seed stale answers.
   */
  lists: () => [...formSubmissionKeys.all, "list"] as const,
  list: (encounterId: string) =>
    [...formSubmissionKeys.lists(), encounterId] as const,
  detail: (id: string | undefined) =>
    [...formSubmissionKeys.all, "detail", id] as const,
};
