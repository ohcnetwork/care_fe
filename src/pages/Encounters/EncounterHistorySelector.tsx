import { useInfiniteQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { CircleDashed } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useInView } from "react-intersection-observer";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FilterSelect } from "@/components/ui/filter-select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { DateRangeFilter } from "@/components/Common/DateRangeFilter";
import { CardListSkeleton } from "@/components/Common/SkeletonLoading";
import { TagSelectorPopover } from "@/components/Tags/TagAssignmentSheet";

import query from "@/Utils/request/query";
import { PaginatedResponse } from "@/Utils/request/types";
import { dateTimeQueryString } from "@/Utils/utils";
import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";
import {
  ENCOUNTER_STATUS,
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
import useTagConfigs from "@/types/emr/tagConfig/useTagConfig";

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
        "rounded-md relative cursor-pointer transition-colors mb-2 w-full lg:w-80",
        isSelected
          ? "bg-white border-emerald-600"
          : "bg-gray-100 hover:bg-gray-100 shadow-none",
      )}
      onClick={() => onSelect(encounter.id)}
    >
      {isSelected && (
        <div className="absolute right-0 inset-y-5 w-1 bg-emerald-600 rounded-l" />
      )}
      <CardContent className="px-4 py-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="text-sm font-semibold">
                {t(`encounter_class__${encounter.encounter_class}`)}
              </div>
              <Badge variant={ENCOUNTER_STATUS_COLORS[encounter.status]}>
                {t(`encounter_status__${encounter.status}`)}
              </Badge>
            </div>
            <div className="text-xs text-gray-500 flex flex-wrap text-end justify-end">
              {encounter.period.start && (
                <span className="whitespace-nowrap">
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
            </div>
          </div>
          <div className="text-xs text-gray-500">{encounter.facility.name}</div>
          <div className="flex flex-wrap gap-1 text-xs">
            {encounter.tags.map((tag) => (
              <Badge variant="outline" key={tag.id} className="text-xs">
                {getTagHierarchyDisplay(tag)}
              </Badge>
            ))}
          </div>
        </div>
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
  const [showFilters, setShowFilters] = useState(false);

  const [status, setStatus] = useState<string>();
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();

  const {
    currentEncounter,
    currentEncounterId,
    selectedEncounterId,
    setSelectedEncounter,
    patientId,
    facilityId,
  } = useEncounter();

  const tagConfigsQuery = useTagConfigs({ ids: selectedTagIds, facilityId });
  const selectedTags = tagConfigsQuery
    .map((q) => q.data)
    .filter(Boolean) as TagConfig[];

  const handleStatusChange = (value: string | undefined) => {
    setStatus(value);
  };

  const handleTagsChange = (tags: TagConfig[]) => {
    setSelectedTagIds(tags.map((tag) => tag.id));
  };

  const handleDateFromChange = (date: Date | undefined) => {
    setDateFrom(date);
  };

  const handleDateToChange = (date: Date | undefined) => {
    setDateTo(date);
  };

  const handleSelect = (encounterId: string | null) => {
    setSelectedEncounter(encounterId);
    onSelect?.();
  };

  const {
    data: encounters,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: [
      "infinite-encounters",
      "past",
      patientId,
      status,
      selectedTagIds,
      dateFrom,
      dateTo,
    ],
    queryFn: async ({ pageParam = 0, signal }) => {
      const response = await query(encounterApi.list, {
        queryParams: {
          limit: 14,
          offset: String(pageParam),
          ...(completedEncounterStatus.includes(currentEncounter?.status ?? "")
            ? { patient_filter: patientId, facility: facilityId }
            : { patient: patientId }),
          ...(status && { status }),
          ...(selectedTagIds.length > 0 && { tags: selectedTagIds.join(",") }),
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
    enabled: !!currentEncounter,
  });

  const past = encounters?.pages.flatMap((page) => page.results) ?? [];

  const pastEncounters = past.filter(
    (encounter) => encounter.id !== currentEncounterId,
  );

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  return (
    <div className="space-y-4 pt-2">
      {!currentEncounter ? (
        <CardListSkeleton count={1} />
      ) : (
        <div>
          <h2 className="mb-2 text-xs font-medium text-gray-600 uppercase">
            {t("chosen_encounter")}
          </h2>
          <div className="space-y-2">
            <EncounterCard
              encounter={currentEncounter}
              isSelected={currentEncounterId === selectedEncounterId}
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
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(showFilters && "bg-gray-100")}
              title={t("toggle_filters")}
            >
              <CareIcon icon="l-filter" className="size-4" />
            </Button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="flex flex-col gap-2 mb-4">
              <FilterSelect
                value={status || ""}
                onValueChange={handleStatusChange}
                options={[...ENCOUNTER_STATUS]}
                label={t("status")}
                onClear={() => setStatus(undefined)}
                icon={<CircleDashed className="size-4 text-gray-600" />}
                className="bg-white font-medium rounded-md hover:bg-gray-100 h-9"
              />

              <TagSelectorPopover
                selected={selectedTags}
                onChange={handleTagsChange}
                resource={TagResource.ENCOUNTER}
                asFilter
                className="mt-0 bg-white font-medium rounded-md"
              />

              <DateRangeFilter
                dateFrom={dateFrom}
                dateTo={dateTo}
                onDateFromChange={handleDateFromChange}
                onDateToChange={handleDateToChange}
                onDateRangeChange={(from, to) => {
                  setDateFrom(from);
                  setDateTo(to);
                }}
                onClear={() => {
                  setDateFrom(undefined);
                  setDateTo(undefined);
                }}
                popoverPlaceholder={t("select_created_date_range")}
                className="bg-white font-medium rounded-md"
              />
            </div>
          )}
        </div>

        <div>
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
                      className="mb-2 text-sm font-medium text-indigo-700"
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
          {!hasNextPage && <div className="border-b border-gray-300 pb-2" />}
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
      <div className="hidden lg:block">
        <ScrollArea className="h-[calc(100vh-10rem)] pr-3">
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
    <Card className="rounded-md relative cursor-pointer mb-2 w-full lg:w-80 bg-white border-emerald-600">
      <CardContent className="px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="text-base font-semibold">
                  {t(`encounter_class__${encounter.encounter_class}`)}
                </div>
                <Badge variant={ENCOUNTER_STATUS_COLORS[encounter.status]}>
                  {t(`encounter_status__${encounter.status}`)}
                </Badge>
              </div>
            </div>
            <div className="text-xs text-gray-500 text-start">
              {encounter.facility.name}
            </div>
            <div className="text-xs text-gray-500 flex flex-wrap text-start">
              {encounter.period.start && (
                <span className="whitespace-nowrap">
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
            </div>
          </div>
          <div className={buttonVariants({ variant: "outline", size: "icon" })}>
            <CareIcon icon="l-history" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
