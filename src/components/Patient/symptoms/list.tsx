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
import { Symptom } from "@/types/emr/symptom/symptom";
import symptomApi from "@/types/emr/symptom/symptomApi";

import { SymptomTable } from "./SymptomTable";

interface SymptomsListProps {
  patientId: string;
  encounterId?: string;
  className?: string;
  readOnly?: boolean;
  showTimeline?: boolean;
}

interface GroupedSymptoms {
  [year: string]: {
    [date: string]: Symptom[];
  };
}

export function SymptomsList({
  patientId,
  encounterId,
  className,
  readOnly = false,
  showTimeline = false,
}: SymptomsListProps) {
  const { t } = useTranslation();

  const LIMIT = showTimeline ? 30 : 14;
  const { facilityId } = useCurrentFacilitySilently();
  const sourceUrl = usePath();
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ["infinite-symptoms", patientId, encounterId],
      queryFn: async ({ pageParam = 0, signal }) => {
        const response = await query(symptomApi.listSymptoms, {
          pathParams: { patientId },
          queryParams: {
            encounter: encounterId,
            ordering: "-created_date",
            limit: LIMIT,
            offset: String(pageParam),
            exclude_verification_status: "entered_in_error",
          },
        })({ signal });
        return response as PaginatedResponse<Symptom>;
      },
      initialPageParam: 0,
      getNextPageParam: (lastPage, allPages) => {
        const currentOffset = allPages.length * LIMIT;
        return currentOffset < lastPage.count ? currentOffset : null;
      },
    });

  if (isLoading) {
    return <TableSkeleton count={5} />;
  }

  const symptoms = data?.pages.flatMap((page) => page.results) ?? [];

  if (!symptoms?.length) {
    if (showTimeline) {
      return (
        <EmptyState
          message={t("no_symptoms")}
          description={t("no_symptoms_recorded_description")}
        />
      );
    }
    return null;
  }

  if (showTimeline) {
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
                          <div className="size-3 bg-cyan-300 ring-1 ring-cyan-700 rounded-full flex-shrink-0 -ml-1.5 mt-1"></div>
                        </div>

                        <div className="space-y-3 overflow-auto w-full">
                          <h3 className="text-sm font-medium text-indigo-700">
                            {format(date, "dd MMMM, yyyy")}
                          </h3>
                          <SymptomTable symptoms={symptoms} />
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
      title="symptoms"
      readOnly={readOnly}
      className={className}
      editLink={!readOnly ? "questionnaire/symptom" : undefined}
      actionButton={
        <Button variant="link" size="xs" asChild>
          <Link
            href={
              facilityId
                ? `/facility/${facilityId}/patient/${patientId}/history/symptoms?sourceUrl=${encodeURIComponent(sourceUrl ?? "")}`
                : `/patient/${patientId}/history/symptoms?sourceUrl=${encodeURIComponent(sourceUrl ?? "")}`
            }
          >
            <History className="size-4" />
          </Link>
        </Button>
      }
    >
      <SymptomTable symptoms={symptoms} />
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
