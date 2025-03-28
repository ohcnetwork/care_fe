import careConfig from "@careConfig";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { t } from "i18next";
import { Loader } from "lucide-react";
import { useEffect } from "react";
import { formatPhoneNumberIntl } from "react-phone-number-input";
import { toast } from "sonner";

import PrintPreview from "@/CAREUI/misc/PrintPreview";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import Loading from "@/components/Common/Loading";
import PrintTable from "@/components/Common/PrintTable";
import QuestionnaireResponsesList from "@/components/Facility/ConsultationDetails/QuestionnaireResponsesList";
import { getFrequencyDisplay } from "@/components/Medicine/MedicationsTable";
import { formatDosage, formatSig } from "@/components/Medicine/utils";

import useAppHistory from "@/hooks/useAppHistory";

import { getPermissions } from "@/common/Permissions";

import api from "@/Utils/request/api";
import query from "@/Utils/request/query";
import { formatDateTime, formatName, formatPatientAge } from "@/Utils/utils";
import { usePermissions } from "@/context/PermissionContext";
import allergyIntoleranceApi from "@/types/emr/allergyIntolerance/allergyIntoleranceApi";
import diagnosisApi from "@/types/emr/diagnosis/diagnosisApi";
import { completedEncounterStatus } from "@/types/emr/encounter";
import medicationRequestApi from "@/types/emr/medicationRequest/medicationRequestApi";
import medicationStatementApi from "@/types/emr/medicationStatement/medicationStatementApi";
import symptomApi from "@/types/emr/symptom/symptomApi";

interface TreatmentSummaryProps {
  facilityId: string;
  encounterId: string;

  patientId: string;
}

const SectionLayout = ({
  children,
  title,
}: {
  title: string;
  children: React.ReactNode;
}) => {
  return (
    <Card className="rounded-sm shadow-none border-none">
      <CardHeader className="flex justify-between flex-row px-0 py-2 ">
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-0 py-0">{children}</CardContent>
    </Card>
  );
};

