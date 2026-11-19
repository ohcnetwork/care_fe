import { createFileRoute, useParams } from "@tanstack/react-router";

import { QuestionnaireRevisionPage } from "@/components/QuestionnaireV2/manage/QuestionnaireRevisionPage";

import { INSTANCE_QUESTIONNAIRE_SCOPE } from "./-adminQuestionnaireScope";

export const Route = createFileRoute(
  "/_app/admin/questionnaires/$id/versions/$revisionId",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { id, revisionId } = useParams({
    from: "/_app/admin/questionnaires/$id/versions/$revisionId",
  });
  return (
    <QuestionnaireRevisionPage
      scope={INSTANCE_QUESTIONNAIRE_SCOPE}
      id={id}
      revisionId={revisionId}
    />
  );
}
