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
import { Symptom } from "@/types/emr/symptom/symptom";
import symptomApi from "@/types/emr/symptom/symptomApi";

import { SymptomTable } from "./SymptomTable";

interface SymptomsListProps {
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

interface GroupedSymptoms {
  [year: string]: {
    [date: string]: Symptom[];
  };
}

export function SymptomsList({
  title,
  showEmpty = false,
  facilityId: providedFacilityId,
  patientId,
  encounterId,
  className,
  readOnly = false,
  showTimeline = false,
  showViewEncounter = true,
  presentation = "default",
}: SymptomsListProps) {
  const { t } = useTranslation();

  const LIMIT = showTimeline ? 30 : 14;
  const { facilityId: currentFacilityId } = useCurrentFacilitySilently();
  const facilityId = providedFacilityId ?? currentFacilityId;
  const queryState = useInfiniteQuery({
    queryKey: ["infinite-symptoms", patientId, encounterId],
    queryFn: async ({ pageParam = 0, signal }) => {
      const response = await query(symptomApi.listSymptoms, {
        pathParams: { patientId },
        silent: true,
        queryParams: {
          encounter: encounterId,
          limit: LIMIT,
          offset: String(pageParam),
          exclude_verification_status: "entered_in_error",
        },
      })({ signal });
      return response as PaginatedResponse<Symptom>;
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

  const symptoms = data?.pages.flatMap((page) => page.results) ?? [];

  if (showTimeline) {
    if (isLoading) return <TableSkeleton count={5} />;
    if (!symptoms.length) {
      if (isError) {
        return <ClinicalListError isFetching={isFetching} onRetry={refetch} />;
      }
      return (
        <EmptyState
          title={t("no_symptoms")}
          description={t("no_symptoms_recorded_description")}
        />
      );
    }
    const groupedByYear = symptoms.reduce((acc, symptom) => {
      const dateStr = format(symptom.created_date, "yyyy-MM-dd");
      const year = format(symptom.created_date, "yyyy");
      acc[year] ??= {};
      acc[year][dateStr] ??= [];
      acc[year][dateStr].push(symptom);
      return acc;
    }, {} as GroupedSymptoms);

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
                {Object.entries(groupedByDate).map(([date, symptoms]) => {
                  return (
                    <div key={date} className="pb-6">
                      <div className="flex items-start gap-4">
                        <div className="flex flex-col items-center h-full">
                          <div className="size-3 bg-pink-300 ring-1 ring-pink-700 rounded-full flex-shrink-0 -ml-1.5 mt-1"></div>
                        </div>

                        <div className="space-y-3 overflow-auto w-full">
                          <h3 className="text-sm font-medium text-indigo-700">
                            {format(date, "dd MMMM, yyyy")}
                          </h3>
                          <SymptomTable
                            patientId={patientId}
                            symptoms={symptoms}
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
      title={title ?? t("symptoms")}
      facilityId={facilityId}
      patientId={patientId}
      encounterId={encounterId}
      readOnly={readOnly}
      className={className}
      presentation={presentation}
      questionnaire="symptom"
      history="symptoms"
      emptyMessage={t("no_symptoms_recorded_description")}
      hasData={symptoms.length > 0}
      showEmpty={showEmpty}
      queryState={queryState}
    >
      <SymptomTable
        symptoms={symptoms}
        patientId={patientId}
        showViewEncounter={showViewEncounter}
        compact={presentation === "panel"}
      />
    </ClinicalListPanel>
  );
}
