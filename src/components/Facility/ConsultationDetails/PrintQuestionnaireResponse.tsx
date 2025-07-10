import careConfig from "@careConfig";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import PrintPreview from "@/CAREUI/misc/PrintPreview";

import {
  EncounterDetails,
  ResponseCard,
} from "@/components/Facility/ConsultationDetails/PrintQuestionnaireQuestionnaireResponses";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import encounterApi from "@/types/emr/encounter/encounterApi";
import patientApi from "@/types/emr/patient/patientApi";

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

  const { data: encounter } = useQuery({
    queryKey: ["encounter", encounterId, facilityId],
    queryFn: query(encounterApi.getEncounter, {
      pathParams: { id: encounterId! },
      queryParams: { facility: facilityId },
    }),
    enabled: !!(encounterId && facilityId),
  });

  const { data: patient } = useQuery({
    queryKey: ["patient", patientId],
    queryFn: query(patientApi.getPatient, {
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
    queryFn: query(routes.getQuestionnaireResponse, {
      pathParams: { patientId, responseId: questionnaireResponseId },
    }),
  });

  const questionnaire = questionnaireResponse?.questionnaire;

  return (
    <PrintPreview
      title={t("questionnaire_response_logs")}
      disabled={!questionnaireResponse}
    >
      <div className="min-h-screen md:p-2 max-w-4xl mx-auto">
        <div>
          <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start mb-4 pb-2 border-b border-gray-200">
            <img
              src={careConfig.mainLogo?.dark}
              alt="Care Logo"
              className="h-10 w-auto object-contain mb-2 sm:mb-0 sm:order-2"
            />
            <div className="text-center sm:text-left sm:order-1">
              <h1 className="text-3xl font-semibold">
                {encounter?.facility?.name ?? patient?.name}
              </h1>
              <h2 className="text-gray-500 uppercase text-sm tracking-wide mt-1 font-semibold">
                {t("questionnaire_response_logs")}
              </h2>
            </div>
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
