import { createFileRoute, useParams } from "@tanstack/react-router";

import { QuestionnaireFillPage } from "@/components/QuestionnaireV2/fill/QuestionnaireFillPage";

import {
  isQuestionnaireId,
  questionnaireQuery,
  startQuery,
} from "@/lib/router/pageQueries";
import { questionnaireFillPage } from "@/lib/router/staticData";

/** Staff only, on purpose: a patient session on this URL goes to the sign-in. */
export const Route = createFileRoute(
  "/_app/patient/$patientId/questionnaire/$questionnaireId/",
)({
  loader: ({ context, params: { questionnaireId } }) => {
    if (isQuestionnaireId(questionnaireId)) {
      startQuery(context, questionnaireQuery(questionnaireId));
    }
  },
  component: RouteComponent,
  staticData: questionnaireFillPage,
});

function RouteComponent() {
  const { patientId, questionnaireId } = useParams({
    from: "/_app/patient/$patientId/questionnaire/$questionnaireId/",
  });
  return (
    <QuestionnaireFillPage
      subject={{ type: "patient", patientId }}
      questionnaireId={questionnaireId}
    />
  );
}
