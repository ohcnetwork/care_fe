import { format, parseISO } from "date-fns";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

import { TableSkeleton } from "@/components/Common/SkeletonLoading";
import { ClinicalListError } from "@/components/Patient/Common/ClinicalListError";
import { ClinicalListPanel } from "@/components/Patient/Common/ClinicalListPanel";
import EmptyState from "@/components/Patient/Common/EmptyState";

import { useInfiniteList } from "@/hooks/useInfiniteList";

import query from "@/Utils/request/query";
import { useCurrentFacilitySilently } from "@/pages/Facility/utils/useCurrentFacility";
import { Procedure } from "@/types/emr/procedure/procedure";
import procedureApi from "@/types/emr/procedure/procedureApi";

import { ProcedureTable } from "./ProcedureTable";

interface ProceduresListProps {
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

interface GroupedProcedures {
  [year: string]: {
    [date: string]: Procedure[];
  };
}

export function ProceduresList({
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
}: ProceduresListProps) {
  const { t } = useTranslation();

  const { facilityId: currentFacilityId } = useCurrentFacilitySilently();
  const facilityId = providedFacilityId ?? currentFacilityId;
  const queryState = useInfiniteList({
    queryKey: ["infinite-procedures", patientId, encounterId],
    ...query.infinite(procedureApi.listProcedures, {
      pathParams: { patientId },
      silent: true,
      queryParams: {
        encounter: encounterId,
        exclude_status: "entered_in_error",
      },
      pageSize: showTimeline ? 30 : 14,
    }),
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

  const procedures = data?.results ?? [];

  if (showTimeline) {
    if (isLoading) return <TableSkeleton count={5} />;
    if (!procedures.length) {
      if (isError) {
        return <ClinicalListError isFetching={isFetching} onRetry={refetch} />;
      }
      return (
        <EmptyState
          title={t("no_procedures")}
          description={t("no_procedures_recorded_description")}
        />
      );
    }
    const groupedByYear = procedures.reduce((acc, procedure) => {
      const dateStr = format(procedure.created_date, "yyyy-MM-dd");
      const year = format(procedure.created_date, "yyyy");
      acc[year] ??= {};
      acc[year][dateStr] ??= [];
      acc[year][dateStr].push(procedure);
      return acc;
    }, {} as GroupedProcedures);

    return (
      <div className="space-y-8">
        {isError && (
          <ClinicalListError isFetching={isFetching} onRetry={refetch} />
        )}
        {/* Integer-like year keys enumerate ascending; show newest first. */}
        {Object.entries(groupedByYear)
          .sort(([a], [b]) => b.localeCompare(a))
          .map(([year, groupedByDate]) => {
            return (
              <div key={year}>
                <h2 className="text-sm font-medium text-indigo-700 border-y border-gray-300 py-2 w-fit pr-10">
                  {year}
                </h2>
                <div className="border-l border-gray-300 pt-5 ml-4">
                  {Object.entries(groupedByDate).map(([date, procedures]) => {
                    return (
                      <div key={date} className="pb-6">
                        <div className="flex items-start gap-4">
                          <div className="flex flex-col items-center h-full">
                            <div className="size-3 bg-sky-300 ring-1 ring-sky-700 rounded-full flex-shrink-0 -ml-1.5 mt-1"></div>
                          </div>

                          <div className="space-y-3 overflow-auto w-full">
                            <h3 className="text-sm font-medium text-indigo-700">
                              {format(parseISO(date), "dd MMMM, yyyy")}
                            </h3>
                            <ProcedureTable
                              patientId={patientId}
                              procedures={procedures}
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
      title={title ?? t("procedures")}
      facilityId={facilityId}
      patientId={patientId}
      encounterId={encounterId}
      readOnly={readOnly}
      className={className}
      presentation={presentation}
      questionnaire="procedure"
      history="procedures"
      emptyMessage={t("no_procedures_recorded_description")}
      hasData={procedures.length > 0}
      showEmpty={showEmpty}
      queryState={queryState}
    >
      <ProcedureTable
        procedures={procedures}
        patientId={patientId}
        showViewEncounter={showViewEncounter}
        compact={presentation === "panel"}
      />
    </ClinicalListPanel>
  );
}
