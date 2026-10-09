import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  careTeamFilter,
  dateFilter,
  departmentFilter,
  encounterStatusFilter,
  tagFilter,
} from "@/components/ui/multi-filter/filterConfigs";
import MultiFilter from "@/components/ui/multi-filter/MultiFilter";
import useMultiFilterState from "@/components/ui/multi-filter/utils/useMultiFilterState";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";

import { CardListSkeleton } from "@/components/Common/SkeletonLoading";

import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";
import {
  ENCOUNTER_STATUS_COLORS,
  EncounterListRead,
  EncounterRead,
  completedEncounterStatus,
} from "@/types/emr/encounter/encounter";
import { TagConfig, TagResource } from "@/types/emr/tagConfig/tagConfig";
import { FacilityOrganizationRead } from "@/types/facilityOrganization/facilityOrganization";
import { UserReadMinimal } from "@/types/user/user";
import {
  Building2,
  Calendar,
  ChevronDown,
  MapPin,
  Tags,
  Users,
} from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";

import TagBadge from "@/components/Tags/TagBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import useBreakpoints from "@/hooks/useBreakpoints";
import { cn } from "@/lib/utils";
import encounterApi from "@/types/emr/encounter/encounterApi";
import query from "@/Utils/request/query";
import { PaginatedResponse } from "@/Utils/request/types";
import { dateTimeQueryString, formatName } from "@/Utils/utils";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useAtom } from "jotai";
import { useTranslation } from "react-i18next";
import { useInView } from "react-intersection-observer";

import { encounterHistoryFiltersAtom } from "@/atoms/encounterFilterAtom";

function getEncounterHistoryScope(
  patientId: string,
  facilityId: string | undefined,
  primaryEncounter: EncounterRead | undefined,
) {
  return facilityId &&
    completedEncounterStatus.includes(primaryEncounter?.status ?? "")
    ? { patient_filter: patientId, facility: facilityId }
    : { patient: patientId };
}

interface EncounterCardProps {
  encounter: EncounterRead;
  isSelected: boolean;
  onSelect: (encounterId: string) => void;
  facilityId?: string;
}

function EncounterCard({
  encounter,
  isSelected,
  onSelect,
  facilityId,
}: EncounterCardProps) {
  const { t } = useTranslation();
  const isSameFacility = facilityId === encounter.facility.id;
  const careTeam = encounter.care_team;
  const additionalMembersCount = careTeam.length - 1;

  const cardContent = (
    <button
      type="button"
      aria-pressed={isSelected}
      className={cn(
        "relative w-full cursor-pointer rounded-md border text-left text-gray-950 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary-600",
        isSelected
          ? "bg-white border-primary-600 shadow-md"
          : "bg-gray-100 hover:bg-gray-100 shadow-none",
      )}
      onClick={() => onSelect(encounter.id)}
    >
      {isSelected && (
        <span className="absolute right-0 h-8 w-1 bg-primary-600 rounded-l inset-y-1/2 -translate-y-1/2" />
      )}
      <span className="flex flex-col px-4 py-3 gap-2">
        <span className="flex justify-between items-center">
          <span className="flex flex-col gap-1 min-w-0">
            <span className="text-base font-semibold">
              {t(`encounter_class__${encounter.encounter_class}`)}
            </span>
            <span className="text-sm font-medium text-gray-700 block truncate">
              {isSameFacility && careTeam.length > 0 ? (
                <span className="flex items-center gap-1">
                  <span className="truncate">
                    {formatName(careTeam[0].member)}
                  </span>
                  {additionalMembersCount > 0 && (
                    <span className="text-xs text-gray-500 shrink-0">
                      +{additionalMembersCount}
                    </span>
                  )}
                </span>
              ) : (
                encounter.facility.name
              )}
            </span>
            {encounter.tags.length > 0 && (
              <span className="hidden md:flex items-center py-1 pr-1 gap-2">
                <Tags className="size-4 text-gray-700" />
                <span className="text-sm text-gray-700 font-medium">
                  {t("encounter_tag_count", {
                    count: encounter.tags.length,
                  })}
                </span>
              </span>
            )}
          </span>
          <span className="flex flex-col gap-1 pt-0.5 items-end">
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
          </span>
        </span>
        {encounter.tags.length > 0 && (
          <span className="md:hidden flex flex-wrap gap-2">
            {encounter.tags.map((tag) => (
              <TagBadge key={tag.id} tag={tag} hierarchyDisplay />
            ))}
          </span>
        )}
        {isSameFacility && additionalMembersCount > 0 && (
          <span className="md:hidden flex flex-col gap-1">
            <span className="text-xs text-gray-500 font-medium">
              {t("care_team")}:
            </span>
            <span className="flex flex-wrap gap-2">
              {careTeam.map((member, index) => (
                <span
                  key={`${member.member.id}-${index}`}
                  className="text-sm text-gray-700 truncate max-w-32"
                >
                  {formatName(member.member)}
                  {member.role.display && (
                    <span className="text-xs text-gray-500">
                      {" "}
                      ({member.role.display})
                    </span>
                  )}
                </span>
              ))}
            </span>
          </span>
        )}
      </span>
    </button>
  );

  return (
    <HoverCard openDelay={200}>
      <HoverCardTrigger asChild className="hidden md:block">
        {cardContent}
      </HoverCardTrigger>
      <HoverCardContent
        className="w-96 p-0 border border-gray-200 rounded-lg shadow-lg"
        side="right"
        align="start"
      >
        <EncounterDetailsHoverCard encounter={encounter} />
      </HoverCardContent>
      <div className="md:hidden">{cardContent}</div>
    </HoverCard>
  );
}

