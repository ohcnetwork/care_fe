import { createFileRoute, useParams } from "@tanstack/react-router";

import { QuestionnaireFillPage } from "@/components/QuestionnaireV2/fill/QuestionnaireFillPage";

import { questionnaireFillSearch } from "@/lib/router/search/questionnaire";
import { questionnaireFillPage } from "@/lib/router/staticData";

/**
 * Staff only, on purpose: a patient session on this URL goes to the sign-in.
 * An index route: a `questionnaire.tsx` file would become the parent of the
 * print routes and give them its layout flags.
 */
export const Route = createFileRoute("/_app/patient/$patientId/questionnaire/")(
  {
    validateSearch: questionnaireFillSearch,
    component: RouteComponent,
    staticData: questionnaireFillPage,
  },
);

function RouteComponent() {
  const { patientId } = useParams({
    from: "/_app/patient/$patientId/questionnaire/",
  });
  return <QuestionnaireFillPage subject={{ type: "patient", patientId }} />;
}
