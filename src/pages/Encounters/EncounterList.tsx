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
import SearchInput from "@/components/Common/SearchInput";
import { CardGridSkeleton } from "@/components/Common/SkeletonLoading";
import EncounterInfoCard from "@/components/Encounter/EncounterInfoCard";
import { TagSelectorPopover } from "@/components/Tags/TagAssignmentSheet";

import useFilters from "@/hooks/useFilters";

import query from "@/Utils/request/query";
import {
  ENCOUNTER_STATUS_ICONS,
  EncounterPriority,
  EncounterRead,
} from "@/types/emr/encounter/encounter";
import encounterApi from "@/types/emr/encounter/encounterApi";
import { TagConfig, TagResource } from "@/types/emr/tagConfig/tagConfig";
import useTagConfigs from "@/types/emr/tagConfig/useTagConfig";

interface EncounterListProps {
  encounters?: EncounterRead[];
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
        {t("no_encounters_found_description")}
      </p>
    </Card>
  );
}

export function EncounterList({
  encounters: propEncounters,
  facilityId,
}: EncounterListProps) {
  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: 15,
    cacheBlacklist: ["name", "encounter_id", "external_identifier", "tags"],
  });
  const { t } = useTranslation();
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
      tags: qParams.tags,
    });
  };

  const handleSearch = useCallback(
    (key: string, value: string) => {
      updateQuery({
        ...{
          status,
          encounter_class: encounterClass,
          priority,
          tags: qParams.tags,
        },
        [key]: value || undefined,
      });
    },
    [status, encounterClass, priority, updateQuery],
  );

  const { data: queryEncounters, isLoading } = useQuery({
    queryKey: ["encounters", facilityId, qParams],
    queryFn: query.debounced(encounterApi.list, {
      queryParams: {
        ...buildQueryParams(facilityId, status, encounterClass, priority),
        name,
        external_identifier,
        limit: resultsPerPage,
        offset: ((qParams.page || 1) - 1) * resultsPerPage,
        tags: qParams.tags,
      },
    }),
    enabled: !propEncounters && !encounter_id,
  });

  const { data: queryEncounter } = useQuery({
    queryKey: ["encounter", encounter_id],
    queryFn: query(encounterApi.get, {
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
      type: "text" as const,
      placeholder: t("search_by_patient_name"),
      value: name || "",
      display: t("name"),
    },
    {
      key: "encounter_id",
      type: "text" as const,
      placeholder: t("search_by_encounter_id"),
      value: encounter_id || "",
      display: t("encounter_id"),
    },
    {
      key: "external_identifier",
      type: "text" as const,
      placeholder: t("search_by_external_id"),
      value: external_identifier || "",
      display: t("external_identifier"),
    },
  ];

  const encounters =
    propEncounters ||
    queryEncounters?.results ||
    (queryEncounter ? [queryEncounter] : []);

  const tagIds = qParams.tags?.split(",") || [];
  const tagQueries = useTagConfigs({ ids: tagIds, facilityId });
  const selectedTags = tagQueries
    .map((query) => query.data)
    .filter(Boolean) as TagConfig[];

  return (
    <Page
      title={t("encounters")}
      componentRight={
        <Badge className="bg-purple-50 text-purple-700 ml-2 rounded-xl px-3 py-0.5 m-3 w-max border-gray-200">
          {isLoading
            ? t("loading")
            : t("entity_count", {
                count: queryEncounters?.count ?? 0,
                entity: "Encounter",
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
                    className="w-[20rem] p-3 border-none"
                    align="start"
                    onEscapeKeyDown={(event) => event.preventDefault()}
                  >
                    <div className="space-y-4">
                      <h4 className="font-medium leading-none">
                        {t("search_encounters")}
                      </h4>
                      <SearchInput
                        data-cy="encounter-search"
                        options={searchOptions}
                        onFieldChange={handleFieldChange}
                        onSearch={handleSearch}
                        className="w-full border-none shadow-none"
                        autoFocus
                      />
                    </div>
                  </PopoverContent>
                </Popover>

                <div>
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
                    <SelectTrigger className="h-9 w-[120px]">
                      <SelectValue placeholder={t("priority")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("all_priorities")}</SelectItem>
                      <SelectItem value="asap">
                        <div className="flex items-center">
                          <span className="mr-2">🟡</span>{" "}
                          {t("encounter_priority__ASAP")}
                        </div>
                      </SelectItem>
                      <SelectItem value="callback_results">
                        <div className="flex items-center">
                          <span className="mr-2">🔵</span>
                          {t("encounter_priority__callback_results")}
                        </div>
                      </SelectItem>
                      <SelectItem value="callback_for_scheduling">
                        <div className="flex items-center">
                          <span className="mr-2">🟣</span>
                          {t("encounter_priority__callback_for_scheduling")}
                        </div>
                      </SelectItem>
                      <SelectItem value="elective">
                        <div className="flex items-center">
                          <span className="mr-2">🟤</span>
                          {t("encounter_priority__elective")}
                        </div>
                      </SelectItem>
                      <SelectItem value="emergency">
                        <div className="flex items-center">
                          <span className="mr-2">🔴</span>{" "}
                          {t("encounter_priority__emergency")}
                        </div>
                      </SelectItem>
                      <SelectItem value="preop">
                        <div className="flex items-center">
                          <span className="mr-2">🟠</span>{" "}
                          {t("encounter_priority__preop")}
                        </div>
                      </SelectItem>
                      <SelectItem value="as_needed">
                        <div className="flex items-center">
                          <span className="mr-2">⚫️</span>
                          {t("encounter_priority__as_needed")}
                        </div>
                      </SelectItem>
                      <SelectItem value="routine">
                        <div className="flex items-center">
                          <span className="mr-2">⚪️</span>
                          {t("encounter_priority__routine")}
                        </div>
                      </SelectItem>
                      <SelectItem value="rush_reporting">
                        <div className="flex items-center">
                          <span className="mr-2">🟤</span>
                          {t("encounter_priority__rush_reporting")}
                        </div>
                      </SelectItem>
                      <SelectItem value="stat">
                        <div className="flex items-center">
                          <span className="mr-2">🔴</span>{" "}
                          {t("encounter_priority__stat")}
                        </div>
                      </SelectItem>
                      <SelectItem value="timing_critical">
                        <div className="flex items-center">
                          <span className="mr-2">🟡</span>
                          {t("encounter_priority__timing_critical")}
                        </div>
                      </SelectItem>
                      <SelectItem value="use_as_directed">
                        <div className="flex items-center">
                          <span className="mr-2">🔵</span>
                          {t("encounter_priority__use_as_directed")}
                        </div>
                      </SelectItem>
                      <SelectItem value="urgent">
                        <div className="flex items-center">
                          <span className="mr-2">🟠</span>{" "}
                          {t("encounter_priority__urgent")}
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <TagSelectorPopover
                  asFilter
                  selected={selectedTags}
                  onChange={(tags) => {
                    updateQuery({
                      tags: tags.map((tag) => tag.id),
                    });
                  }}
                  resource={TagResource.ENCOUNTER}
                  className="w-auto mt-0 h-8"
                />

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
                      <SelectItem value="planned">
                        <div className="flex items-center">
                          <CareIcon icon="l-calender" className="mr-2 size-4" />
                          {t("planned")}
                        </div>
                      </SelectItem>
                      <SelectItem value="in_progress">
                        <div className="flex items-center">
                          <CareIcon icon="l-spinner" className="mr-2 size-4" />
                          {t("in_progress")}
                        </div>
                      </SelectItem>
                      <SelectItem value="completed">
                        <div className="flex items-center">
                          <CareIcon icon="l-check" className="mr-2 size-4" />
                          {t("completed")}
                        </div>
                      </SelectItem>
                      <SelectItem value="cancelled">
                        <div className="flex items-center">
                          <CareIcon icon="l-x" className="mr-2 size-4" />
                          {t("cancelled")}
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
                      <SelectItem value="imp">
                        <div className="flex items-center">
                          <CareIcon icon="l-hospital" className="mr-2 size-4" />
                          {t("inpatient")}
                        </div>
                      </SelectItem>
                      <SelectItem value="amb">
                        <div className="flex items-center">
                          <CareIcon icon="l-user" className="mr-2 size-4" />
                          {t("ambulatory")}
                        </div>
                      </SelectItem>
                      <SelectItem value="obsenc">
                        <div className="flex items-center">
                          <CareIcon icon="l-eye" className="mr-2 size-4" />
                          {t("observation")}
                        </div>
                      </SelectItem>
                      <SelectItem value="emer">
                        <div className="flex items-center">
                          <CareIcon
                            icon="l-ambulance"
                            className="mr-2 size-4"
                          />
                          {t("emergency")}
                        </div>
                      </SelectItem>
                      <SelectItem value="vr">
                        <div className="flex items-center">
                          <CareIcon icon="l-video" className="mr-2 size-4" />
                          {t("virtual")}
                        </div>
                      </SelectItem>
                      <SelectItem value="hh">
                        <div className="flex items-center">
                          <CareIcon icon="l-home" className="mr-2 size-4" />
                          {t("home_health")}
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Status Filter - Desktop */}
              <div className="hidden md:flex items-center">
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
                      {(
                        [
                          "planned",
                          "in_progress",
                          "discharged",
                          "completed",
                          "cancelled",
                        ] as const
                      ).map((status) => (
                        <TabsTrigger
                          key={status}
                          value={status}
                          className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                          onClick={() =>
                            updateQuery({
                              ...{ encounter_class: encounterClass, priority },
                              status,
                            })
                          }
                        >
                          <CareIcon
                            icon={ENCOUNTER_STATUS_ICONS[status]}
                            className="size-4"
                          />
                          {t(`encounter_status__${status}`)}
                        </TabsTrigger>
                      ))}
                    </div>
                  </TabsList>
                </Tabs>
              </div>
            </div>

            <Separator className="hidden md:block" />

            {/* Class Filter - Desktop */}
            <div className="hidden md:block p-4">
              <Tabs value={encounterClass || "all"} className="w-full">
                <TabsList className="bg-transparent p-0 h-8">
                  <div className="flex flex-wrap">
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
                      value="imp"
                      className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                      onClick={() =>
                        updateQuery({
                          status,
                          priority,
                          encounter_class: "imp",
                        })
                      }
                    >
                      <CareIcon icon="l-hospital" className="size-4" />
                      {t("encounter_class__imp")}
                    </TabsTrigger>
                    <TabsTrigger
                      value="amb"
                      className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                      onClick={() =>
                        updateQuery({
                          status,
                          priority,
                          encounter_class: "amb",
                        })
                      }
                    >
                      <CareIcon icon="l-user" className="size-4" />
                      {t("encounter_class__amb")}
                    </TabsTrigger>
                    <TabsTrigger
                      value="obsenc"
                      className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                      onClick={() =>
                        updateQuery({
                          status,
                          priority,
                          encounter_class: "obsenc",
                        })
                      }
                    >
                      <CareIcon icon="l-eye" className="size-4" />
                      {t("encounter_class__obsenc")}
                    </TabsTrigger>
                    <TabsTrigger
                      value="emer"
                      className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                      onClick={() =>
                        updateQuery({
                          status,
                          priority,
                          encounter_class: "emer",
                        })
                      }
                    >
                      <CareIcon icon="l-ambulance" className="size-4" />
                      {t("emergency")}
                    </TabsTrigger>
                    <TabsTrigger
                      value="vr"
                      className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                      onClick={() =>
                        updateQuery({
                          status,
                          priority,
                          encounter_class: "vr",
                        })
                      }
                    >
                      <CareIcon icon="l-video" className="size-4" />
                      {t("encounter_class__vr")}
                    </TabsTrigger>
                    <TabsTrigger
                      value="hh"
                      className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                      onClick={() =>
                        updateQuery({
                          status,
                          priority,
                          encounter_class: "hh",
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
              {encounters.map((encounter: EncounterRead) => (
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
