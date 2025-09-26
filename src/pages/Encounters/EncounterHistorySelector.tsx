import { useInfiniteQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ChevronDown, Tags } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useInView } from "react-intersection-observer";

import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  dateFilter,
  encounterStatusFilter,
  tagFilter,
} from "@/components/ui/multi-filter/filterConfigs";
import MultiFilter from "@/components/ui/multi-filter/MultiFilter";
import useMultiFilterState from "@/components/ui/multi-filter/utils/useMultiFilterState";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { CardListSkeleton } from "@/components/Common/SkeletonLoading";

import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";
import {
  ENCOUNTER_STATUS_COLORS,
  EncounterRead,
  completedEncounterStatus,
} from "@/types/emr/encounter/encounter";
import encounterApi from "@/types/emr/encounter/encounterApi";
import {
  TagConfig,
  TagResource,
  getTagHierarchyDisplay,
} from "@/types/emr/tagConfig/tagConfig";
import query from "@/Utils/request/query";
import { PaginatedResponse } from "@/Utils/request/types";
import { dateTimeQueryString } from "@/Utils/utils";

interface EncounterCardProps {
  encounter: EncounterRead;
  isSelected: boolean;
  onSelect: (encounterId: string) => void;
}

function EncounterCard({
  encounter,
  isSelected,
  onSelect,
}: EncounterCardProps) {
  const { t } = useTranslation();

  return (
    <Card
      className={cn(
        "rounded-md relative cursor-pointer transition-colors w-full lg:w-80",
        isSelected
          ? "bg-white border-primary-600 shadow-md"
          : "bg-gray-100 hover:bg-gray-100 shadow-none",
      )}
      onClick={() => onSelect(encounter.id)}
    >
      {isSelected && (
        <div className="absolute right-0 h-8 w-1 bg-primary-600 rounded-l inset-y-1/2 -translate-y-1/2" />
      )}
      <CardContent className="flex flex-col px-4 py-3 gap-2">
        <div className="flex justify-between items-center">
          <div className="flex flex-col gap-1">
            <span className="text-base font-semibold">
              {t(`encounter_class__${encounter.encounter_class}`)}
            </span>
            <span className="text-sm font-medium text-gray-700">
              {encounter.facility.name}
            </span>
            {encounter.tags.length > 0 && (
              <HoverCard openDelay={150}>
                <HoverCardTrigger className="hidden md:block">
                  <div className="flex items-center py-1 pr-1 gap-2">
                    <Tags className="size-4 text-gray-700" />
                    <span className="text-sm text-gray-700 font-medium">
                      {t("encounter_tag_count", {
                        count: encounter.tags.length,
                      })}
                    </span>
                  </div>
                </HoverCardTrigger>
                <HoverCardContent
                  className="flex flex-col gap-2 p-4 border border-gray-200 rounded-md max-w-90 shadow-lg"
                  side="right"
                >
                  <EncounterTagHoverCard encounter={encounter} />
                </HoverCardContent>
              </HoverCard>
            )}
          </div>
          <div className="flex flex-col gap-1 pt-0.5 items-end">
            <span className="text-sm text-gray-600 whitespace-nowrap">
              {encounter.period.start && (
                <span>
                  {format(new Date(encounter.period.start!), "dd MMM")}
                </span>
              )}
              {encounter.period.end && encounter.period.start && (
                <span>{" - "}</span>
              )}
              {encounter.period.end ? (
                <span>{format(new Date(encounter.period.end), "dd MMM")}</span>
              ) : (
                <span>
                  {" - "}
                  {t("ongoing")}
                </span>
              )}
            </span>
            <Badge
              variant={ENCOUNTER_STATUS_COLORS[encounter.status]}
              size="sm"
              className=" whitespace-nowrap"
            >
              {t(`encounter_status__${encounter.status}`)}
            </Badge>
          </div>
        </div>
        {encounter.tags.length > 0 && (
          <div className="md:hidden flex flex-wrap gap-2">
            {encounter.tags.map((tag) => (
              <Badge
                key={tag.id}
                variant="secondary"
                className="capitalize"
                title={tag.description}
              >
                {getTagHierarchyDisplay(tag)}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface Props {
  onSelect?: () => void;
}

const EncounterHistoryList = ({ onSelect }: Props) => {
  const { t } = useTranslation();
  const { ref, inView } = useInView();

  const [status, setStatus] = useState<string>();
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [tagsBehavior, setTagsBehavior] = useState<string>("any");
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();

  const {
    primaryEncounter,
    primaryEncounterId,
    selectedEncounterId,
    setSelectedEncounter,
    patientId,
    facilityId,
  } = useEncounter();

  const handleSelect = (encounterId: string | null) => {
    setSelectedEncounter(encounterId);
    onSelect?.();
  };

  const {
    data: encounters,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
  } = useInfiniteQuery({
    queryKey: [
      "infinite-encounters",
      "past",
      patientId,
      status,
      selectedTagIds,
      tagsBehavior,
      dateFrom,
      dateTo,
    ],
    queryFn: async ({ pageParam = 0, signal }) => {
      const response = await query(encounterApi.list, {
        queryParams: {
          limit: 14,
          offset: String(pageParam),
          ...(completedEncounterStatus.includes(primaryEncounter?.status ?? "")
            ? { patient_filter: patientId, facility: facilityId }
            : { patient: patientId }),
          ...(status && { status }),
          ...(selectedTagIds.length > 0 && {
            tags: selectedTagIds.join(","),
            tags_behavior: tagsBehavior,
          }),
          ...(dateFrom && {
            created_date_after: dateTimeQueryString(dateFrom),
          }),
          ...(dateTo && {
            created_date_before: dateTimeQueryString(dateTo, true),
          }),
        },
      })({ signal });
      return response as PaginatedResponse<EncounterRead>;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const currentOffset = allPages.length * 14;
      return currentOffset < lastPage.count ? currentOffset : null;
    },
    enabled: !!primaryEncounter,
  });

  const past = encounters?.pages.flatMap((page) => page.results) ?? [];

  const pastEncounters = past.filter(
    (encounter) => encounter.id !== primaryEncounterId,
  );

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  const onFilterUpdate = (query: Record<string, unknown>) => {
    for (const [key, value] of Object.entries(query)) {
      const filterValue = value as
        | string
        | TagConfig[]
        | { from: Date; to: Date };
      switch (key) {
        case "status":
          setStatus(filterValue as string);
          break;
        case "tags":
          setSelectedTagIds(
            (filterValue as TagConfig[])?.map((tag) => tag.id) ?? [],
          );
          break;
        case "tags_behavior":
          setTagsBehavior(filterValue as string);
          break;
        case "created_date":
          if (
            typeof filterValue === "object" &&
            "from" in filterValue &&
            "to" in filterValue
          ) {
            setDateFrom(filterValue.from as Date);
            setDateTo(filterValue.to as Date);
          }
          break;
      }
    }
  };

  const filters = [
    encounterStatusFilter("status"),
    tagFilter("tags", TagResource.ENCOUNTER),
    dateFilter("created_date"),
  ];
  const {
    selectedFilters,
    handleFilterChange,
    handleOperationChange,
    handleClearAll,
    handleClearFilter,
  } = useMultiFilterState(filters, onFilterUpdate);

  return (
    <div className="space-y-4 pt-2">
      {!primaryEncounter ? (
        <CardListSkeleton count={1} />
      ) : (
        <div>
          <h2 className="mb-2 text-xs font-medium text-gray-600 uppercase">
            {t("chosen_encounter")}
          </h2>
          <div className="space-y-2">
            <EncounterCard
              encounter={primaryEncounter}
              isSelected={primaryEncounterId === selectedEncounterId}
              onSelect={() => handleSelect(null)}
            />
          </div>
        </div>
      )}

      <Separator className="my-4" />

      <div>
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-medium text-gray-600 uppercase">
              {t("other_encounters")}
            </h2>
          </div>

          {/* Filters */}

          <MultiFilter
            selectedFilters={selectedFilters}
            onFilterChange={handleFilterChange}
            onOperationChange={handleOperationChange}
            onClearAll={handleClearAll}
            onClearFilter={handleClearFilter}
            placeholder={t("filter")}
            triggerButtonClassName="self-start"
            facilityId={facilityId}
          />
        </div>

        <div className="flex flex-col gap-2">
          {!encounters ? (
            <CardListSkeleton count={5} />
          ) : pastEncounters.length > 0 ? (
            pastEncounters.reduce<React.ReactNode[]>(
              (acc, encounter, index) => {
                const currentYear = new Date(
                  encounter.period.start!,
                ).getFullYear();
                const prevYear =
                  index > 0
                    ? new Date(
                        pastEncounters[index - 1].period.start!,
                      ).getFullYear()
                    : null;

                if (currentYear !== prevYear) {
                  acc.push(
                    <div
                      key={`year-${currentYear}`}
                      className="-mb-1 text-sm font-medium text-indigo-700"
                    >
                      {currentYear}
                    </div>,
                  );
                }

                acc.push(
                  <EncounterCard
                    key={encounter.id}
                    encounter={encounter}
                    isSelected={encounter.id === selectedEncounterId}
                    onSelect={handleSelect}
                  />,
                );
                return acc;
              },
              [],
            )
          ) : (
            <div className="px-4 py-8 text-center text-gray-500">
              {t("no_encounters_found")}
            </div>
          )}
          <div ref={ref} />
          {isFetchingNextPage && <CardListSkeleton count={5} />}
          {!hasNextPage && !isFetching && (
            <div className="border-b border-gray-300 pb-2" />
          )}
        </div>
      </div>
    </div>
  );
};

export default function EncounterHistorySelector() {
  const [isOpen, setIsOpen] = useState(false);

  const { t } = useTranslation();

  return (
    <>
      <div className="lg:hidden">
        <h2 className="px-2 mb-2 text-xs font-medium text-gray-600 uppercase">
          {t("chosen_encounter")}
        </h2>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger className="w-full">
            <EncounterSheetTrigger />
          </SheetTrigger>
          <SheetContent
            side="bottom"
            className="max-h-[85vh] rounded-t-3xl overflow-y-auto mb-2"
          >
            <SheetHeader className="px-4 pb-2">
              <SheetTitle>{t("past_encounters")}</SheetTitle>
            </SheetHeader>
            <EncounterHistoryList onSelect={() => setIsOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>
      <div className="hidden lg:block pr-3">
        <ScrollArea className="h-[calc(100vh-9rem)] pr-3">
          <EncounterHistoryList />
        </ScrollArea>
      </div>
    </>
  );
}

const EncounterSheetTrigger = () => {
  const { t } = useTranslation();

  const { selectedEncounter: encounter } = useEncounter();

  if (!encounter) {
    return null;
  }

  return (
    <Card className="relative rounded-md cursor-pointer w-full lg:w-80 bg-white border-primary-600">
      <CardContent className="flex flex-col px-3 py-2 gap-1">
        <div className="absolute right-0 h-8 w-1 bg-primary-600 rounded-l inset-y-1/2 -translate-y-1/2" />
        <div className="flex justify-between items-start">
          <div className="flex flex-col items-start gap-1">
            <span className="text-base font-semibold">
              {t(`encounter_class__${encounter.encounter_class}`)}
            </span>
            <span className="text-sm font-medium text-gray-700">
              {encounter.facility.name}
            </span>
          </div>
          <div className="flex gap-1 items-center justify-center">
            <div className="flex flex-col gap-1 items-end ">
              <span className="text-sm text-gray-600 whitespace-nowrap">
                {encounter.period.start && (
                  <span>
                    {format(new Date(encounter.period.start!), "dd MMM")}
                  </span>
                )}
                {encounter.period.end && encounter.period.start && (
                  <span>{" - "}</span>
                )}
                {encounter.period.end ? (
                  <span>
                    {format(new Date(encounter.period.end), "dd MMM")}
                  </span>
                ) : (
                  <span>
                    {" - "}
                    {t("ongoing")}
                  </span>
                )}
              </span>
              <Badge
                variant={ENCOUNTER_STATUS_COLORS[encounter.status]}
                size="sm"
                className=" whitespace-nowrap"
              >
                {t(`encounter_status__${encounter.status}`)}
              </Badge>
            </div>
            <div className={buttonVariants({ variant: "ghost", size: "icon" })}>
              <ChevronDown />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const EncounterTagHoverCard = ({ encounter }: { encounter: EncounterRead }) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm text-gray-700 font-medium">
        {t("encounter_tag_label", { count: encounter.tags.length })}:
      </span>
      <div className="flex flex-wrap gap-2">
        {encounter.tags.length > 0 ? (
          <>
            {encounter.tags.map((tag) => (
              <Badge
                key={tag.id}
                variant="secondary"
                className="capitalize"
                title={tag.description}
              >
                {getTagHierarchyDisplay(tag)}
              </Badge>
            ))}
          </>
        ) : (
          <span className="text-sm text-gray-500">{t("no_tags")}</span>
        )}
      </div>
    </div>
  );
};
