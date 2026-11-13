import { useQuery } from "@tanstack/react-query";
import { navigate, useQueryParams } from "raviger";
import { useTranslation } from "react-i18next";

import { Card, CardContent } from "@/components/ui/card";

import Page from "@/components/Common/Page";
import { QuestionnaireForm } from "@/components/Questionnaire/QuestionnaireForm";

import query from "@/Utils/request/query";
import {
  PatientDeceasedInfo,
  PatientHeader,
} from "@/components/Patient/PatientHeader";
import encounterApi from "@/types/emr/encounter/encounterApi";
import { resolveEncounterReturnTo } from "@/Utils/returnTo";

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
  const [{ return_to: returnTo }] = useQueryParams();
  const exitTarget =
    facilityId && encounterId
      ? resolveEncounterReturnTo(returnTo, facilityId, patientId, encounterId)
      : facilityId
        ? `/facility/${facilityId}/patient/${patientId}/updates`
        : `/patient/${patientId}/updates`;

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
          <div className="flex flex-col gap-2">
            <PatientHeader
              patient={encounter.patient}
              facilityId={facilityId}
              className="bg-white shadow-sm rounded-sm"
            />
            <PatientDeceasedInfo patient={encounter.patient} />
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
              returnTo={facilityId && encounterId ? exitTarget : undefined}
              onSubmit={() => navigate(exitTarget, { replace: true })}
            />
          </CardContent>
        </Card>
      </div>
    </Page>
  );
}
