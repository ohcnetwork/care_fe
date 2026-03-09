import { useQuery } from "@tanstack/react-query";
import { useAtom } from "jotai";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import { encounterListFiltersAtom } from "@/atoms/encounterFilterAtom";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  careTeamFilter,
  dateFilter,
  departmentFilter,
  encounterPriorityFilter,
  encounterStatusFilter,
  tagFilter,
} from "@/components/ui/multi-filter/filterConfigs";
import MultiFilter from "@/components/ui/multi-filter/MultiFilter";
import useMultiFilterState from "@/components/ui/multi-filter/utils/useMultiFilterState";
import {
  FilterDateRange,
  longDateRangeOptions,
} from "@/components/ui/multi-filter/utils/Utils";
import { Separator } from "@/components/ui/separator";

import Page from "@/components/Common/Page";
import SearchInput from "@/components/Common/SearchInput";
import { CardGridSkeleton } from "@/components/Common/SkeletonLoading";
import EncounterInfoCard from "@/components/Encounter/EncounterInfoCard";

import useFilters from "@/hooks/useFilters";

import PatientIdentifierFilter from "@/components/Patient/PatientIdentifierFilter";
import {
  EncounterClass,
  EncounterListRead,
  EncounterRead,
  EncounterStatus,
} from "@/types/emr/encounter/encounter";
import encounterApi from "@/types/emr/encounter/encounterApi";
import { TagConfig, TagResource } from "@/types/emr/tagConfig/tagConfig";
import useTagConfigs from "@/types/emr/tagConfig/useTagConfig";
import { FacilityOrganizationRead } from "@/types/facilityOrganization/facilityOrganization";
import { UserReadMinimal } from "@/types/user/user";
import query from "@/Utils/request/query";
import { dateQueryString, dateTimeQueryString } from "@/Utils/utils";
import careConfig from "@careConfig";
import { subDays } from "date-fns";

interface EncounterListProps {
  encounters?: EncounterListRead[];
  facilityId: string;
  encounterClass?: EncounterClass;
}

