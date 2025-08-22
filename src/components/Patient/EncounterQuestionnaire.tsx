import { useQuery } from "@tanstack/react-query";
import { navigate } from "raviger";
import { Trans, useTranslation } from "react-i18next";

import { Card, CardContent } from "@/components/ui/card";

import Page from "@/components/Common/Page";
import { QuestionnaireForm } from "@/components/Questionnaire/QuestionnaireForm";

import { Badge } from "@/components/ui/badge";
import useAppHistory from "@/hooks/useAppHistory";

import query from "@/Utils/request/query";
import { PatientHeader } from "@/pages/Facility/services/serviceRequests/PatientHeader";
import encounterApi from "@/types/emr/encounter/encounterApi";
import dayjs from "dayjs";

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
          <>
            <PatientHeader
              patient={encounter.patient}
              facilityId={facilityId}
              className="bg-white shadow-sm rounded-sm"
            />
            {encounter.patient.deceased_datetime && (
              <div className="mt-2">
                <Card className="p-2 items-center rounded-sm shadow-sm border-red-400 bg-red-100 md:p-4 flex flex-wrap justify-center gap-4">
                  <Badge
                    variant="danger"
                    className="rounded-sm items-center px-1.5"
                  >
                    {t("deceased")}
                  </Badge>
                  <div className="text-sm font-semibold text-red-950">
                    <Trans
                      i18nKey="passed_away_on"
                      values={{
                        date: dayjs(encounter.patient.deceased_datetime).format(
                          "MMMM DD, YYYY",
                        ),
                        time: dayjs(encounter.patient.deceased_datetime).format(
                          "hh:mm A",
                        ),
                      }}
                    ></Trans>
                  </div>
                </Card>
              </div>
            )}
          </>
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
