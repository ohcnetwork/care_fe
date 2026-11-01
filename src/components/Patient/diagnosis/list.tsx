import { useInfiniteQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

import { TableSkeleton } from "@/components/Common/SkeletonLoading";
import { ClinicalListError } from "@/components/Patient/Common/ClinicalListError";
import { ClinicalListPanel } from "@/components/Patient/Common/ClinicalListPanel";
import EmptyState from "@/components/Patient/Common/EmptyState";

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
  title?: string;
  showEmpty?: boolean;
  facilityId?: string;
  patientId: string;
  encounterId?: string;
  className?: string;
  readOnly?: boolean;
  showTimeline?: boolean;
  showViewEncounter?: boolean;
  presentation?: "default" | "panel";
}

interface GroupedDiagnoses {
  [year: string]: {
    [date: string]: Diagnosis[];
  };
}

export function DiagnosisList({
  title,
  showEmpty = false,
  facilityId: providedFacilityId,
  patientId,
  encounterId,
  className = "",
  readOnly = false,
  showTimeline = false,
  showViewEncounter = true,
  presentation = "default",
}: DiagnosisListProps) {
  const { t } = useTranslation();

  const LIMIT = showTimeline ? 30 : 14;
  const { facilityId: currentFacilityId } = useCurrentFacilitySilently();
  const facilityId = providedFacilityId ?? currentFacilityId;
  const queryState = useInfiniteQuery({
    queryKey: ["infinite-encounter_diagnosis", patientId, encounterId],
    queryFn: async ({ pageParam = 0, signal }) => {
      const response = await query(diagnosisApi.listDiagnosis, {
        pathParams: { patientId },
        silent: true,
        queryParams: {
          category: "encounter_diagnosis,chronic_condition",
          clinical_status: ACTIVE_DIAGNOSIS_CLINICAL_STATUS.join(","),
          exclude_verification_status: "entered_in_error",
          ...(encounterId ? { encounter: encounterId } : {}),
          limit: LIMIT,
          offset: String(pageParam),
        },
      })({ signal });
      return response as PaginatedResponse<Diagnosis>;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const currentOffset = allPages.reduce(
        (count, page) => count + page.results.length,
        0,
      );
      return lastPage.results.length > 0 && currentOffset < lastPage.count
        ? currentOffset
        : undefined;
    },
  });

  const {
    data,
    isLoading,
    isError,
    isFetching,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = queryState;

  const diagnoses = data?.pages.flatMap((page) => page.results) ?? [];

  if (showTimeline) {
    if (isLoading) return <TableSkeleton count={5} />;
    if (!diagnoses.length) {
      if (isError) {
        return <ClinicalListError isFetching={isFetching} onRetry={refetch} />;
      }
      return (
        <EmptyState
          title={t("no_diagnoses")}
          description={t("no_diagnoses_recorded_description")}
        />
      );
    }
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
        {isError && (
          <ClinicalListError isFetching={isFetching} onRetry={refetch} />
        )}
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
                          <div className="size-3 bg-blue-300 ring-1 ring-blue-700 rounded-full flex-shrink-0 -ml-1.5 mt-1"></div>
                        </div>

                        <div className="space-y-3 overflow-auto w-full">
                          <h3 className="text-sm font-medium text-indigo-700">
                            {format(date, "dd MMMM, yyyy")}
                          </h3>
                          <DiagnosisTable
                            diagnoses={diagnoses}
                            patientId={patientId}
                          />
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
    <ClinicalListPanel
      title={title ?? t("diagnoses")}
      facilityId={facilityId}
      patientId={patientId}
      encounterId={encounterId}
      readOnly={readOnly}
      className={className}
      presentation={presentation}
      questionnaire="diagnosis"
      history="diagnoses"
      emptyMessage={t("no_diagnoses_recorded_description")}
      hasData={diagnoses.length > 0}
      showEmpty={showEmpty}
      queryState={queryState}
    >
      <DiagnosisTable
        diagnoses={diagnoses}
        patientId={patientId}
        showViewEncounter={showViewEncounter}
        compact={presentation === "panel"}
      />
    </ClinicalListPanel>
  );
}
