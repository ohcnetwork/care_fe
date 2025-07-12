import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";

import { TableSkeleton } from "@/components/Common/SkeletonLoading";
import { EmptyState } from "@/components/Medicine/MedicationRequestTable";
import { EncounterAccordionLayout } from "@/components/Patient/EncounterAccordionLayout";

import query from "@/Utils/request/query";
import {
  ACTIVE_DIAGNOSIS_CLINICAL_STATUS,
  Diagnosis,
} from "@/types/emr/diagnosis/diagnosis";
import diagnosisApi from "@/types/emr/diagnosis/diagnosisApi";

import { DiagnosisTable } from "./DiagnosisTable";

interface DiagnosisListProps {
  patientId: string;
  encounterId?: string;
  className?: string;
  readOnly?: boolean;
  showTimeline?: boolean;
}

interface GroupedDiagnoses {
  [year: string]: {
    [date: string]: Diagnosis[];
  };
}

export function DiagnosisList({
  patientId,
  encounterId,
  className = "",
  readOnly = false,
  showTimeline = false,
}: DiagnosisListProps) {
  const { t } = useTranslation();
  const { data: diagnoses, isLoading: isDiagnosesLoading } = useQuery({
    queryKey: ["encounter_diagnosis", patientId, encounterId],
    queryFn: query(diagnosisApi.listDiagnosis, {
      pathParams: { patientId },
      queryParams: {
        category: "encounter_diagnosis,chronic_condition",
        clinical_status: ACTIVE_DIAGNOSIS_CLINICAL_STATUS.join(","),
        exclude_verification_status: "entered_in_error",
        ...(encounterId ? { encounter: encounterId } : {}),
        ordering: "-created_date",
      },
    }),
  });

  if (isDiagnosesLoading) {
    return <TableSkeleton count={5} />;
  }

  if (!diagnoses?.results.length) {
    if (showTimeline) {
      return (
        <EmptyState
          message={t("no_diagnoses")}
          description={t("no_diagnoses_recorded_description")}
        />
      );
    }
    return null;
  }

  if (showTimeline) {
    const groupedByYear = diagnoses.results.reduce((acc, diagnosis) => {
      const dateStr = format(diagnosis.created_date, "dd MMMM, yyyy");
      const year = format(diagnosis.created_date, "yyyy");
      acc[year] ??= {};
      acc[year][dateStr] ??= [];
      acc[year][dateStr].push(diagnosis);
      return acc;
    }, {} as GroupedDiagnoses);

    return (
      <div className="space-y-8">
        {Object.entries(groupedByYear).map(([year, groupedByDate]) => {
          return (
            <div key={year}>
              <h2 className="text-sm font-medium text-indigo-700 border-y border-gray-300 py-2 w-fit pr-10">
                {year}
              </h2>
              <div className="border-l border-gray-300 pt-5 ml-4">
                {Object.entries(groupedByDate).map(([date, diagnoses]) => {
                  return (
                    <div key={date} className="pb-6">
                      <div className="flex items-start gap-4">
                        <div className="flex flex-col items-center h-full">
                          <div className="size-3 bg-cyan-300 ring-1 ring-cyan-700 rounded-full flex-shrink-0 -ml-1.5 mt-1"></div>
                        </div>

                        <div className="space-y-3 overflow-auto w-full">
                          <h3 className="text-sm font-medium text-indigo-700">
                            {format(date, "dd MMMM, yyyy")}
                          </h3>
                          <DiagnosisTable diagnoses={diagnoses} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <EncounterAccordionLayout
      title="diagnoses"
      readOnly={readOnly}
      className={className}
      editLink={!readOnly ? "questionnaire/diagnosis" : undefined}
    >
      <div className="space-y-2">
        {diagnoses?.results?.length ? (
          <DiagnosisTable diagnoses={diagnoses.results} />
        ) : null}
      </div>
    </EncounterAccordionLayout>
  );
}
