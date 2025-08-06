import { useQuery } from "@tanstack/react-query";
import { CircleDashed, Settings2 } from "lucide-react";
import { useCallback } from "react";
import React from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FilterSelect } from "@/components/ui/filter-select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import Page from "@/components/Common/Page";
import SearchInput from "@/components/Common/SearchInput";
import { CardGridSkeleton } from "@/components/Common/SkeletonLoading";
import EncounterInfoCard from "@/components/Encounter/EncounterInfoCard";
import PatientIdentifierFilter from "@/components/Patient/PatientIdentifierFilter";
import { TagSelectorPopover } from "@/components/Tags/TagAssignmentSheet";

import useFilters from "@/hooks/useFilters";

import query from "@/Utils/request/query";
import {
  ENCOUNTER_CLASS,
  ENCOUNTER_CLASS_ICONS,
  ENCOUNTER_PRIORITY,
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
    cacheBlacklist: [
      "name",
      "encounter_id",
      "external_identifier",
      "tags",
      "patient_filter",
    ],
  });
  const { t } = useTranslation();
  const {
    status,
    encounter_class: encounterClass,
    priority,
    name,
    encounter_id,
    external_identifier,
    patient_filter,
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
      patient_filter: undefined,
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
          patient: patient_filter,
        },
        [key]: value || undefined,
      });
    },
    [
      status,
      encounterClass,
      priority,
      updateQuery,
      qParams.tags,
      patient_filter,
    ],
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
        patient: patient_filter,
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

  const ENCOUNTER_STATUS = [
    "planned",
    "in_progress",
    "discharged",
    "completed",
    "cancelled",
  ] as const;

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
        <div className="rounded-lg border border-gray-200 bg-card shadow-xs flex flex-col overflow-auto">
          <div className="flex flex-col">
            <div className="flex flex-wrap items-center justify-between gap-2 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      data-cy="search-encounter"
                      variant="outline"
                      className={cn(
                        "min-w-32 justify-start text-gray-500 font-normal h-9 sm:w-auto w-full",
                        (name || encounter_id || external_identifier) &&
                          "bg-primary/10 text-primary font-medium hover:bg-primary/20",
                      )}
                    >
                      <CareIcon icon="l-search" className="size-4" />
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

                <PatientIdentifierFilter
                  onSelect={(patientId) =>
                    updateQuery({ patient_filter: patientId })
                  }
                  placeholder={t("filter_by_identifier")}
                  className="w-full sm:w-auto rounded-md h-9 text-gray-500 shadow-sm"
                  patientId={qParams.patient_filter}
                />

                <div className="sm:w-auto w-full">
                  <FilterSelect
                    value={priority || ""}
                    onValueChange={(value) => {
                      updateQuery({
                        status,
                        encounter_class: encounterClass,
                        priority: value as EncounterPriority,
                      });
                    }}
                    options={ENCOUNTER_PRIORITY.map((value) =>
                      t(`encounter_priority__${value}`),
                    )}
                    label={t("priority")}
                    onClear={() => {
                      updateQuery({
                        status,
                        encounter_class: encounterClass,
                        priority: undefined,
                      });
                    }}
                    className="h-9 shadow-sm rounded-md min-w-32"
                  />
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
                  className="mt-0 bg-white font-normal sm:w-auto w-full"
                />

                {/* Status Filter - Mobile */}
                <div className="md:hidden sm:w-auto w-full">
                  <FilterSelect
                    label={t("status")}
                    icon={<CircleDashed className="size-4" />}
                    value={status || ""}
                    onValueChange={(value) => {
                      updateQuery({
                        status: value === "all" ? undefined : value,
                      });
                    }}
                    options={ENCOUNTER_STATUS.map((value) =>
                      t(`encounter_status__${value}`),
                    )}
                    onClear={() => {
                      updateQuery({
                        status: undefined,
                        encounter_class: encounterClass,
                        priority,
                      });
                    }}
                    className="h-9 shadow-sm rounded-md min-w-32"
                  />
                </div>

                {/* Class Filter - Mobile */}
                <div className="md:hidden sm:w-auto w-full">
                  <FilterSelect
                    label={t("type")}
                    icon={<Settings2 className="size-4" />}
                    value={encounterClass || ""}
                    onValueChange={(value) => {
                      updateQuery({
                        encounter_class: value === "all" ? undefined : value,
                      });
                    }}
                    options={ENCOUNTER_CLASS.map((value) =>
                      t(`encounter_class__${value}`),
                    )}
                    onClear={() => {
                      updateQuery({
                        encounter_class: undefined,
                        status,
                        priority,
                      });
                    }}
                    className="h-9 shadow-sm rounded-md min-w-32"
                  />
                </div>
              </div>

              {/* Status Filter - Desktop */}
              <div className="hidden md:flex items-center py-2">
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
                      {ENCOUNTER_STATUS.map((status) => (
                        <TabsTrigger
                          key={status}
                          value={status}
                          className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary px-1 lg:px-2"
                          onClick={() =>
                            updateQuery({
                              ...{ encounter_class: encounterClass, priority },
                              status,
                            })
                          }
                        >
                          {React.createElement(ENCOUNTER_STATUS_ICONS[status], {
                            className: "size-4",
                          })}
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
            <div className="hidden md:block p-4 py-6 lg:py-4">
              <Tabs value={encounterClass || "all"} className="w-full">
                <TabsList className="bg-transparent p-0 h-8">
                  <div className="flex flex-wrap">
                    <TabsTrigger
                      value="all"
                      className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                      onClick={() =>
                        updateQuery({
                          ...{ encounter_class: undefined, priority },
                          status,
                        })
                      }
                    >
                      {t("all_status")}
                    </TabsTrigger>
                    {ENCOUNTER_CLASS.map((value) => (
                      <TabsTrigger
                        key={value}
                        value={value}
                        className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary px-1 lg:px-2"
                        onClick={() =>
                          updateQuery({
                            ...{ encounter_class: value, priority },
                            status,
                          })
                        }
                      >
                        {React.createElement(ENCOUNTER_CLASS_ICONS[value], {
                          className: "size-4",
                        })}
                        {t(`encounter_class__${value}`)}
                      </TabsTrigger>
                    ))}
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
