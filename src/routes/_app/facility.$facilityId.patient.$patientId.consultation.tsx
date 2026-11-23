import { createFileRoute, useParams } from "@tanstack/react-router";

import { QuestionnaireFillPage } from "@/components/QuestionnaireV2/fill/QuestionnaireFillPage";

import { questionnaireFillSearch } from "@/lib/router/search/questionnaire";
import { questionnaireFillPage } from "@/lib/router/staticData";

/**
 * Old pre-encounter URL. It stays so that old links work. Nothing in the app
 * links here: `CreateEncounterForm` creates encounters. The subject is the
 * patient, and the fixed "encounter" question reports that it needs an
 * encounter. The picker still offers forms for encounters, as it did before
 * the subject union.
 */
export const Route = createFileRoute(
  "/_app/facility/$facilityId/patient/$patientId/consultation",
)({
  validateSearch: questionnaireFillSearch,
  component: RouteComponent,
  staticData: questionnaireFillPage,
});

function RouteComponent() {
  const { facilityId, patientId } = useParams({
    from: "/_app/facility/$facilityId/patient/$patientId/consultation",
  });
  return (
    <QuestionnaireFillPage
      subject={{ type: "patient", facilityId, patientId }}
      questionnaireId="encounter"
      pickerSubjectType="encounter"
    />
  );
}
