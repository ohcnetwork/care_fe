import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import PrintLoading from "@/CAREUI/misc/PrintLoading";
import TypstPrintPreview from "@/CAREUI/misc/TypstPrintPreview";

import { buildQuestionnaireResponsePrintContent } from "@/components/Facility/ConsultationDetails/questionnaireResponsePrintData";
import { useCurrentFacilitySilently } from "@/pages/Facility/utils/useCurrentFacility";
import encounterApi from "@/types/emr/encounter/encounterApi";
import patientApi from "@/types/emr/patient/patientApi";
import { PrintTemplateType } from "@/types/facility/printTemplate";
import questionnaireResponseApi from "@/types/questionnaire/questionnaireResponseApi";
import query from "@/Utils/request/query";

type PrintQuestionnaireResponseProps = {
  questionnaireResponseId: string;
  encounterId?: string;
  patientId: string;
  facilityId?: string;
};

export function PrintQuestionnaireResponse({
  questionnaireResponseId,
  encounterId,
  patientId,
  facilityId,
}: PrintQuestionnaireResponseProps) {
  const { t } = useTranslation();
  const { facility } = useCurrentFacilitySilently();

  const { data: encounter, isLoading: isLoadingEncounter } = useQuery({
    queryKey: ["encounter", encounterId, facilityId],
    queryFn: query(encounterApi.get, {
      pathParams: { id: encounterId! },
      queryParams: { facility: facilityId },
    }),
    enabled: !!(encounterId && facilityId),
  });

  const { data: patient, isLoading: isLoadingPatient } = useQuery({
    queryKey: ["patient", patientId],
    queryFn: query(patientApi.get, {
      pathParams: {
        id: patientId,
      },
    }),
    enabled: !(encounterId && facilityId),
  });

  const { data: questionnaireResponse } = useQuery({
    queryKey: [
      "questionnaire_response",
      questionnaireResponseId,
      encounterId,
      patientId,
    ],
    queryFn: query(questionnaireResponseApi.get, {
      pathParams: { patientId, responseId: questionnaireResponseId },
    }),
  });

  if (!questionnaireResponse || isLoadingEncounter || isLoadingPatient) {
    return <PrintLoading />;
  }

  return (
    <TypstPrintPreview
      template="questionnaire-response"
      title={t("questionnaire_response_logs")}
      content={buildQuestionnaireResponsePrintContent({
        encounter,
        patient: encounter?.patient ?? patient,
        questionnaire: questionnaireResponse.questionnaire,
        responses: [questionnaireResponse],
        t,
      })}
      facility={facility}
      templateSlug={PrintTemplateType.questionnaire_response_logs}
    />
  );
}
