import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import Page from "@/components/Common/Page";
import SearchByMultipleFields from "@/components/Common/SearchByMultipleFields";
import { CardGridSkeleton } from "@/components/Common/SkeletonLoading";
import EncounterInfoCard from "@/components/Encounter/EncounterInfoCard";

import useFilters from "@/hooks/useFilters";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import { PaginatedResponse } from "@/Utils/request/types";
import { Encounter, EncounterPriority } from "@/types/emr/encounter";

const ENCOUNTER_PRIORITY = {
  ASAP: "asap",
  CALLBACK_RESULTS: "callback_results",
  CALLBACK_SCHEDULING: "callback_for_scheduling",
  ELECTIVE: "elective",
  EMERGENCY: "emergency",
  PREOP: "preop",
  AS_NEEDED: "as_needed",
  ROUTINE: "routine",
  RUSH_REPORTING: "rush_reporting",
  STAT: "stat",
  TIMING_CRITICAL: "timing_critical",
  USE_AS_DIRECTED: "use_as_directed",
  URGENT: "urgent",
};

const ENCOUNTER_STATUS = {
  PLANNED: "planned",
  IN_PROGRESS: "in_progress",
  DISCHARGED: "discharged",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

const ENCOUNTER_CLASS = {
  INPATIENT: "imp",
  AMBULATORY: "amb",
  OBSERVATION: "obsenc",
  EMERGENCY: "emer",
  VIRTUAL: "vr",
  HOME_HEALTH: "hh",
};

const PRIORITY_EMOJI = {
  [ENCOUNTER_PRIORITY.ASAP]: "🟡",
  [ENCOUNTER_PRIORITY.CALLBACK_RESULTS]: "🔵",
  [ENCOUNTER_PRIORITY.CALLBACK_SCHEDULING]: "🟣",
  [ENCOUNTER_PRIORITY.ELECTIVE]: "🟤",
  [ENCOUNTER_PRIORITY.EMERGENCY]: "🔴",
  [ENCOUNTER_PRIORITY.PREOP]: "🟠",
  [ENCOUNTER_PRIORITY.AS_NEEDED]: "⚫️",
  [ENCOUNTER_PRIORITY.ROUTINE]: "⚪️",
  [ENCOUNTER_PRIORITY.RUSH_REPORTING]: "🟤",
  [ENCOUNTER_PRIORITY.STAT]: "🔴",
  [ENCOUNTER_PRIORITY.TIMING_CRITICAL]: "🟡",
  [ENCOUNTER_PRIORITY.USE_AS_DIRECTED]: "🔵",
  [ENCOUNTER_PRIORITY.URGENT]: "🟠",
};

interface EncounterListProps {
  encounters?: Encounter[];
  facilityId: string;
}

const buildQueryParams = (
  facilityId: string,
  status?: string,
  encounterClass?: string,
  priority?: string,
) => {
  const params: Record<string, string | undefined> = {};
  if (facilityId) {
    params.facility = facilityId;
  }
  if (status && ["live", "ended"].includes(status)) {
    params.live = status === "live" ? "true" : undefined;
  } else if (status) {
    params.status = status;
  }
  if (encounterClass) {
    params.encounter_class = encounterClass;
  }
  if (priority) {
    params.priority = priority;
  }
  return params;
};

function EmptyState() {
  const { t } = useTranslation();

  return (
    <Card className="flex flex-col items-center justify-center p-8 text-center border-dashed">
      <div className="rounded-full bg-primary/10 p-3 mb-4">
        <CareIcon icon="l-folder-open" className="size-6 text-primary" />
      </div>
      <h3 className="text-lg font-semibold mb-1">{t("no_encounters_found")}</h3>
      <p className="text-sm text-gray-500 mb-4">
        {t("adjust_filters_or_create")}
      </p>
    </Card>
  );
}

export function EncounterList({
  encounters: propEncounters,
  facilityId,
}: EncounterListProps) {
  const { t } = useTranslation();

  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: 15,
    cacheBlacklist: ["name", "encounter_id", "external_identifier"],
  });
  const {
    status,
    encounter_class: encounterClass,
    priority,
    name,
    encounter_id,
    external_identifier,
  } = qParams;
  const handleFieldChange = () => {
    updateQuery({
      status,
      encounter_class: encounterClass,
      priority,
      name: undefined,
      encounter_id: undefined,
      external_identifier: undefined,
    });
  };

  const handleSearch = useCallback(
    (key: string, value: string) => {
      updateQuery({
        ...{
          status,
          encounter_class: encounterClass,
          priority,
        },
        [key]: value || undefined,
      });
    },
    [status, encounterClass, priority, updateQuery],
  );

  const { data: queryEncounters, isLoading } = useQuery<
    PaginatedResponse<Encounter>
  >({
    queryKey: ["encounters", facilityId, qParams],
    queryFn: query.debounced(routes.encounter.list, {
      queryParams: {
        ...buildQueryParams(facilityId, status, encounterClass, priority),
        name,
        external_identifier,
        limit: resultsPerPage,
        offset: ((qParams.page || 1) - 1) * resultsPerPage,
      },
    }),
    enabled: !propEncounters && !encounter_id,
  });

  const { data: queryEncounter } = useQuery<Encounter>({
    queryKey: ["encounter", encounter_id],
    queryFn: query(routes.encounter.get, {
      pathParams: { id: encounter_id },
      queryParams: {
        facility: facilityId,
      },
    }),
    enabled: !!encounter_id,
  });
  const searchOptions = [
    {
      key: "name",
      label: t("patient_name"),
      type: "text" as const,
      placeholder: t("search_by_patient_name"),
      value: name || "",
    },
    {
      key: "encounter_id",
      label: t("encounter_id"),
      type: "text" as const,
      placeholder: t("search_by_encounter_id"),
      value: encounter_id || "",
    },
    {
      key: "external_identifier",
      label: t("external_id"),
      type: "text" as const,
      placeholder: t("search_by_external_id"),
      value: external_identifier || "",
    },
  ];

  const encounters =
    propEncounters ||
    queryEncounters?.results ||
    (queryEncounter ? [queryEncounter] : []);

  return (
    <Page
      title={t("encounters")}
      componentRight={
        <Badge
          className="bg-purple-50 text-purple-700 ml-2 text-sm font-medium rounded-xl px-3 m-3 w-max"
          variant="outline"
        >
          {isLoading
            ? t("loading")
            : t("entity_count", {
                count: queryEncounters?.count ?? 0,
                entity: t("encounter"),
              })}
        </Badge>
      }
    >
      <div className="space-y-4 mt-4 flex flex-col">
        <div className="rounded-lg border border-gray-200 bg-card shadow-xs flex flex-col">
          <div className="flex flex-col">
            <div className="flex flex-wrap items-center justify-between gap-2 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      data-cy="search-encounter"
                      variant="outline"
                      size="sm"
                      className={cn(
                        "h-8 min-w-[120px] justify-start",
                        (name || encounter_id || external_identifier) &&
                          "bg-primary/10 text-primary hover:bg-primary/20",
                      )}
                    >
                      <CareIcon icon="l-search" className="mr-2 size-4" />
                      {name || encounter_id || external_identifier ? (
                        <span className="truncate">
                          {name || encounter_id || external_identifier}
                        </span>
                      ) : (
                        t("search")
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[20rem] p-3"
                    align="start"
                    onEscapeKeyDown={(event) => event.preventDefault()}
                  >
                    <div className="space-y-4">
                      <h4 className="font-medium leading-none">
                        {t("search_encounters")}
                      </h4>
                      <SearchByMultipleFields
                        id="encounter-search"
                        options={searchOptions}
                        initialOptionIndex={Math.max(
                          searchOptions.findIndex(
                            (option) => option.value !== "",
                          ),
                          0,
                        )}
                        onFieldChange={handleFieldChange}
                        onSearch={handleSearch}
                        className="w-full border-none shadow-none"
                        autoFocus
                      />
                    </div>
                  </PopoverContent>
                </Popover>

                <Select
                  value={priority || "all"}
                  onValueChange={(value) => {
                    updateQuery({
                      status,
                      encounter_class: encounterClass,
                      priority:
                        value === "all"
                          ? undefined
                          : (value as EncounterPriority),
                    });
                  }}
                >
                  <SelectTrigger className="h-8 w-[120px]">
                    <SelectValue placeholder={t("priority")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("all_priorities")}</SelectItem>
                    {Object.entries(ENCOUNTER_PRIORITY).map(([, value]) => (
                      <SelectItem key={value} value={value}>
                        <div className="flex items-center">
                          <span className="mr-2">{PRIORITY_EMOJI[value]}</span>
                          {t(`encounter_priority__${value}`)}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Status Filter - Mobile */}
                <div className="md:hidden">
                  <Select
                    value={status || "all"}
                    onValueChange={(value) => {
                      updateQuery({
                        ...{ encounter_class: encounterClass, priority },
                        status: value === "all" ? undefined : value,
                      });
                    }}
                  >
                    <SelectTrigger className="h-8 w-[120px]">
                      <SelectValue placeholder={t("status")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("all_status")}</SelectItem>
                      <SelectItem value={ENCOUNTER_STATUS.PLANNED}>
                        <div className="flex items-center">
                          <CareIcon icon="l-calender" className="mr-2 size-4" />
                          {t("encounter_status__planned")}
                        </div>
                      </SelectItem>
                      <SelectItem value={ENCOUNTER_STATUS.IN_PROGRESS}>
                        <div className="flex items-center">
                          <CareIcon icon="l-spinner" className="mr-2 size-4" />
                          {t("encounter_status__in_progress")}
                        </div>
                      </SelectItem>
                      <SelectItem value={ENCOUNTER_STATUS.COMPLETED}>
                        <div className="flex items-center">
                          <CareIcon icon="l-check" className="mr-2 size-4" />
                          {t("encounter_status__completed")}
                        </div>
                      </SelectItem>
                      <SelectItem value={ENCOUNTER_STATUS.CANCELLED}>
                        <div className="flex items-center">
                          <CareIcon icon="l-x" className="mr-2 size-4" />
                          {t("encounter_status__cancelled")}
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Class Filter - Mobile */}
                <div className="md:hidden">
                  <Select
                    value={encounterClass || "all"}
                    onValueChange={(value) => {
                      updateQuery({
                        status,
                        priority,
                        encounter_class: value === "all" ? undefined : value,
                      });
                    }}
                  >
                    <SelectTrigger className="h-8 w-[120px]">
                      <SelectValue placeholder={t("type")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("all_types")}</SelectItem>
                      <SelectItem value={ENCOUNTER_CLASS.INPATIENT}>
                        <div className="flex items-center">
                          <CareIcon icon="l-hospital" className="mr-2 size-4" />
                          {t("encounter_class__imp")}
                        </div>
                      </SelectItem>
                      <SelectItem value={ENCOUNTER_CLASS.AMBULATORY}>
                        <div className="flex items-center">
                          <CareIcon icon="l-user" className="mr-2 size-4" />
                          {t("encounter_class__amb")}
                        </div>
                      </SelectItem>
                      <SelectItem value={ENCOUNTER_CLASS.OBSERVATION}>
                        <div className="flex items-center">
                          <CareIcon icon="l-eye" className="mr-2 size-4" />
                          {t("encounter_class__obsenc")}
                        </div>
                      </SelectItem>
                      <SelectItem value={ENCOUNTER_CLASS.EMERGENCY}>
                        <div className="flex items-center">
                          <CareIcon
                            icon="l-ambulance"
                            className="mr-2 size-4"
                          />
                          {t("encounter_class__emer")}
                        </div>
                      </SelectItem>
                      <SelectItem value={ENCOUNTER_CLASS.VIRTUAL}>
                        <div className="flex items-center">
                          <CareIcon icon="l-video" className="mr-2 size-4" />
                          {t("encounter_class__vr")}
                        </div>
                      </SelectItem>
                      <SelectItem value={ENCOUNTER_CLASS.HOME_HEALTH}>
                        <div className="flex items-center">
                          <CareIcon icon="l-home" className="mr-2 size-4" />
                          {t("encounter_class__hh")}
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Status Filter - Desktop */}
              <div className="hidden md:flex items-center py-1 mt-3">
                <Tabs value={status || "all"} className="w-full">
                  <TabsList className="bg-transparent p-0 h-8">
                    <div className="flex flex-wrap">
                      <TabsTrigger
                        value="all"
                        className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                        onClick={() =>
                          updateQuery({
                            ...{ encounter_class: encounterClass, priority },
                            status: undefined,
                          })
                        }
                      >
                        {t("all_status")}
                      </TabsTrigger>
                      <TabsTrigger
                        data-cy="planned-filter"
                        value={ENCOUNTER_STATUS.PLANNED}
                        className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                        onClick={() =>
                          updateQuery({
                            ...{ encounter_class: encounterClass, priority },
                            status: ENCOUNTER_STATUS.PLANNED,
                          })
                        }
                      >
                        <CareIcon icon="l-calender" className="size-4" />
                        {t("encounter_status__planned")}
                      </TabsTrigger>
                      <TabsTrigger
                        data-cy="in-progress-filter"
                        value={ENCOUNTER_STATUS.IN_PROGRESS}
                        className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                        onClick={() =>
                          updateQuery({
                            ...{ encounter_class: encounterClass, priority },
                            status: ENCOUNTER_STATUS.IN_PROGRESS,
                          })
                        }
                      >
                        <CareIcon icon="l-spinner" className="size-4" />
                        {t("encounter_status__in_progress")}
                      </TabsTrigger>
                      <TabsTrigger
                        value={ENCOUNTER_STATUS.DISCHARGED}
                        className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                        onClick={() =>
                          updateQuery({
                            ...{ encounter_class: encounterClass, priority },
                            status: ENCOUNTER_STATUS.DISCHARGED,
                          })
                        }
                      >
                        <CareIcon icon="l-home" className="size-4" />
                        {t("encounter_status__discharged")}
                      </TabsTrigger>
                      <TabsTrigger
                        value={ENCOUNTER_STATUS.COMPLETED}
                        className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                        onClick={() =>
                          updateQuery({
                            ...{ encounter_class: encounterClass, priority },
                            status: ENCOUNTER_STATUS.COMPLETED,
                          })
                        }
                      >
                        <CareIcon icon="l-check" className="size-4" />
                        {t("encounter_status__completed")}
                      </TabsTrigger>
                      <TabsTrigger
                        value={ENCOUNTER_STATUS.CANCELLED}
                        className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                        onClick={() =>
                          updateQuery({
                            ...{ encounter_class: encounterClass, priority },
                            status: ENCOUNTER_STATUS.CANCELLED,
                          })
                        }
                      >
                        <CareIcon icon="l-x" className="size-4" />
                        {t("encounter_status__cancelled")}
                      </TabsTrigger>
                    </div>
                  </TabsList>
                </Tabs>
              </div>
            </div>

            <Separator className="hidden md:block" />

            {/* Class Filter - Desktop */}
            <div className="hidden md:flex justify-center items-center p-4 pb-0 md:pb-6 mb-5 lg:py-2 lg:mb-0">
              <Tabs value={encounterClass || "all"} className="w-full">
                <TabsList className="bg-transparent p-0 flex-wrap gap-1 ">
                  <div className="flex flex-wrap gap-1 w-full">
                    <TabsTrigger
                      value="all"
                      className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                      onClick={() =>
                        updateQuery({
                          status,
                          priority,
                          encounter_class: undefined,
                        })
                      }
                    >
                      {t("all_types")}
                    </TabsTrigger>
                    <TabsTrigger
                      value={ENCOUNTER_CLASS.INPATIENT}
                      className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                      onClick={() =>
                        updateQuery({
                          status,
                          priority,
                          encounter_class: ENCOUNTER_CLASS.INPATIENT,
                        })
                      }
                    >
                      <CareIcon icon="l-hospital" className="size-4" />
                      {t("encounter_class__imp")}
                    </TabsTrigger>
                    <TabsTrigger
                      value={ENCOUNTER_CLASS.AMBULATORY}
                      className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                      onClick={() =>
                        updateQuery({
                          status,
                          priority,
                          encounter_class: ENCOUNTER_CLASS.AMBULATORY,
                        })
                      }
                    >
                      <CareIcon icon="l-user" className="size-4" />
                      {t("encounter_class__amb")}
                    </TabsTrigger>
                    <TabsTrigger
                      value={ENCOUNTER_CLASS.OBSERVATION}
                      className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                      onClick={() =>
                        updateQuery({
                          status,
                          priority,
                          encounter_class: ENCOUNTER_CLASS.OBSERVATION,
                        })
                      }
                    >
                      <CareIcon icon="l-eye" className="size-4" />
                      {t("encounter_class__obsenc")}
                    </TabsTrigger>
                    <TabsTrigger
                      value={ENCOUNTER_CLASS.EMERGENCY}
                      className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                      onClick={() =>
                        updateQuery({
                          status,
                          priority,
                          encounter_class: ENCOUNTER_CLASS.EMERGENCY,
                        })
                      }
                    >
                      <CareIcon icon="l-ambulance" className="size-4" />
                      {t("encounter_class__emer")}
                    </TabsTrigger>
                    <TabsTrigger
                      value={ENCOUNTER_CLASS.VIRTUAL}
                      className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                      onClick={() =>
                        updateQuery({
                          status,
                          priority,
                          encounter_class: ENCOUNTER_CLASS.VIRTUAL,
                        })
                      }
                    >
                      <CareIcon icon="l-video" className="size-4" />
                      {t("encounter_class__vr")}
                    </TabsTrigger>
                    <TabsTrigger
                      value={ENCOUNTER_CLASS.HOME_HEALTH}
                      className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                      onClick={() =>
                        updateQuery({
                          status,
                          priority,
                          encounter_class: ENCOUNTER_CLASS.HOME_HEALTH,
                        })
                      }
                    >
                      <CareIcon icon="l-home" className="size-4" />
                      {t("encounter_class__hh")}
                    </TabsTrigger>
                  </div>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </div>

        <div
          className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3"
          data-cy="encounter-list-cards"
        >
          {isLoading ? (
            <CardGridSkeleton count={6} />
          ) : encounters.length === 0 ? (
            <div className="col-span-full">
              <EmptyState />
            </div>
          ) : (
            <>
              {encounters.map((encounter: Encounter) => (
                <EncounterInfoCard
                  key={encounter.id}
                  encounter={encounter}
                  facilityId={facilityId}
                />
              ))}
              {queryEncounters?.count &&
                queryEncounters.count > resultsPerPage && (
                  <div className="col-span-full">
                    <Pagination totalCount={queryEncounters.count} />
                  </div>
                )}
            </>
          )}
        </div>
      </div>
    </Page>
  );
}
