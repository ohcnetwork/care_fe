import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { RESULTS_PER_PAGE_LIMIT } from "@/common/constants";
import { TableSkeleton } from "@/components/Common/SkeletonLoading";
import { ClinicalListError } from "@/components/Patient/Common/ClinicalListError";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useEncounterSilently } from "@/pages/Encounters/utils/EncounterProvider";
import { Code } from "@/types/base/code/code";
import { ObservationStatus } from "@/types/emr/observation/observation";
import observationApi from "@/types/emr/observation/observationApi";
import query from "@/Utils/request/query";

import { EmptyState } from "@/components/ui/empty-state";
import { FileExclamationPointIcon } from "lucide-react";
import { ObservationDetailContent } from "./ObservationDetailContent";
import {
  codeKey,
  groupEntriesByUnit,
  resolveObservationEntries,
} from "./observationDetailUtils";
import { ObservationHistoryMatrix } from "./ObservationHistoryMatrix";

// Amended results replace final ones, so history must include both.
const RESULT_STATUSES = [
  ObservationStatus.FINAL,
  ObservationStatus.AMENDED,
].join(",");

interface ObservationDetailSheetProps {
  codes: Code[];
  title: string;
  patientId: string;
  encounterId?: string;
  trigger: React.ReactNode;
}

export function ObservationDetailSheet({
  codes,
  title,
  patientId,
  encounterId,
  trigger,
}: ObservationDetailSheetProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  // Readers limited to this encounter cannot list patient-wide history; when the
  // grant is unknown (outside an encounter page), start scoped to the encounter.
  const canReadPatientHistory = useEncounterSilently()?.canReadPatientHistory;
  const historyLocked = !!encounterId && canReadPatientHistory === false;
  const [currentEncounterOnly, setCurrentEncounterOnly] = useState(
    !!encounterId && canReadPatientHistory !== true,
  );
  const encounterScoped =
    !!encounterId && (historyLocked || currentEncounterOnly);

  const validCodes = codes.filter((code) => !!code?.code);

  const codesParam = validCodes.map((c) => c.code).join(",");

  const {
    data: historyData,
    isLoading: isHistoryLoading,
    isError,
    isFetching,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: [
      "observation-history",
      patientId,
      encounterId,
      codesParam,
      encounterScoped,
    ],
    queryFn: async ({ pageParam = 0, signal }) => {
      const response = await query(observationApi.list, {
        pathParams: { patientId },
        queryParams: {
          codes: codesParam,
          status: RESULT_STATUSES,
          limit: String(RESULTS_PER_PAGE_LIMIT),
          offset: String(pageParam),
          ...(encounterScoped ? { encounter: encounterId } : {}),
        },
      })({ signal });
      return response;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const currentOffset = allPages.length * RESULTS_PER_PAGE_LIMIT;
      return currentOffset < lastPage.count ? currentOffset : null;
    },
    enabled: open && validCodes.length > 0,
  });

  const allResults = historyData?.pages.flatMap((page) => page.results) ?? [];

  const entriesByCode = resolveObservationEntries(allResults, validCodes);

  const codeList = Object.values(entriesByCode).map((list) => list[0].code);

  const totalCount = historyData?.pages?.[0]?.count ?? 0;

  // The list filter matches code values across systems, so loaded pages can
  // hold no readings for the requested systems while later pages still might.
  const awaitingMatches = codeList.length === 0 && !!hasNextPage && !isError;

  useEffect(() => {
    if (awaitingMatches && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [awaitingMatches, isFetchingNextPage, fetchNextPage]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent size="xl" className="overflow-hidden">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>

          <div
            className={cn(
              "flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm text-placeholder-foreground",
              totalCount === 0 && "hidden",
            )}
          >
            <span>
              {encounterScoped ? t("current_encounter") : t("all_encounters")}
            </span>
            {totalCount > 0 && (
              <>
                <span aria-hidden="true">•</span>
                <span>{t("recordings_count", { count: totalCount })}</span>
              </>
            )}
          </div>
        </SheetHeader>

        <SheetBody>
          <div className="space-y-4">
            {encounterId && !historyLocked && (
              <div className="flex items-center justify-end gap-2 text-sm">
                <Checkbox
                  id="current-encounter-only"
                  checked={currentEncounterOnly}
                  onCheckedChange={(checked) =>
                    setCurrentEncounterOnly(checked === true)
                  }
                />
                <label
                  htmlFor="current-encounter-only"
                  className="cursor-pointer"
                >
                  {t("show_current_encounter_recordings")}
                </label>
              </div>
            )}

            {isHistoryLoading || awaitingMatches ? (
              <div className="flex flex-col gap-4">
                <TableSkeleton count={3} />
              </div>
            ) : isError ? (
              <div>
                <ClinicalListError isFetching={isFetching} onRetry={refetch} />
              </div>
            ) : totalCount === 0 || codeList.length === 0 ? (
              <EmptyState
                title={t("no_data_available")}
                className="m-3"
                icon={
                  <FileExclamationPointIcon className="size-6 text-placeholder-foreground" />
                }
              />
            ) : (
              <Tabs defaultValue="plot" className="min-w-0">
                <TabsList className="w-fit">
                  <TabsTrigger value="plot">{t("plots")}</TabsTrigger>
                  <TabsTrigger value="table">{t("table")}</TabsTrigger>
                </TabsList>
                <TabsContent value="plot" className="pt-4">
                  <div className="flex flex-col gap-4">
                    {codeList.flatMap((code) => {
                      const unitGroups = groupEntriesByUnit(
                        entriesByCode[codeKey(code)] ?? [],
                      );
                      return unitGroups.map((group) => (
                        <section
                          key={`${codeKey(code)}|${group.key}`}
                          className="min-w-0"
                        >
                          <h3 className="mb-1 text-sm font-semibold text-foreground">
                            {code.display || code.code}
                            {unitGroups.length > 1 && group.unit && (
                              <span className="ml-1 font-normal text-muted-foreground">
                                ({group.unit})
                              </span>
                            )}
                          </h3>
                          <ObservationDetailContent
                            entries={group.entries}
                            hasNextPage={hasNextPage}
                            isFetchingNextPage={isFetchingNextPage}
                            fetchNextPage={fetchNextPage}
                          />
                        </section>
                      ));
                    })}
                  </div>
                </TabsContent>
                <TabsContent value="table" className="pt-4">
                  <ObservationHistoryMatrix
                    codes={codeList}
                    entriesByCode={entriesByCode}
                    totalCount={totalCount}
                    hasNextPage={hasNextPage}
                    isFetchingNextPage={isFetchingNextPage}
                    fetchNextPage={fetchNextPage}
                  />
                </TabsContent>
              </Tabs>
            )}
          </div>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
