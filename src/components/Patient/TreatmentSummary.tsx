import careConfig from "@careConfig";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { t } from "i18next";

import PrintPreview from "@/CAREUI/misc/PrintPreview";

import QuestionnaireResponsesList from "@/components/Facility/ConsultationDetails/QuestionnaireResponsesList";
import { MedicationsTable } from "@/components/Medicine/MedicationsTable";
import { AllergyList } from "@/components/Patient/allergy/list";
import { DiagnosisList } from "@/components/Patient/diagnosis/list";
import { SymptomsList } from "@/components/Patient/symptoms/list";

import api from "@/Utils/request/api";
import query from "@/Utils/request/query";
import { formatName, formatPatientAge } from "@/Utils/utils";

import { MedicationStatementList } from "./MedicationStatementList";

interface TreatmentSummaryProps {
  facilityId: string;
  encounterId: string;
}

export default function TreatmentSummary({
  facilityId,
  encounterId,
}: TreatmentSummaryProps) {
  const { data: encounter } = useQuery({
    queryKey: ["encounter", encounterId],
    queryFn: query(api.encounter.get, {
      pathParams: { id: encounterId },
      queryParams: { facility: facilityId },
    }),
  });

  if (!encounter) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-lg border-2 border-dashed p-4 text-gray-500">
        {t("no_patient_record_found")}
      </div>
    );
  }

  return (
    <PrintPreview
      title={`${t("treatment_summary")} - ${encounter.patient.name}`}
    >
      <div className="min-h-screen bg-white py-2 max-w-4xl mx-auto">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-start pb-2 border-b">
            <div className="space-y-4 flex-1">
              <div>
                <h1 className="text-3xl font-semibold">
                  {encounter.facility?.name}
                </h1>
                <h2 className="text-gray-500 uppercase text-sm tracking-wide font-semibold mt-1">
                  {t("treatment_summary")}
                </h2>
              </div>
            </div>
            <img
              src={careConfig.mainLogo?.dark}
              alt="Care Logo"
              className="h-10 w-auto object-contain ml-6"
            />
          </div>

          {/* Patient Details */}
          <div className="grid grid-cols-2 gap-x-12 gap-y-6">
            <div className="space-y-3">
              <div className="grid grid-cols-[8rem,0.25rem,1fr] items-center">
                <span className="text-gray-600">{t("patient")}</span>
                <span className="text-gray-600">:</span>
                <span className="font-semibold">{encounter.patient.name}</span>
              </div>
              <div className="grid grid-cols-[8rem,0.25rem,1fr] items-center">
                <span className="text-gray-600">{`${t("age")} / ${t("sex")}`}</span>
                <span className="text-gray-600">:</span>
                <span className="font-semibold">
                  {`${formatPatientAge(encounter.patient, true)}, ${t(`GENDER__${encounter.patient.gender}`)}`}
                </span>
              </div>
              <div className="grid grid-cols-[8rem,0.25rem,1fr] items-center">
                <span className="text-gray-600">{t("encounter_class")}</span>
                <span className="text-gray-600">:</span>
                <span className="font-semibold">
                  {t(`encounter_class__${encounter.encounter_class}`)}
                </span>
              </div>
              <div className="grid grid-cols-[8rem,0.25rem,1fr] items-center">
                <span className="text-gray-600">{t("priority")}</span>
                <span className="text-gray-600">:</span>
                <span className="font-semibold">
                  {t(`encounter_priority__${encounter.priority}`)}
                </span>
              </div>
              {encounter.hospitalization?.admit_source && (
                <div className="grid grid-cols-[8rem,0.25rem,1fr] items-center">
                  <span className="text-gray-600">{t("admission_source")}</span>
                  <span className="text-gray-600">:</span>
                  <span className="font-semibold">
                    {t(
                      `encounter_admit_sources__${encounter.hospitalization.admit_source}`,
                    )}
                  </span>
                </div>
              )}
              {encounter.hospitalization?.re_admission && (
                <div className="grid grid-cols-[8rem,0.25rem,1fr] items-center">
                  <span className="text-gray-600">{t("readmission")}</span>
                  <span className="text-gray-600">:</span>
                  <span className="font-semibold">{t("yes")}</span>
                </div>
              )}
              {encounter.hospitalization?.diet_preference && (
                <div className="grid grid-cols-[8rem,0.25rem,1fr] items-center">
                  <span className="text-gray-600">{t("diet_preference")}</span>
                  <span className="text-gray-600">:</span>
                  <span className="font-semibold">
                    {t(
                      `encounter_diet_preference__${encounter.hospitalization.diet_preference}`,
                    )}
                  </span>
                </div>
              )}
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-[8rem,0.25rem,1fr] items-center">
                <span className="text-gray-600">{t("mobile_number")}</span>
                <span className="text-gray-600">:</span>
                <span className="font-semibold">
                  {encounter.patient.phone_number}
                </span>
              </div>
              {encounter.period?.start && (
                <div className="grid grid-cols-[8rem,0.25rem,1fr] items-center">
                  <span className="text-gray-600">{t("encounter_date")}</span>
                  <span className="text-gray-600">:</span>
                  <span className="font-semibold">
                    {format(
                      new Date(encounter.period.start),
                      "dd MMM yyyy, EEEE",
                    )}
                  </span>
                </div>
              )}
              <div className="grid grid-cols-[8rem,0.25rem,1fr] items-center">
                <span className="text-gray-600">{t("status")}</span>
                <span className="text-gray-600">:</span>
                <span className="font-semibold">
                  {t(`encounter_status__${encounter.status}`)}
                </span>
              </div>
              <div className="grid grid-cols-[8rem,0.25rem,1fr] items-center">
                <span className="text-gray-600">{t("consulting_doctor")}</span>
                <span className="text-gray-600">:</span>
                <span className="font-semibold">
                  {formatName(encounter.created_by)}
                </span>
              </div>
              {encounter.external_identifier && (
                <div className="grid grid-cols-[8rem,0.25rem,1fr] items-center">
                  <span className="text-gray-600">{t("external_id")}</span>
                  <span className="text-gray-600">:</span>
                  <span className="font-semibold">
                    {encounter.external_identifier}
                  </span>
                </div>
              )}
              {encounter.hospitalization?.discharge_disposition && (
                <div className="grid grid-cols-[8rem,0.25rem,1fr] items-center">
                  <span className="text-gray-600">
                    {t("discharge_disposition")}
                  </span>
                  <span className="text-gray-600">:</span>
                  <span className="font-semibold">
                    {t(
                      `encounter_discharge_disposition__${encounter.hospitalization.discharge_disposition}`,
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Medical Information */}
          <div className="space-y-6">
            {/* Allergies */}
            <AllergyList
              patientId={encounter.patient.id}
              encounterId={encounterId}
              className="border-none shadow-none"
              isPrintPreview={true}
            />

            {/* Symptoms */}
            <SymptomsList
              patientId={encounter.patient.id}
              encounterId={encounterId}
              className="border-none shadow-none"
              isPrintPreview={true}
            />

            {/* Diagnoses */}
            <DiagnosisList
              patientId={encounter.patient.id}
              encounterId={encounterId}
              className="border-none shadow-none"
              isPrintPreview={true}
            />

            {/* Medications */}
            <div className="border-none shadow-none space-y-2">
              <p className="text-sm font-semibold text-gray-950">
                {t("medications")}
              </p>
              <MedicationsTable
                patientId={encounter.patient.id}
                encounterId={encounterId}
              />
            </div>
          </div>

          {/* Medication Statements */}
          <MedicationStatementList
            patientId={encounter.patient.id}
            className="border-none shadow-none"
            isPrintPreview={true}
          />

          {/* Questionnaire Responses Section */}
          <div>
            <QuestionnaireResponsesList
              encounter={encounter}
              patientId={encounter.patient.id}
              isPrintPreview={true}
              onlyUnstructured={true}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 space-y-1 pt-2 text-[10px] text-gray-500 flex justify-between">
          <p>
            {t("generated_on")} {format(new Date(), "PPP 'at' p")}
          </p>
        </div>
      </div>
    </PrintPreview>
  );
}
