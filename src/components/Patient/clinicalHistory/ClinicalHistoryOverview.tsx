import { useQuery } from "@tanstack/react-query";
import { ClockIcon, Droplet, FileQuestion } from "lucide-react";
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import Loading from "@/components/Common/Loading";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import diagnosisApi from "@/types/emr/diagnosis/diagnosisApi";
import medicationRequestApi from "@/types/emr/medicationRequest/medicationRequestApi";
import { BLOOD_GROUP_LABELS, BLOOD_GROUP_STYLES } from "@/types/emr/patient";
import symptomApi from "@/types/emr/symptom/symptomApi";

import { DiagnosisTable } from "./PastDiagnosis";
import { MedicationTable } from "./PastMedication";
import { SymptomTable } from "./PastSymptoms";

export function EmptyState({ type }: { type: string }) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-10 gap-2">
      <FileQuestion className="w-8 h-8" />
      <p className="text-sm">{t(`no_${type.toLowerCase()}_description`)}</p>
    </div>
  );
}

export default function ClinicalHistoryOverview(props: {
  patientId: string;
  facilityId: string;
}) {
  const { t } = useTranslation();
  const { patientId, facilityId } = props;

  const { data: patientData, isLoading: patientIsLoading } = useQuery({
    queryKey: ["patient", patientId],
    queryFn: query(routes.patient.getPatient, {
      pathParams: { id: patientId },
    }),
    enabled: !!patientId,
  });

  const { data: symptomData, isLoading: symptomIsLoading } = useQuery({
    queryKey: ["symptoms", patientId],
    queryFn: query(symptomApi.listSymptoms, {
      pathParams: { patientId },
      queryParams: { exclude_verification_status: "entered_in_error" },
    }),
    enabled: !!patientId,
  });

  const { data: medicationData, isLoading: medicationIsLoading } = useQuery({
    queryKey: ["medications", patientId],
    queryFn: query.paginated(medicationRequestApi.list, {
      pathParams: { patientId },
    }),
    enabled: !!patientId,
  });

  const { data: diagnosisData, isLoading: diagnosisIsLoading } = useQuery({
    queryKey: ["diagnoses", patientId],
    queryFn: query(diagnosisApi.listDiagnosis, {
      pathParams: { patientId },
      queryParams: { exclude_verification_status: "entered_in_error" },
    }),
    enabled: !!patientId,
  });

  const isLoading =
    patientIsLoading ||
    symptomIsLoading ||
    medicationIsLoading ||
    diagnosisIsLoading;

  if (isLoading) return <Loading />;
  if (!patientData) return <div>{t("no_patient_found")}</div>;

  return (
    <div className="max-w-screen-lg mx-auto space-y-8 py-6 px-4">
      <div className="flex flex-col gap-2">
        <div className="text-sm text-muted-foreground">
          {t("blood_group")} :
        </div>
        <Badge
          variant="outline"
          className={`flex items-center gap-1 w-fit whitespace-nowrap ${
            patientData.blood_group
              ? BLOOD_GROUP_STYLES[patientData.blood_group]
              : BLOOD_GROUP_STYLES.unknown
          }`}
        >
          <Droplet className="w-4 h-4" />
          {BLOOD_GROUP_LABELS[patientData.blood_group ?? "unknown"]}
        </Badge>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-sky-100 p-2 rounded-md">
              <img src="/images/symptoms-icon.svg" alt="symptoms-icon" />
            </div>
            <h2 className="text-base font-medium">{t("symptoms")}</h2>
          </div>
          {(symptomData?.results?.length ?? 0) > 0 && (
            <Button
              variant="outline"
              onClick={() =>
                navigate(
                  facilityId
                    ? `/facility/${facilityId}/patient/${patientId}/clinical_history/symptoms`
                    : `/organization/organizationId/patient/${patientId}/clinical_history/symptoms`,
                )
              }
              className="flex items-center gap-1"
            >
              <ClockIcon className="size-4" />
              {t("all_symptoms")}
            </Button>
          )}
        </div>
        {symptomData?.results?.length ? (
          <SymptomTable
            symptoms={symptomData.results}
            patientId={patientId}
            facilityId={facilityId}
          />
        ) : (
          <EmptyState type="Symptoms" />
        )}
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-sky-100 p-2 rounded-md">
              <img src="/images/diagnosis-icon.svg" alt="diagnosis-icon" />
            </div>
            <h2 className="text-base font-medium">{t("diagnoses")}</h2>
          </div>
          {(diagnosisData?.results?.length ?? 0) > 0 && (
            <Button
              variant="outline"
              onClick={() =>
                navigate(
                  facilityId
                    ? `/facility/${facilityId}/patient/${patientId}/clinical_history/diagnosis`
                    : `/organization/organizationId/patient/${patientId}/clinical_history/diagnosis`,
                )
              }
              className="flex items-center gap-1"
            >
              <ClockIcon className="size-4" />
              {t("all_diagnoses")}
            </Button>
          )}
        </div>
        {diagnosisData?.results?.length ? (
          <DiagnosisTable
            diagnosis={diagnosisData.results}
            patientId={patientId}
            facilityId={facilityId}
          />
        ) : (
          <EmptyState type="Diagnoses" />
        )}
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-pink-100 p-2 rounded-md">
              <img src="/images/medicines-icon.svg" alt="medicines-icon" />
            </div>
            <h2 className="text-base font-medium">{t("past_medication")}</h2>
          </div>
          {(medicationData?.results?.length ?? 0) > 0 && (
            <Button
              variant="outline"
              onClick={() =>
                navigate(
                  facilityId
                    ? `/facility/${facilityId}/patient/${patientId}/clinical_history/medication`
                    : `/organization/organizationId/patient/${patientId}/clinical_history/medication`,
                )
              }
              className="flex items-center gap-1"
            >
              <ClockIcon className="size-4" />
              {t("all_medications")}
            </Button>
          )}
        </div>
        {medicationData?.results?.length ? (
          <MedicationTable
            medicines={medicationData.results}
            patientId={patientId}
            facilityId={facilityId}
          />
        ) : (
          <EmptyState type="Medications" />
        )}
      </div>
    </div>
  );
}
