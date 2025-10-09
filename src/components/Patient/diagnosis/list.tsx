import { useInfiniteQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { History } from "lucide-react";
import { Link, usePath } from "raviger";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

import { TableSkeleton } from "@/components/Common/SkeletonLoading";
import { EmptyState } from "@/components/Medicine/MedicationRequestTable";
import { EncounterAccordionLayout } from "@/components/Patient/EncounterAccordionLayout";

import query from "@/Utils/request/query";
import { PaginatedResponse } from "@/Utils/request/types";
import { useCurrentFacilitySilently } from "@/pages/Facility/utils/useCurrentFacility";
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

  const LIMIT = showTimeline ? 30 : 14;
  const { facilityId } = useCurrentFacilitySilently();
  const sourceUrl = usePath();
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ["infinite-encounter_diagnosis", patientId, encounterId],
      queryFn: async ({ pageParam = 0, signal }) => {
        const response = await query(diagnosisApi.listDiagnosis, {
          pathParams: { patientId },
          queryParams: {
            category: "encounter_diagnosis,chronic_condition",
            clinical_status: ACTIVE_DIAGNOSIS_CLINICAL_STATUS.join(","),
            exclude_verification_status: "entered_in_error",
            ...(encounterId ? { encounter: encounterId } : {}),
            ordering: "-created_date",
            limit: LIMIT,
            offset: String(pageParam),
          },
        })({ signal });
        return response as PaginatedResponse<Diagnosis>;
      },
      initialPageParam: 0,
      getNextPageParam: (lastPage, allPages) => {
        const currentOffset = allPages.length * LIMIT;
        return currentOffset < lastPage.count ? currentOffset : null;
      },
    });

  const diagnoses = data?.pages.flatMap((page) => page.results) ?? [];

  if (isLoading) {
    return <TableSkeleton count={5} />;
  }

  if (!diagnoses.length) {
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
    const groupedByYear = diagnoses.reduce((acc, diagnosis) => {
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
        {hasNextPage && (
          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="xs"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
            >
              {t("load_more")}
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <EncounterAccordionLayout
      title={t("diagnoses")}
      readOnly={readOnly}
      className={className}
      editLink={!readOnly ? "questionnaire/diagnosis" : undefined}
      actionButton={
        <Button variant="link" size="xs" asChild>
          <Link
            href={
              facilityId
                ? `/facility/${facilityId}/patient/${patientId}/history/diagnoses?sourceUrl=${encodeURIComponent(sourceUrl ?? "")}`
                : `/patient/${patientId}/history/diagnoses?sourceUrl=${encodeURIComponent(sourceUrl ?? "")}`
            }
            className="font-semibold"
          >
            <History className="size-4" />
          </Link>
        </Button>
      }
    >
      <div className="space-y-2">
        {diagnoses.length ? <DiagnosisTable diagnoses={diagnoses} /> : null}
      </div>
      {hasNextPage && (
        <div className="flex justify-center">
          <Button variant="ghost" size="xs" onClick={() => fetchNextPage()}>
            {t("load_more")}
          </Button>
        </div>
      )}
    </EncounterAccordionLayout>
  );
}
