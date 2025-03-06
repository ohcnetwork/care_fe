import { useQuery } from "@tanstack/react-query";
import { t } from "i18next";
import { navigate } from "raviger";

import { Card, CardContent } from "@/components/ui/card";

import Page from "@/components/Common/Page";
import PatientInfoCard from "@/components/Patient/PatientInfoCard";
import { QuestionnaireForm } from "@/components/Questionnaire/QuestionnaireForm";

import useAppHistory from "@/hooks/useAppHistory";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import { formatDateTime } from "@/Utils/utils";

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
  const { goBack } = useAppHistory();
  const { data: encounter } = useQuery({
    queryKey: ["encounter", encounterId],
    queryFn: query(routes.encounter.get, {
      pathParams: { id: encounterId ?? "" },
      queryParams: { facility: facilityId! },
    }),
    enabled: !!encounterId,
  });
  return (
    <Page title={t("questionnaire_one")}>
      <div className="flex flex-col space-y-4 mt-4 overflow-y-auto">
        {encounter && (
          <div className="size-full rounded-lg border bg-white text-black shadow">
            <PatientInfoCard
              patient={encounter.patient}
              encounter={encounter}
              fetchPatientData={() => {}}
              disableButtons={true}
            />

            <div className="flex flex-col justify-between gap-2 px-4 py-1 md:flex-row">
              <div className="font-base flex flex-col text-xs leading-relaxed text-secondary-700 md:text-right">
                <div className="flex items-center">
                  <span className="text-secondary-900">
                    {t("last_modified")}:{" "}
                  </span>
                  &nbsp;
                  {formatDateTime(encounter.modified_date)}
                </div>
              </div>
            </div>
          </div>
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
