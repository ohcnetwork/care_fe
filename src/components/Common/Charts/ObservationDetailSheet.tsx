import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { RESULTS_PER_PAGE_LIMIT } from "@/common/constants";
import { TableSkeleton } from "@/components/Common/SkeletonLoading";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Code } from "@/types/base/code/code";
import observationApi from "@/types/emr/observation/observationApi";
import query from "@/Utils/request/query";

import { AllValuesChart } from "./AllValuesChart";
import { ObservationDetailContent } from "./ObservationDetailContent";
import { resolveObservationEntries } from "./observationDetailUtils";
import { ObservationHistoryMatrix } from "./ObservationHistoryMatrix";

interface ObservationDetailSheetProps {
  children: React.ReactNode;
  codes: Code[];
  title: string;
  patientId: string;
  encounterId?: string;
}

export function ObservationDetailSheet({
  children,
  codes,
  title,
  patientId,
  encounterId,
}: ObservationDetailSheetProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [currentEncounterOnly, setCurrentEncounterOnly] = useState(false);

  const validCodes = codes.filter((code) => !!code?.code);

  const codesParam = validCodes.map((c) => c.code).join(",");

  const {
    data: historyData,
    isLoading: isHistoryLoading,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: [
      "observation-history",
      patientId,
      encounterId,
      codesParam,
      currentEncounterOnly,
    ],
    queryFn: async ({ pageParam = 0, signal }) => {
      const response = await query(observationApi.list, {
        pathParams: { patientId },
        queryParams: {
          codes: codesParam,
          limit: String(RESULTS_PER_PAGE_LIMIT),
          offset: String(pageParam),
          ...(currentEncounterOnly && encounterId
            ? { encounter: encounterId }
            : {}),
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

  const allResults = useMemo(
    () => historyData?.pages.flatMap((page) => page.results) ?? [],
    [historyData],
  );

  const entriesByCode = useMemo(
    () => resolveObservationEntries(allResults),
    [allResults],
  );

  const codeList = useMemo(
    () => Object.values(entriesByCode).map((list) => list[0].code),
    [entriesByCode],
  );

  const totalCount = historyData?.pages?.[0]?.count ?? 0;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="appearance-none border-0 bg-transparent p-0 text-left text-inherit">
        {children}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-4xl flex flex-col p-0 gap-0 overflow-hidden h-dvh">
        <SheetHeader className="border-b border-gray-200 bg-white p-6 pb-4">
          <SheetTitle className="pr-8 text-xl font-bold text-gray-950">
            {title}{" "}
          </SheetTitle>

          <div
            className={cn(
              "flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm text-gray-500",
              totalCount === 0 && "hidden",
            )}
          >
            <span>
              {currentEncounterOnly && encounterId
                ? t("current_encounter")
                : t("all_encounters")}
            </span>
            {totalCount > 0 && (
              <>
                <span aria-hidden="true">•</span>
                <span>{t("recordings_count", { count: totalCount })}</span>
              </>
            )}
          </div>
        </SheetHeader>

        {isHistoryLoading ? (
          <div className="flex flex-col gap-4 overflow-y-auto p-4 flex-1 min-h-0">
            <TableSkeleton count={3} />
          </div>
        ) : totalCount === 0 ? (
          <div className="flex h-64 items-center justify-center text-sm text-gray-500">
            {t("no_data_available")}
          </div>
        ) : (
          <div className="flex flex-col gap-4 overflow-y-auto p-4 flex-1 min-h-0">
            {encounterId && (
              <div className="flex items-center gap-2 text-sm ml-auto">
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

            {codeList.length > 1 ? (
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="bg-gray-100 max-w-full justify-start overflow-x-auto h-12 pb-1.5 pt-1">
                  <TabsTrigger
                    value="all"
                    className="shrink-0 whitespace-nowrap py-3"
                  >
                    {t("all_values")}
                  </TabsTrigger>
                  {codeList.map((code) => (
                    <TabsTrigger
                      key={code.code}
                      value={code.code}
                      className="shrink-0 whitespace-nowrap"
                    >
                      {code.display || code.code}
                    </TabsTrigger>
                  ))}
                </TabsList>
                <TabsContent value="all">
                  <AllValuesChart
                    codeList={codeList}
                    entriesByCode={entriesByCode}
                  />
                </TabsContent>
                {codeList.map((code) => (
                  <TabsContent key={code.code} value={code.code}>
                    <ObservationDetailContent
                      entries={entriesByCode[code.code] ?? []}
                      hasNextPage={hasNextPage}
                      fetchNextPage={fetchNextPage}
                    />
                  </TabsContent>
                ))}
              </Tabs>
            ) : codeList.length === 1 ? (
              <ObservationDetailContent
                entries={entriesByCode[codeList[0].code] ?? []}
                hasNextPage={hasNextPage}
                fetchNextPage={fetchNextPage}
              />
            ) : (
              <div className="flex h-64 items-center justify-center text-sm text-gray-500">
                {t("no_data_available")}
              </div>
            )}
            <ObservationHistoryMatrix
              codes={codeList}
              entriesByCode={entriesByCode}
              totalCount={totalCount}
              hasNextPage={hasNextPage}
              fetchNextPage={fetchNextPage}
            />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