const buildQueryParams = (
  facilityId: string,
  status?: string,
  priority?: string,
  created_date_after?: string,
  created_date_before?: string,
  organization?: string,
  care_team_user?: string,
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
  if (priority) {
    params.priority = priority;
  }
  if (created_date_after) {
    // Convert date string to datetime for API call
    params.created_date_after = dateTimeQueryString(
      new Date(created_date_after),
    );
  }
  if (created_date_before) {
    // Convert date string to datetime for API call (end of day)
    params.created_date_before = dateTimeQueryString(
      new Date(created_date_before),
      true,
    );
  }
  if (organization) {
    params.organization = organization;
  }
  if (care_team_user) {
    params.care_team_user = care_team_user;
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
  encounterClass,
}: EncounterListProps) {
  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: 15,
    disableCache: true,
    cacheBlacklist: [
      "name",
      "encounter_id",
      "external_identifier",
      "tags",
      "patient_filter",
    ],
  });
  const { t } = useTranslation();
  const [, setSavedFilters] = useAtom(encounterListFiltersAtom);
  const hasRestoredFilters = useRef(false);
  const hasAppliedDefaultStatus = useRef(false);

  const {
    status,
    priority,
    encounter_id,
    external_identifier,
    patient_filter,
    created_date_after,
    created_date_before,
    organization,
    care_team_user,
  } = qParams;

  const getDefaultDateRange = () => {
    const today = new Date();
    const defaultDays = careConfig.encounterDateFilter;
    return {
      created_date_after: dateQueryString(
        defaultDays === 0 ? today : subDays(today, defaultDays),
      ),
      created_date_before: dateQueryString(today),
    };
  };

  // Restore filters from sessionStorage on mount AND set default dates if needed
  useEffect(() => {
    if (hasRestoredFilters.current) return;
    hasRestoredFilters.current = true;

    const urlParams = new URLSearchParams(window.location.search);
    const restoredParams: Record<string, string | undefined> = {};

    // Restore filters from session storage if no URL filters
    const hasUrlFilters =
      status ||
      priority ||
      organization ||
      care_team_user ||
      qParams.tags ||
      patient_filter;

    if (!hasUrlFilters) {
      try {
        const stored = sessionStorage.getItem("encounter_list_filters");
        if (stored) {
          const filters = JSON.parse(stored);
          if (filters.status) restoredParams.status = filters.status;
          if (filters.priority) restoredParams.priority = filters.priority;
          if (filters.selectedOrg)
            restoredParams.organization = filters.selectedOrg.id;
          if (filters.selectedCareTeamMember)
            restoredParams.care_team_user =
              filters.selectedCareTeamMember.username;
          if (filters.selectedTags?.length > 0)
            restoredParams.tags = filters.selectedTags
              .map((t: TagConfig) => t.id)
              .join(",");
          if (filters.tagsBehavior)
            restoredParams.tags_behavior = filters.tagsBehavior;
          if (filters.dateFrom)
            restoredParams.created_date_after = dateQueryString(
              new Date(filters.dateFrom),
            );
          if (filters.dateTo)
            restoredParams.created_date_before = dateQueryString(
              new Date(filters.dateTo),
            );
        }
      } catch {
        // Ignore parsing errors
      }
    }

    const hasAnyDates =
      urlParams.get("created_date_after") ||
      urlParams.get("created_date_before") ||
      restoredParams.created_date_after ||
      restoredParams.created_date_before;
    const hasPatientFilter = urlParams.get("patient_filter");

    if (!hasAnyDates && !hasPatientFilter && encounterClass !== "imp") {
      Object.assign(restoredParams, getDefaultDateRange());
    }

    if (Object.keys(restoredParams).length > 0) {
      updateQuery(restoredParams);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data: queryEncounters, isFetching } = useQuery({
    queryKey: ["encounters", facilityId, qParams, encounterClass],
    queryFn: query.debounced(encounterApi.list, {
      queryParams: {
        ...buildQueryParams(
          facilityId,
          status,
          priority,
          created_date_after,
          created_date_before,
          organization,
          care_team_user,
        ),
        encounter_class: encounterClass,
        external_identifier,
        limit: resultsPerPage,
        offset: ((qParams.page || 1) - 1) * resultsPerPage,
        tags: qParams.tags,
        tags_behavior: qParams.tags_behavior,
        patient_filter: patient_filter,
        name: qParams.name,
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

  const encounters =
    propEncounters ||
    queryEncounters?.results ||
    (queryEncounter ? [queryEncounter] : []);

  const tagIds = qParams.tags?.split(",") || [];
  const tagQueries = useTagConfigs({ ids: tagIds, facilityId });
  const selectedTags = tagQueries
    .map((query) => query.data)
    .filter(Boolean) as TagConfig[];

  // Fetch organization data if organization ID is in URL params
  const { data: selectedOrg } = useQuery({
    queryKey: ["facilityOrganization", facilityId, organization],
    queryFn: query(
      {
        path: "/api/v1/facility/{facilityId}/organizations/{organizationId}/",
        method: "GET",
        TRes: {} as FacilityOrganizationRead,
      },
      {
        pathParams: { facilityId, organizationId: organization },
      },
    ),
    enabled: !!organization && !!facilityId,
  });

  // Fetch user data if care_team_user (username) is in URL params
  const { data: selectedCareTeamUser } = useQuery({
    queryKey: ["user", care_team_user],
    queryFn: query(
      {
        path: "/api/v1/users/{username}/",
        method: "GET",
        TRes: {} as UserReadMinimal,
      },
      {
        pathParams: { username: care_team_user },
      },
    ),
    enabled: !!care_team_user,
  });

  const filters = [
    encounterStatusFilter("status", "multi"),
    encounterPriorityFilter("priority"),
    departmentFilter("organization"),
    careTeamFilter("care_team"),
    tagFilter("tags", TagResource.ENCOUNTER, "multi", t("tags", { count: 2 })),
    dateFilter("created_date", t("date"), longDateRangeOptions, true),
  ];

  const onFilterUpdate = (filterQuery: Record<string, unknown>) => {
    // Save to sessionStorage atom
    setSavedFilters((prev) => {
      const updates = { ...prev };
      for (const [key, value] of Object.entries(filterQuery)) {
        switch (key) {
          case "status":
            updates.status = Array.isArray(value)
              ? (value as string[]).join(",")
              : (value as string) || undefined;
            break;
          case "priority":
            updates.priority = (value as string) || undefined;
            break;
          case "tags":
            updates.selectedTags = (value as TagConfig[]) ?? [];
            break;
          case "tags_behavior":
            updates.tagsBehavior = (value as string) || "any";
            break;
          case "organization":
            updates.selectedOrg =
              (value as FacilityOrganizationRead) || undefined;
            break;
          case "care_team":
            updates.selectedCareTeamMember =
              (value as UserReadMinimal) || undefined;
            break;
          case "created_date":
            if (
              value &&
              typeof value === "object" &&
              "from" in value &&
              "to" in value
            ) {
              const dateRange = value as FilterDateRange;
              updates.dateFrom = dateRange.from?.toISOString();
              updates.dateTo = dateRange.to?.toISOString();
            } else {
              updates.dateFrom = undefined;
              updates.dateTo = undefined;
            }
            break;
        }
      }
      return updates;
    });

    // Update URL query params
    for (const [key, value] of Object.entries(filterQuery)) {
      switch (key) {
        case "status":
          filterQuery.status = Array.isArray(value)
            ? (value as string[]).join(",")
            : value;
          break;
        case "tags":
          filterQuery.tags = (value as TagConfig[])
            ?.map((tag) => tag.id)
            .join(",");
          break;
        case "tags_behavior":
          // tags_behavior is already handled by the filter system
          break;
        case "organization":
          filterQuery.organization =
            (value as FacilityOrganizationRead)?.id || undefined;
          break;
        case "care_team":
          filterQuery.care_team_user =
            (value as UserReadMinimal)?.username || undefined;
          filterQuery.care_team = undefined;
          break;
        case "created_date":
          {
            const dateRange = value as FilterDateRange;
            filterQuery = {
              ...filterQuery,
              created_date: undefined,
              created_date_after: dateRange?.from
                ? dateQueryString(dateRange?.from as Date)
                : undefined,
              created_date_before: dateRange?.to
                ? dateQueryString(dateRange?.to as Date)
                : undefined,
            };
          }
          break;
      }
    }
    updateQuery(filterQuery);
  };

  const {
    selectedFilters,
    handleFilterChange,
    handleOperationChange,
    handleClearAll,
    handleClearFilter,
  } = useMultiFilterState(filters, onFilterUpdate, {
    ...qParams,
    status: status ? status.split(",") : undefined,
    tags: selectedTags,
    organization: selectedOrg ? [selectedOrg] : undefined,
    care_team: selectedCareTeamUser ? [selectedCareTeamUser] : undefined,
    created_date:
      created_date_after || created_date_before
        ? {
            from: created_date_after ? new Date(created_date_after) : undefined,
            to: created_date_before ? new Date(created_date_before) : undefined,
          }
        : undefined,
  });

  useEffect(() => {
    if (encounterClass === "imp") {
      if (!status && !hasAppliedDefaultStatus.current) {
        hasAppliedDefaultStatus.current = true;
        handleFilterChange("status", [
          EncounterStatus.PLANNED,
          EncounterStatus.IN_PROGRESS,
        ]);
      }
    } else {
      hasAppliedDefaultStatus.current = false;
    }
  }, [encounterClass, status, handleFilterChange]);

  useEffect(() => {
    if (!hasRestoredFilters.current) return;
    if (created_date_after || created_date_before || patient_filter) return;
    if (encounterClass === "imp") return;

    const urlParams = new URLSearchParams(window.location.search);
    if (
      urlParams.get("created_date_after") ||
      urlParams.get("created_date_before")
    ) {
      return;
    }

    updateQuery(getDefaultDateRange());
  }, [
    created_date_after,
    created_date_before,
    patient_filter,
    encounterClass,
    updateQuery,
  ]);

  const displaySelectedFilters =
    (patient_filter || encounterClass === "imp") &&
    !created_date_after &&
    !created_date_before
      ? {
          ...selectedFilters,
          created_date: {
            ...selectedFilters.created_date,
            selected: [],
          },
        }
      : selectedFilters;

  return (
    <Page
      title={t("encounter_class_encounters", {
        encounterClassName: encounterClass
          ? t(`encounter_class__${encounterClass}`)
          : t("all"),
      })}
      componentRight={
        <Badge className="bg-purple-50 text-purple-700 ml-2 rounded-xl px-3 py-0.5 m-3 w-max border-gray-200">
          {isFetching
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
                <SearchInput
                  id="patient-name-search"
                  options={[
                    {
                      key: "name",
                      type: "text",
                      placeholder: t("search_by_patient_name"),
                      value: qParams.name || "",
                      display: t("patient_name"),
                    },
                  ]}
                  className="w-full sm:w-auto sm:min-w-64"
                  onSearch={(key, value) => updateQuery({ [key]: value })}
                />
                <PatientIdentifierFilter
                  onSelect={(patientId, patientName) =>
                    updateQuery({
                      patient_filter: patientId,
                      patient_name: patientName,
                      created_date_after: undefined,
                      created_date_before: undefined,
                    })
                  }
                  placeholder={t("filter_by_identifier")}
                  className="w-full sm:w-auto rounded-md h-9 text-gray-500 shadow-sm"
                  patientId={qParams.patient_filter}
                  patientName={qParams.patient_name}
                />
                <MultiFilter
                  selectedFilters={displaySelectedFilters}
                  onFilterChange={handleFilterChange}
                  onOperationChange={handleOperationChange}
                  onClearAll={handleClearAll}
                  onClearFilter={handleClearFilter}
                  className="flex sm:flex-row flex-wrap sm:items-center"
                  triggerButtonClassName="self-start sm:self-center"
                  clearAllButtonClassName="self-center"
                  facilityId={facilityId}
                />
              </div>
            </div>

            <Separator className="hidden md:block" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {isFetching ? (
            <CardGridSkeleton count={6} />
          ) : encounters.length === 0 ? (
            <div className="col-span-full">
              <EmptyState />
            </div>
          ) : (
            <>
              {encounters.map(
                (encounter: EncounterListRead | EncounterRead) => (
                  <EncounterInfoCard
                    key={encounter.id}
                    encounter={encounter}
                    facilityId={facilityId}
                  />
                ),
              )}
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
