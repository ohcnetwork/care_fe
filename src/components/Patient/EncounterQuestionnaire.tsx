import { Card, CardContent } from "@/components/ui/card";

import Page from "@/components/Common/Page";
import { QuestionnaireForm } from "@/components/Questionnaire/QuestionnaireForm";

interface Props {
  facilityId: string;
  patientId: string;
  consultationId?: string;
  questionnaireSlug?: string;
  subjectType?: string;
}

export default function EncounterQuestionnaire({
  facilityId,
  patientId,
  consultationId,
  questionnaireSlug,
  subjectType,
}: Props) {
  return (
    <Page
      title="Questionnaire"
      backUrl={`/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}`}
    >
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="pt-6">
            <QuestionnaireForm
              patientId={patientId}
              subjectType={subjectType}
              encounterId={consultationId}
              questionnaireSlug={questionnaireSlug}
            />
          </CardContent>
        </Card>
      </div>
    </Page>
  );
}
