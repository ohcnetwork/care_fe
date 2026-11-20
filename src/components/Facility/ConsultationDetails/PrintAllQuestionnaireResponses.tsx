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

type PrintAllQuestionnaireResponsesProps = {
  questionnaireId: string;
  patientId: string;
  encounterId?: string;
  facilityId?: string;
};

export function PrintAllQuestionnaireResponses({
  questionnaireId,
  encounterId,
  patientId,
  facilityId,
}: PrintAllQuestionnaireResponsesProps) {
  const { t } = useTranslation();
  const { facility } = useCurrentFacilitySilently();

  const { data: encounter, isLoading: isLoadingEncounter } = useQuery({
    queryKey: ["encounter", encounterId, facilityId],
    queryFn: query(encounterApi.get, {
      pathParams: { id: encounterId! },
      queryParams: { facility: facilityId },
    }),
    enabled: !!encounterId && !!facilityId,
  });

  const { data: patient, isLoading: isLoadingPatient } = useQuery({
    queryKey: ["patient", patientId],
    queryFn: query(patientApi.get, {
      pathParams: {
        id: patientId,
      },
    }),
    enabled: !(!!encounterId && !!facilityId),
  });

  const { data: questionnaireResponses, isLoading } = useQuery({
    queryKey: [
      "questionnaire_responses",
      questionnaireId,
      encounterId,
      patientId,
    ],
    queryFn: query(questionnaireResponseApi.list, {
      queryParams: {
        questionnaire: questionnaireId,
        encounter: encounterId,
        only_unstructured: true,
      },
      pathParams: { patientId },
    }),
  });

  if (isLoading || isLoadingEncounter || isLoadingPatient) {
    return <PrintLoading />;
  }

  return (
    <TypstPrintPreview
      template="questionnaire-response"
      title={t("questionnaire_response_logs")}
      content={buildQuestionnaireResponsePrintContent({
        encounter,
        patient: encounter?.patient ?? patient,
        questionnaire: questionnaireResponses?.results?.[0]?.questionnaire,
        responses: questionnaireResponses?.results ?? [],
        t,
      })}
      facility={facility}
      templateSlug={PrintTemplateType.questionnaire_response_logs}
    />
  );
}
