import { useQuery } from "@tanstack/react-query";
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import { Card, CardContent } from "@/components/ui/card";

import Page from "@/components/Common/Page";
import { QuestionnaireForm } from "@/components/Questionnaire/QuestionnaireForm";

import useAppHistory from "@/hooks/useAppHistory";

import query from "@/Utils/request/query";
import { EncounterHeader } from "@/pages/Encounters/EncounterHeader";
import encounterApi from "@/types/emr/encounter/encounterApi";

interface Props {
  facilityId?: string;
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
  const { t } = useTranslation();

  const { goBack } = useAppHistory();
  const { data: encounter } = useQuery({
    queryKey: ["encounter", encounterId],
    queryFn: query(encounterApi.get, {
      pathParams: { id: encounterId ?? "" },
      queryParams: { facility: facilityId! },
    }),
    enabled: !!encounterId,
  });

  return (
    <Page
      title={t("questionnaire_one")}
      className="block md:px-1 -mt-4"
      hideTitleOnPage
    >
      <div className="flex flex-col space-y-4">
        {encounter && (
          <EncounterHeader
            encounter={encounter}
            canWriteSelectedEncounter={false}
          />
        )}
        <Card className="mt-2">
          <CardContent className="lg:p-4 p-0">
            <QuestionnaireForm
              facilityId={facilityId}
              patientId={patientId}
              subjectType={subjectType}
              encounterId={encounterId}
              questionnaireSlug={questionnaireSlug}
              onSubmit={() => {
                if (encounterId && facilityId) {
                  navigate(
                    `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/updates`,
                  );
                } else if (facilityId) {
                  navigate(
                    `/facility/${facilityId}/patient/${patientId}/updates`,
                  );
                } else {
                  navigate(`/patient/${patientId}/updates`);
                }
              }}
              onCancel={() => goBack()}
            />
          </CardContent>
        </Card>
      </div>
    </Page>
  );
}
