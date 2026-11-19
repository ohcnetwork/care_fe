import { createFileRoute } from "@tanstack/react-router";

import { QuestionnaireFillPage } from "@/components/QuestionnaireV2/fill/QuestionnaireFillPage";

import { questionnaireFillPage } from "@/lib/router/staticData";

/**
 * Staff only, on purpose: a patient session on this URL goes to the sign-in.
 * An index route: a `questionnaire.tsx` file would become the parent of the
 * print routes and give them its layout flags.
 */
export const Route = createFileRoute("/_app/patient/$patientId/questionnaire/")(
  {
    component: RouteComponent,
    staticData: questionnaireFillPage,
  },
);

function RouteComponent() {
  const { patientId } = Route.useParams();
  return <QuestionnaireFillPage subject={{ type: "patient", patientId }} />;
}