export default function TreatmentSummary({
  facilityId,
  encounterId,
  patientId,
}: TreatmentSummaryProps) {
  const { data: encounter, isLoading: encounterLoading } = useQuery({
    queryKey: ["encounter", encounterId],
    queryFn: query(api.encounter.get, {
      pathParams: { id: encounterId },
      queryParams: { facility: facilityId },
    }),
    enabled: !!encounterId && !!facilityId,
  });

  const { goBack } = useAppHistory();
  const { hasPermission } = usePermissions();
  const { canViewEncounter, canViewClinicalData } = getPermissions(
    hasPermission,
    encounter?.permissions ?? [],
  );

  const canAccess = canViewEncounter || canViewClinicalData;

  useEffect(() => {
    if (!canAccess) {
      toast.error(t("no_permission_to_view_page"));
      goBack();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canAccess]);
  const { data: allergies, isLoading: allergiesLoading } = useQuery({
    queryKey: ["allergies", patientId, encounterId],
    queryFn: query.paginated(allergyIntoleranceApi.getAllergy, {
      pathParams: { patientId },
      queryParams: {
        encounter: (
          encounter?.status
            ? completedEncounterStatus.includes(encounter.status)
            : false
        )
          ? encounterId
          : undefined,
      },
      pageSize: 100,
    }),
  });

  const { data: symptoms, isLoading: symptomsLoading } = useQuery({
    queryKey: ["symptoms", patientId, encounterId],
    queryFn: query.paginated(symptomApi.listSymptoms, {
      pathParams: { patientId },
      queryParams: { encounter: encounterId },
      pageSize: 100,
    }),
    enabled: !!patientId && !!encounterId,
  });

  const { data: diagnoses, isLoading: diagnosesLoading } = useQuery({
    queryKey: ["diagnosis", patientId, encounterId],
    queryFn: query.paginated(diagnosisApi.listDiagnosis, {
      pathParams: { patientId },
      queryParams: {
        encounter: encounterId,
        category: "encounter_diagnosis,chronic_condition",
      },
      pageSize: 100,
    }),
    enabled: !!patientId && !!encounterId,
  });

  const { data: medications, isLoading: medicationsLoading } = useQuery({
    queryKey: ["medication_requests", patientId, encounterId],
    queryFn: query.paginated(medicationRequestApi.list, {
      pathParams: { patientId },
      queryParams: { encounter: encounterId },
      pageSize: 100,
    }),
    enabled: !!encounterId,
  });
  const { data: medicationStatement, isLoading: medicationStatementLoading } =
    useQuery({
      queryKey: ["medication_statements", patientId],
      queryFn: query.paginated(medicationStatementApi.list, {
        pathParams: { patientId },
        pageSize: 100,
      }),
      enabled: !!patientId,
    });

  if (encounterLoading) {
    return <Loading />;
  }

  if (!encounter) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-lg border-2 border-gray-200 border-dashed p-4 text-gray-500">
        {t("no_patient_record_found")}
      </div>
    );
  }

  const isLoading =
    encounterLoading ||
    allergiesLoading ||
    diagnosesLoading ||
    symptomsLoading ||
    medicationsLoading ||
    medicationStatementLoading;

  if (isLoading) {
    return (
      <PrintPreview
        title={`${t("treatment_summary")} - ${encounter.patient.name}`}
      >
        <div className="flex items-center justify-center h-full">
          <Loader />
        </div>
      </PrintPreview>
    );
  }

  return (
    <PrintPreview
      title={`${t("treatment_summary")} - ${encounter.patient.name}`}
    >
      <div className="min-h-screen py-2 max-w-4xl mx-auto">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-start pb-2 border-b border-gray-200">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
            <div className="space-y-3">
              <div className="grid grid-cols-[10rem_auto_1fr] md:grid-cols-[8rem_auto_1fr] items-center">
                <span className="text-gray-600">{t("patient")}</span>
                <span className="text-gray-600">:</span>
                <span className="font-semibold break-words">
                  {encounter.patient.name}
                </span>
              </div>
              <div className="grid grid-cols-[10rem_auto_1fr] md:grid-cols-[8rem_auto_1fr] items-center">
                <span className="text-gray-600">{`${t("age")} / ${t("sex")}`}</span>
                <span className="text-gray-600">:</span>
                <span className="font-semibold break-words">
                  {`${formatPatientAge(encounter.patient, true)}, ${t(`GENDER__${encounter.patient.gender}`)}`}
                </span>
              </div>
              <div className="grid grid-cols-[10rem_auto_1fr] md:grid-cols-[8rem_auto_1fr] items-center">
                <span className="text-gray-600">{t("encounter_class")}</span>
                <span className="text-gray-600">:</span>
                <span className="font-semibold">
                  {t(`encounter_class__${encounter.encounter_class}`)}
                </span>
              </div>
              <div className="grid grid-cols-[10rem_auto_1fr] md:grid-cols-[8rem_auto_1fr] items-center">
                <span className="text-gray-600">{t("priority")}</span>
                <span className="text-gray-600">:</span>
                <span className="font-semibold">
                  {t(`encounter_priority__${encounter.priority}`)}
                </span>
              </div>

              {encounter.hospitalization?.admit_source && (
                <div className="grid grid-cols-[10rem_auto_1fr] md:grid-cols-[8rem_auto_1fr] items-center">
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
                <div className="grid grid-cols-[10rem_auto_1fr] md:grid-cols-[8rem_auto_1fr] items-center">
                  <span className="text-gray-600">{t("readmission")}</span>
                  <span className="text-gray-600">:</span>
                  <span className="font-semibold">{t("yes")}</span>
                </div>
              )}
              {encounter.hospitalization?.diet_preference && (
                <div className="grid grid-cols-[10rem_auto_1fr] md:grid-cols-[8rem_auto_1fr] items-center">
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

            {/* Right Column */}
            <div className="space-y-3">
              <div className="grid grid-cols-[10rem_auto_1fr] md:grid-cols-[8rem_auto_1fr] items-center">
                <span className="text-gray-600">{t("mobile_number")}</span>
                <span className="text-gray-600">:</span>
                <span className="font-semibold break-words">
                  {encounter.patient.phone_number &&
                    formatPhoneNumberIntl(encounter.patient.phone_number)}
                </span>
              </div>

              {encounter.period?.start && (
                <div className="grid grid-cols-[10rem_auto_1fr] md:grid-cols-[8rem_auto_1fr] items-center">
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

              <div className="grid grid-cols-[10rem_auto_1fr] md:grid-cols-[8rem_auto_1fr] items-center">
                <span className="text-gray-600">{t("status")}</span>
                <span className="text-gray-600">:</span>
                <span className="font-semibold">
                  {t(`encounter_status__${encounter.status}`)}
                </span>
              </div>

              <div className="grid grid-cols-[10rem_auto_1fr] md:grid-cols-[8rem_auto_1fr] items-center">
                <span className="text-gray-600">{t("consulting_doctor")}</span>
                <span className="text-gray-600">:</span>
                <span className="font-semibold">
                  {formatName(encounter.created_by)}
                </span>
              </div>

              {encounter.external_identifier && (
                <div className="grid grid-cols-[10rem_auto_1fr] md:grid-cols-[8rem_auto_1fr] items-center">
                  <span className="text-gray-600">{t("external_id")}</span>
                  <span className="text-gray-600">:</span>
                  <span className="font-semibold">
                    {encounter.external_identifier}
                  </span>
                </div>
              )}

              {encounter.hospitalization?.discharge_disposition && (
                <div className="grid grid-cols-[10rem_auto_1fr] md:grid-cols-[8rem_auto_1fr] items-center">
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
            {allergies?.count != 0 && (
              <SectionLayout title={t("allergies")}>
                <PrintTable
                  headers={[
                    { key: "allergen" },
                    { key: "status" },
                    { key: "criticality" },
                    { key: "verification" },
                    { key: "notes" },
                    { key: "logged_by" },
                  ]}
                  rows={allergies?.results.map((allergy) => ({
                    allergen: allergy.code.display,
                    status: t(allergy.clinical_status),
                    criticality: t(allergy.criticality),
                    verification: t(allergy.verification_status),
                    notes: allergy.note,
                    logged_by: formatName(allergy.created_by),
                  }))}
                />
              </SectionLayout>
            )}

            {/* Symptoms */}
            {symptoms?.count != 0 && (
              <SectionLayout title={t("symptoms")}>
                <PrintTable
                  headers={[
                    { key: "symptom" },
                    { key: "severity" },
                    { key: "status" },
                    { key: "verification" },
                    { key: "onset" },
                    { key: "notes" },
                    { key: "logged_by" },
                  ]}
                  rows={symptoms?.results?.map((symptom) => ({
                    symptom: symptom.code.display,
                    severity: t(symptom.severity),
                    status: t(symptom.clinical_status),
                    verification: t(symptom.verification_status),
                    onset: symptom.onset?.onset_datetime
                      ? new Date(
                          symptom.onset.onset_datetime,
                        ).toLocaleDateString()
                      : "-",
                    notes: symptom.note,
                    logged_by: formatName(symptom.created_by),
                  }))}
                />
              </SectionLayout>
            )}

            {/* Diagnoses */}
            {diagnoses?.count != 0 && (
              <SectionLayout title={t("diagnoses")}>
                <PrintTable
                  headers={[
                    { key: "diagnosis" },
                    { key: "status" },
                    { key: "verification" },
                    { key: "onset" },
                    { key: "notes" },
                    { key: "logged_by" },
                  ]}
                  rows={diagnoses?.results.map((diagnosis) => ({
                    diagnosis: diagnosis.code.display,
                    status: t(diagnosis.clinical_status),
                    verification: t(diagnosis.verification_status),
                    onset: diagnosis.onset?.onset_datetime
                      ? new Date(
                          diagnosis.onset.onset_datetime,
                        ).toLocaleDateString()
                      : undefined,
                    notes: diagnosis.note,
                    logged_by: formatName(diagnosis.created_by),
                  }))}
                />
              </SectionLayout>
            )}

            {/* Medications */}
            {medications?.count != 0 && (
              <SectionLayout title={t("medications")}>
                <PrintTable
                  headers={[
                    { key: "medicine" },
                    { key: "status" },
                    { key: "dosage" },
                    { key: "frequency" },
                    { key: "duration" },
                    { key: "instructions" },
                  ]}
                  rows={medications?.results.map((medication) => {
                    const instruction = medication.dosage_instruction[0];
                    const frequency = getFrequencyDisplay(instruction?.timing);
                    const dosage = formatDosage(instruction);
                    const duration =
                      instruction?.timing?.repeat?.bounds_duration;
                    const remarks = formatSig(instruction);
                    const notes = medication.note;
                    return {
                      medicine: medication.medication?.display,
                      status: t(`medication_status_${medication.status}`),
                      dosage: dosage,
                      frequency: instruction?.as_needed_boolean
                        ? `${t("as_needed_prn")} (${instruction?.as_needed_for?.display ?? "-"})`
                        : (frequency?.meaning ?? "-") +
                          (instruction?.additional_instruction?.[0]?.display
                            ? `, ${instruction.additional_instruction[0].display}`
                            : ""),
                      duration: duration
                        ? `${duration.value} ${duration.unit}`
                        : "-",
                      instructions: `${remarks || "-"}${notes ? ` (${t("note")}: ${notes})` : ""}`,
                    };
                  })}
                />
              </SectionLayout>
            )}

            {/* Medication Statements */}
            {medicationStatement?.count != 0 && (
              <SectionLayout title={t("ongoing_medications")}>
                <PrintTable
                  headers={[
                    { key: "medication" },
                    { key: "dosage" },
                    { key: "status" },
                    {
                      key: "medication_taken_between",
                    },
                    { key: "reason" },
                    { key: "notes" },
                    { key: "logged_by" },
                  ]}
                  rows={medicationStatement?.results.map((medication) => ({
                    medication:
                      medication.medication.display ??
                      medication.medication.code,
                    dosage: medication.dosage_text,
                    status: t(`medication_status_${medication.status}`),
                    medication_taken_between: [
                      medication.effective_period?.start,
                      medication.effective_period?.end,
                    ]
                      .map((date) => formatDateTime(date))
                      .join(" - "),
                    reason: medication.reason,
                    notes: medication.note,
                    logged_by: formatName(medication.created_by),
                  }))}
                />
              </SectionLayout>
            )}
          </div>

          {/* Questionnaire Responses Section */}
          <div>
            <QuestionnaireResponsesList
              encounter={encounter}
              patientId={encounter.patient.id}
              isPrintPreview={true}
              onlyUnstructured={true}
              canAccess={canAccess}
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
