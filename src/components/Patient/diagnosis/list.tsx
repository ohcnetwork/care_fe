import { useQuery } from "@tanstack/react-query";

import { Skeleton } from "@/components/ui/skeleton";

import { EncounterAccordionLayout } from "@/components/Patient/EncounterAccordionLayout";

import query from "@/Utils/request/query";
import { ACTIVE_DIAGNOSIS_CLINICAL_STATUS } from "@/types/emr/diagnosis/diagnosis";
import diagnosisApi from "@/types/emr/diagnosis/diagnosisApi";

import { DiagnosisTable } from "./DiagnosisTable";

interface DiagnosisListProps {
  patientId: string;
  encounterId?: string;
  className?: string;
  readOnly?: boolean;
}

export function DiagnosisList({
  patientId,
  encounterId,
  className = "",
  readOnly = false,
}: DiagnosisListProps) {
  const { data: diagnoses, isLoading: isDiagnosesLoading } = useQuery({
    queryKey: ["encounter_diagnosis", patientId, encounterId],
    queryFn: query(diagnosisApi.listDiagnosis, {
      pathParams: { patientId },
      queryParams: {
        category: "encounter_diagnosis,chronic_condition",
        clinical_status: ACTIVE_DIAGNOSIS_CLINICAL_STATUS.join(","),
        exclude_verification_status: "entered_in_error",
        ...(encounterId ? { encounter: encounterId } : {}),
      },
    }),
  });

  if (!diagnoses?.results.length) {
    return null;
  }

  return (
    <EncounterAccordionLayout
      title="diagnoses"
      readOnly={readOnly}
      className={className}
      editLink={!readOnly ? "questionnaire/diagnosis" : undefined}
    >
      <div className="space-y-2">
        {isDiagnosesLoading && (
          <>
            <Skeleton className="h-[100px] w-full" />
            <Skeleton className="h-[100px] w-full" />
          </>
        )}
        {diagnoses?.results?.length ? (
          <DiagnosisTable diagnoses={diagnoses.results} />
        ) : null}
      </div>
    </EncounterAccordionLayout>
  );
}