interface Props {
  onSelect?: () => void;
}

const EncounterHistoryList = ({ onSelect }: Props) => {
  const { t } = useTranslation();
  const { ref, inView } = useInView();

  // Use persisted filters from atom
  const [filters, setFilters] = useAtom(encounterHistoryFiltersAtom);

  // Memoize date objects from ISO strings
  const dateFrom = useMemo(
    () => (filters.dateFrom ? new Date(filters.dateFrom) : undefined),
    [filters.dateFrom],
  );
  const dateTo = useMemo(
    () => (filters.dateTo ? new Date(filters.dateTo) : undefined),
    [filters.dateTo],
  );

  // Read directly from sessionStorage on mount to avoid Jotai hydration delay
  const initialQueryParamsRef = useRef(() => {
    try {
      const stored = sessionStorage.getItem("encounter_history_filters");
      if (stored) {
        const parsed = JSON.parse(stored);
        const selectedTags = parsed.selectedTags ?? [];
        return {
          status: parsed.status ? [parsed.status] : undefined,
          tags: selectedTags.length > 0 ? selectedTags : undefined,
          tags_behavior: parsed.tagsBehavior || "any",
          organization: parsed.selectedOrg ? [parsed.selectedOrg] : undefined,
          care_team: parsed.selectedCareTeamMember
            ? [parsed.selectedCareTeamMember]
            : undefined,
          created_date:
            parsed.dateFrom && parsed.dateTo
              ? { from: new Date(parsed.dateFrom), to: new Date(parsed.dateTo) }
              : undefined,
        };
      }
    } catch {
      // Ignore parsing errors
    }
    return {};
  });

  // Compute initial params once
  const initialQueryParams = useMemo(
    () =>
      typeof initialQueryParamsRef.current === "function"
        ? initialQueryParamsRef.current()
        : initialQueryParamsRef.current,
    [],
  );

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

  const historyScope = getEncounterHistoryScope(
    patientId,
    facilityId,
    primaryEncounter,
  );

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
      historyScope,
      filters.status,
      filters.selectedTags,
      filters.tagsBehavior,
      filters.selectedOrg?.id,
      filters.selectedCareTeamMember?.username,
      filters.dateFrom,
      filters.dateTo,
    ],
    queryFn: async ({ pageParam = 0, signal }) => {
      const response = await query(encounterApi.list, {
        queryParams: {
          limit: 14,
          offset: String(pageParam),
          ...historyScope,
          ...(filters.status && { status: filters.status }),
          ...(filters.selectedTags?.length > 0 && {
            tags: filters.selectedTags.map((t) => t.id).join(","),
            tags_behavior: filters.tagsBehavior || "any",
          }),
          ...(filters.selectedOrg && {
            organization: filters.selectedOrg.id,
          }),
          ...(filters.selectedCareTeamMember && {
            care_team_user: filters.selectedCareTeamMember.username,
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

  const onFilterUpdate = (updateQuery: Record<string, unknown>) => {
    setFilters((prev) => {
      const updates = { ...prev };
      for (const [key, value] of Object.entries(updateQuery)) {
        const filterValue = value as
          | string
          | TagConfig[]
          | FacilityOrganizationRead
          | UserReadMinimal
          | { from: Date; to: Date }
          | null
          | undefined;
        switch (key) {
          case "status":
            updates.status = (filterValue as string) || undefined;
            break;
          case "tags":
            updates.selectedTags = (filterValue as TagConfig[]) ?? [];
            break;
          case "tags_behavior":
            updates.tagsBehavior = (filterValue as string) || "any";
            break;
          case "organization":
            updates.selectedOrg =
              (filterValue as FacilityOrganizationRead) || undefined;
            break;
          case "care_team": {
            // filterValue is a single UserReadMinimal (mode is "single")
            updates.selectedCareTeamMember =
              (filterValue as UserReadMinimal) || undefined;
            break;
          }
          case "created_date":
            if (
              filterValue &&
              typeof filterValue === "object" &&
              "from" in filterValue &&
              "to" in filterValue
            ) {
              updates.dateFrom = (filterValue.from as Date)?.toISOString();
              updates.dateTo = (filterValue.to as Date)?.toISOString();
            } else {
              updates.dateFrom = undefined;
              updates.dateTo = undefined;
            }
            break;
        }
      }
      return updates;
    });
  };

  const filterConfigs = [
    encounterStatusFilter("status"),
    tagFilter("tags", TagResource.ENCOUNTER),
    departmentFilter("organization"),
    careTeamFilter("care_team"),
    dateFilter("created_date"),
  ];
  const {
    selectedFilters,
    handleFilterChange,
    handleOperationChange,
    handleClearAll,
    handleClearFilter,
  } = useMultiFilterState(filterConfigs, onFilterUpdate, initialQueryParams);

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
              facilityId={facilityId}
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
            className="w-full min-w-0"
            triggerButtonClassName="self-start"
            selectedBarClassName="md:w-full"
            selectedValueClassName="w-0 flex-1 md:w-0 md:flex-1 md:max-w-none lg:max-w-none xl:max-w-none"
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
                    facilityId={facilityId}
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
  const isDesktop = useBreakpoints({ default: false, lg: true });
  const { t } = useTranslation();
  const { patientId, facilityId, primaryEncounter } = useEncounter();
  const historyScope = getEncounterHistoryScope(
    patientId,
    facilityId,
    primaryEncounter,
  );
  const { data: encounters } = useQuery<PaginatedResponse<EncounterListRead>>({
    queryKey: ["encounters", "history-count", historyScope],
    queryFn: query(encounterApi.list, {
      queryParams: { ...historyScope, limit: 1 },
    }),
    enabled: !!primaryEncounter,
  });
  const encounterCount = encounters?.count;

  const trigger = (
    <Button
      type="button"
      variant="outline"
      className="h-11 w-full justify-between gap-2 rounded-[10px] border-gray-200 bg-white px-3 text-[15px] font-semibold text-gray-950 shadow-none"
    >
      <span>{t("encounter_history")}</span>
      <span className="flex items-center gap-2">
        {encounterCount !== undefined && (
          <span className="flex h-5.5 min-w-5.5 items-center justify-center rounded-full bg-gray-100 px-1 text-sm font-semibold text-gray-700 tabular-nums">
            {encounterCount}
          </span>
        )}
        <ChevronDown
          aria-hidden="true"
          className={cn("size-4 text-gray-500 transition-transform", {
            "rotate-180": isOpen,
          })}
        />
      </span>
    </Button>
  );

  if (isDesktop) {
    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={8}
          aria-label={t("encounter_history")}
          className="max-h-[min(36rem,var(--radix-popover-content-available-height))] w-96 max-w-[calc(100vw-2rem)] overflow-y-auto p-4"
        >
          <EncounterHistoryList onSelect={() => setIsOpen(false)} />
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerContent className="px-4" aria-describedby={undefined}>
        <DrawerHeader className="py-3">
          <DrawerTitle className="text-lg font-semibold">
            {t("encounter_history")}
          </DrawerTitle>
        </DrawerHeader>
        <div className="min-h-0 overflow-y-auto pb-4 pr-2">
          <EncounterHistoryList onSelect={() => setIsOpen(false)} />
        </div>
      </DrawerContent>
    </Drawer>
  );
}

const EncounterDetailsHoverCard = ({
  encounter,
}: {
  encounter: EncounterRead;
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex flex-col gap-1">
          <span className="text-base font-semibold">
            {t(`encounter_class__${encounter.encounter_class}`)}
          </span>
          <Badge variant={ENCOUNTER_STATUS_COLORS[encounter.status]} size="sm">
            {t(`encounter_status__${encounter.status}`)}
          </Badge>
        </div>
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <Calendar className="size-4" />
          <span>
            {encounter.period.start && (
              <span>
                {format(new Date(encounter.period.start), "dd MMM yyyy")}
              </span>
            )}
            {encounter.period.end ? (
              <span>
                {" - "}
                {format(new Date(encounter.period.end), "dd MMM yyyy")}
              </span>
            ) : (
              <span> - {t("ongoing")}</span>
            )}
          </span>
        </div>
      </div>

      {/* Details */}
      <div className="p-4 space-y-3">
        {/* Facility */}
        <div className="flex items-start gap-2">
          <Building2 className="size-4 text-gray-500 mt-0.5" />
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 font-medium">
              {t("facility")}
            </span>
            <span className="text-sm text-gray-800 truncate max-w-72">
              {encounter.facility.name}
            </span>
          </div>
        </div>

        {/* Location */}
        {encounter.current_location && (
          <div className="flex items-start gap-2">
            <MapPin className="size-4 text-gray-500 mt-0.5" />
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 font-medium">
                {t("location")}
              </span>
              <span className="text-sm text-gray-800 truncate max-w-72">
                {encounter.current_location.name}
              </span>
            </div>
          </div>
        )}

        {/* Priority */}
        {encounter.priority && (
          <div className="flex items-start gap-2">
            <div className="size-4" />
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 font-medium">
                {t("priority")}
              </span>
              <span className="text-sm text-gray-800">
                {t(`encounter_priority__${encounter.priority}`)}
              </span>
            </div>
          </div>
        )}

        {/* Care Team */}
        {encounter.care_team.length > 0 && (
          <div className="flex items-start gap-2">
            <Users className="size-4 text-gray-500 mt-0.5" />
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-500 font-medium">
                {t("care_team")}
              </span>
              <div className="flex flex-col gap-1">
                {encounter.care_team.map((member, index) => (
                  <div
                    key={`${member.member.id}-${index}`}
                    className="flex items-center gap-2"
                  >
                    <span className="text-sm text-gray-800 truncate max-w-48">
                      {formatName(member.member)}
                    </span>
                    {member.role.display && (
                      <span className="text-xs text-gray-500 truncate max-w-24">
                        ({member.role.display})
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tags */}
        {encounter.tags.length > 0 && (
          <div className="flex items-start gap-2">
            <Tags className="size-4 text-gray-500 mt-0.5" />
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-500 font-medium">
                {t("tags")}
              </span>
              <div className="flex flex-wrap gap-1">
                {encounter.tags.map((tag) => (
                  <TagBadge key={tag.id} tag={tag} hierarchyDisplay />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Organizations/Departments */}
        {encounter.organizations && encounter.organizations.length > 0 && (
          <div className="flex items-start gap-2">
            <div className="size-4" />
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-500 font-medium">
                {t("departments")}
              </span>
              <div className="flex flex-wrap gap-1">
                {encounter.organizations.map((org) => (
                  <Badge key={org.id} variant="outline" size="sm">
                    {org.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
