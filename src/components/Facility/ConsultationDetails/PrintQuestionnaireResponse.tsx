import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import PrintPreview from "@/CAREUI/misc/PrintPreview";

import {
  EncounterDetails,
  ResponseCard,
} from "@/components/Facility/ConsultationDetails/PrintAllQuestionnaireResponses";

import query from "@/Utils/request/query";
import { useCurrentFacilitySilently } from "@/pages/Facility/utils/useCurrentFacility";
import encounterApi from "@/types/emr/encounter/encounterApi";
import patientApi from "@/types/emr/patient/patientApi";
import { PrintTemplateType } from "@/types/facility/printTemplate";
import questionnaireResponseApi from "@/types/questionnaire/questionnaireResponseApi";

type PrintQuestionnaireResponseProps = {
  questionnaireResponseId: string;
  encounterId: string;
  patientId: string;
  facilityId: string;
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

  const questionnaire = questionnaireResponse?.questionnaire;

  return (
    <PrintPreview
      title={t("questionnaire_response_logs")}
      disabled={
        !questionnaireResponse || isLoadingEncounter || isLoadingPatient
      }
      facility={facility}
      templateSlug={PrintTemplateType.questionnaire_response_logs}
    >
      <div className="max-w-5xl mx-auto">
        <div>
          <div className="text-center sm:text-left sm:order-1 print:text-left mb-4 pb-2 border-b border-gray-200">
            <h2 className="text-gray-500 uppercase text-sm tracking-wide mt-1 font-semibold">
              {t("questionnaire_response_logs")}
            </h2>
          </div>

          <EncounterDetails
            encounter={encounter}
            patient={encounter?.patient ?? patient}
          />

          <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start mb-4 pb-2 border-b border-gray-200">
            <div className="text-center sm:text-left sm:order-1">
              <h3 className="text-lg font-semibold">{questionnaire?.title}</h3>
              <p className="text-gray-500 text-sm tracking-wide mt-1">
                {questionnaire?.description}
              </p>
            </div>
          </div>

          <div className="w-full">
            <ResponseCard item={questionnaireResponse} />
          </div>
        </div>
      </div>
    </PrintPreview>
  );
}
