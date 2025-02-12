import { t } from "i18next";
import { navigate } from "raviger";

import { Card, CardContent } from "@/components/ui/card";

import Page from "@/components/Common/Page";
import { QuestionnaireForm } from "@/components/Questionnaire/QuestionnaireForm";

import useAppHistory from "@/hooks/useAppHistory";

interface Props {
  facilityId: string;
  patientId: string;
  encounterId?: string;
  questionnaireSlug?: string;
  subjectType?: string;
}

export default function EncounterQuestionnaire({
  facilityId,
  patientId,
  encounterId,
  questionnaireSlug,
  subjectType,
}: Props) {
  const { goBack } = useAppHistory();
  return (
    <Page title={t("questionnaire")}>
      <Card className="mt-2">
        <CardContent className="lg:p-4 p-0">
          <QuestionnaireForm
            facilityId={facilityId}
            patientId={patientId}
            subjectType={subjectType}
            encounterId={encounterId}
            questionnaireSlug={questionnaireSlug}
            onSubmit={() => {
              if (encounterId) {
                navigate(
                  `/facility/${facilityId}/encounter/${encounterId}/updates`,
                );
              } else {
                navigate(`/patient/${patientId}/updates`);
              }
            }}
            onCancel={() => goBack()}
          />
        </CardContent>
      </Card>
    </Page>
  );
}
