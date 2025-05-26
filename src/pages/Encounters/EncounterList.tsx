import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import CareIcon, { IconName } from "@/CAREUI/icons/CareIcon";

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

import useFilters from "@/hooks/useFilters";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import { PaginatedResponse } from "@/Utils/request/types";
import {
  ENCOUNTER_CLASSES,
  ENCOUNTER_PRIORITIES,
  ENCOUNTER_STATUSES,
  Encounter,
  EncounterPriority,
} from "@/types/emr/encounter";

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
  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: 15,
    cacheBlacklist: ["name", "encounter_id", "external_identifier"],
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
      type: "text" as const,
      placeholder: t("search_by_patient_name"),
      value: name || "",
    },
    {
      key: "encounter_id",
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
                    {ENCOUNTER_PRIORITIES.map((priority) => (
                      <SelectItem key={priority.id} value={priority.id}>
                        <div className="flex items-center">
                          <span className="mr-2">{priority.emote}</span>
                          {t(`encounter_priority__${priority.id}`)}
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
                      {ENCOUNTER_STATUSES.filter(
                        (status) => "icon" in status,
                      ).map((status: { id: string; icon: IconName }) => (
                        <SelectItem value={status.id} key={status.id}>
                          <div className="flex items-center">
                            <CareIcon
                              icon={status.icon as IconName}
                              className="mr-2 size-4"
                            />
                            {t(`encounter_status__${status.id}`)}
                          </div>
                        </SelectItem>
                      ))}
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
                      {ENCOUNTER_CLASSES.map((cls) => {
                        return (
                          <SelectItem value={cls.id} key={cls.id}>
                            <div className="flex items-center">
                              <CareIcon
                                icon={cls.icon}
                                className="mr-2 size-4"
                              />
                              {t(`encounter_class__${cls.id}`)}
                            </div>
                          </SelectItem>
                        );
                      })}
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

                      {ENCOUNTER_STATUSES.filter(
                        (status) => "icon" in status,
                      ).map((status) => (
                        <TabsTrigger
                          key={status.id}
                          value={status.id}
                          data-cy={`${status.id}-filter`}
                          className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                          onClick={() =>
                            updateQuery({
                              encounter_class: encounterClass,
                              priority,
                              status: status.id,
                            })
                          }
                        >
                          <CareIcon
                            icon={status.icon as IconName}
                            className="size-4"
                          />
                          {t(`encounter_status__${status.id}`)}
                        </TabsTrigger>
                      ))}
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
                    {ENCOUNTER_CLASSES.map((cls) => (
                      <TabsTrigger
                        key={cls.id}
                        value={cls.id}
                        className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                        onClick={() =>
                          updateQuery({
                            status,
                            priority,
                            encounter_class: cls.id,
                          })
                        }
                      >
                        <CareIcon icon={cls.icon} className="size-4 mr-1" />
                        {t(`encounter_class__${cls.id}`)}
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
