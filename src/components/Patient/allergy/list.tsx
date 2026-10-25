import { useInfiniteQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  BeakerIcon,
  CookingPotIcon,
  HeartPulseIcon,
  LeafIcon,
} from "lucide-react";
import { ReactNode } from "react";
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
  AllergyCategory,
  AllergyIntolerance,
} from "@/types/emr/allergyIntolerance/allergyIntolerance";
import allergyIntoleranceApi from "@/types/emr/allergyIntolerance/allergyIntoleranceApi";
import {
  completedEncounterStatus,
  EncounterStatus,
} from "@/types/emr/encounter/encounter";

import { AllergyTable } from "./AllergyTable";

interface AllergyListProps {
  title?: string;
  showEmpty?: boolean;
  facilityId?: string;
  patientId: string;
  encounterId?: string;
  className?: string;
  readOnly?: boolean;
  encounterStatus?: EncounterStatus;
  showTimeline?: boolean;
  showViewEncounter?: boolean;
  presentation?: "default" | "panel";
}
interface GroupedAllergies {
  [year: string]: {
    [date: string]: AllergyIntolerance[];
  };
}

export const CATEGORY_ICONS: Record<AllergyCategory, ReactNode> = {
  food: <CookingPotIcon className="size-4" aria-label="Food allergy" />,
  medication: <BeakerIcon className="size-4" aria-label="Medication allergy" />,
  environment: (
    <LeafIcon className="size-4" aria-label="Environmental allergy" />
  ),
  biologic: <HeartPulseIcon className="size-4" aria-label="Biologic allergy" />,
};

export function AllergyList({
  title,
  showEmpty = false,
  facilityId: providedFacilityId,
  patientId,
  encounterId,
  className = "",
  readOnly = false,
  encounterStatus,
  showTimeline = false,
  showViewEncounter = true,
  presentation = "default",
}: AllergyListProps) {
  const { t } = useTranslation();

  const LIMIT = showTimeline ? 30 : 14;
  const { facilityId: currentFacilityId } = useCurrentFacilitySilently();
  const facilityId = providedFacilityId ?? currentFacilityId;
  const queryState = useInfiniteQuery({
    queryKey: ["infinite-allergies", patientId, encounterId, encounterStatus],
    queryFn: async ({ pageParam = 0, signal }) => {
      const response = await query(allergyIntoleranceApi.getAllergy, {
        pathParams: { patientId },
        silent: true,
        queryParams: {
          encounter:
            encounterStatus &&
            completedEncounterStatus.includes(encounterStatus)
              ? encounterId
              : undefined,
          limit: LIMIT,
          offset: String(pageParam),
          exclude_verification_status: "entered_in_error",
        },
      })({ signal });
      return response as PaginatedResponse<AllergyIntolerance>;
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

  const allergies = data?.pages.flatMap((page) => page.results) ?? [];

  if (showTimeline) {
    if (isLoading) return <TableSkeleton count={5} />;
    if (!allergies.length) {
      if (isError) {
        return <ClinicalListError isFetching={isFetching} onRetry={refetch} />;
      }
      return (
        <EmptyState
          title={t("no_allergies")}
          description={t("no_allergies_recorded_description")}
        />
      );
    }
    const groupedByYear = allergies.reduce((acc, allergy) => {
      const dateStr = format(allergy.created_date, "dd MMMM, yyyy");
      const year = format(allergy.created_date, "yyyy");
      acc[year] ??= {};
      acc[year][dateStr] ??= [];
      acc[year][dateStr].push(allergy);
      return acc;
    }, {} as GroupedAllergies);

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
                {Object.entries(groupedByDate).map(([date, allergies]) => {
                  return (
                    <div key={date} className="pb-6">
                      <div className="flex items-start gap-4">
                        <div className="flex flex-col items-center h-full">
                          <div className="size-3 bg-yellow-200 ring-1 ring-yellow-500 rounded-full flex-shrink-0 -ml-1.5 mt-1"></div>
                        </div>

                        <div className="space-y-3 overflow-auto w-full">
                          <h3 className="text-sm font-medium text-indigo-700">
                            {format(date, "dd MMMM, yyyy")}
                          </h3>
                          <AllergyTable
                            patientId={patientId}
                            allergies={allergies}
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
      title={title ?? t("allergies")}
      facilityId={facilityId}
      patientId={patientId}
      encounterId={encounterId}
      readOnly={readOnly}
      className={className}
      presentation={presentation}
      questionnaire="allergy_intolerance"
      history="allergies"
      emptyMessage={t("no_allergies_recorded_description")}
      hasData={allergies.length > 0}
      showEmpty={showEmpty}
      queryState={queryState}
    >
      <AllergyTable
        allergies={allergies}
        patientId={patientId}
        showViewEncounter={showViewEncounter}
        compact={presentation === "panel"}
      />
    </ClinicalListPanel>
  );
}
