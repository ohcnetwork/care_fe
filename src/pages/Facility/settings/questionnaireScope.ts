import type { QuestionnaireScope } from "@/types/questionnaire/questionnaire";

/** Facility-level scope for the questionnaire manage pages. */
export function questionnaireScope(facilityId: string): QuestionnaireScope {
  return {
    authContext: "facility",
    facilityId,
    basePath: `/facility/${facilityId}/settings/questionnaires`,
  };
}
