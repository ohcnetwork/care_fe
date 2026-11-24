import { useQuery } from "@tanstack/react-query";
import { useAtom } from "jotai";
import { Check, Search } from "lucide-react";
import { KeyboardEvent, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  encounterFilterStorageKey,
  encounterListFiltersAtom,
} from "@/atoms/encounterFilterAtom";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { DateFilterButton } from "@/components/ui/multi-filter/dateFilter";
import {
  careTeamFilter,
  dateFilter,
  departmentFilter,
  encounterClassFilter,
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
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import useAuthUser from "@/hooks/useAuthUser";

import Page from "@/components/Common/Page";
import { CardGridSkeleton } from "@/components/Common/SkeletonLoading";
import EncounterInfoCard from "@/components/Encounter/EncounterInfoCard";

import useFilters from "@/hooks/useFilters";
import { encounterListSearch } from "@/lib/router/search/encounter";

import PatientIdentifierFilter from "@/components/Patient/PatientIdentifierFilter";
import {
  EmptyStateAction,
  EncounterListEmptyState,
} from "@/pages/Encounters/encounter-search/EncounterListEmptyState";
import {
  EncounterSearch,
  SelectedPatient,
  VisitField,
} from "@/pages/Encounters/encounter-search/EncounterSearch";
import { EncounterSearchChips } from "@/pages/Encounters/encounter-search/EncounterSearchChips";
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
import {
  dateQueryString,
  dateTimeQueryString,
  parseLocalDate,
} from "@/Utils/utils";
import careConfig from "@careConfig";
import { subDays } from "date-fns";

interface EncounterListProps {
  encounters?: EncounterListRead[];
  facilityId: string;
  encounterClass?: EncounterClass;
}

const SEARCH_WITH_NAME = "name" as const;
const SEARCH_WITH_EXTERNAL_IDENTIFIER = "external_identifier" as const;

type SearchWith =
  typeof SEARCH_WITH_NAME | typeof SEARCH_WITH_EXTERNAL_IDENTIFIER;

// URL calendar dates are local days; timestamps retain their explicit offset.
const parseDateFilterValue = (value: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) ? parseLocalDate(value) : new Date(value);

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
      parseDateFilterValue(created_date_after),
    );
  }
  if (created_date_before) {
    // Convert date string to datetime for API call (end of day)
    params.created_date_before = dateTimeQueryString(
      parseDateFilterValue(created_date_before),
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
    schema: encounterListSearch,
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
  const user = useAuthUser();
  const filterScope = `${user.id}:${facilityId}`;
  const storageKey = encounterFilterStorageKey("list", filterScope);
  const [, setSavedFilters] = useAtom(encounterListFiltersAtom(filterScope));
  const hasRestoredFilters = useRef<string | null>(null);
  const hasAppliedDefaultStatus = useRef(false);
  const [searchWith, setSearchWith] = useState<SearchWith>(
    qParams.external_identifier
      ? SEARCH_WITH_EXTERNAL_IDENTIFIER
      : SEARCH_WITH_NAME,
  );
  const [searchText, setSearchText] = useState(
    qParams.external_identifier || qParams.name || "",
  );
  const [searchOptionsOpen, setSearchOptionsOpen] = useState(false);
  const [activeSearchOptionIndex, setActiveSearchOptionIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const {
    status,
    priority,
    encounter_id,
    patient_filter,
    created_date_after,
    created_date_before,
    organization,
    care_team_user,
  } = qParams;

  // Class-specific lists fix the class in the route, so only the All list
  // filters by, saves and restores an encounter class. A stray
  // ?encounter_class= on a class-specific list is ignored.
  const filtersByEncounterClass = !encounterClass;
  // Only the All list has the combined search; class lists keep theirs.
  const isAllList = !encounterClass;
  const [dateNotice, setDateNotice] = useState<{
    patientId: string;
    snapshot: Record<string, string | undefined>;
  } | null>(null);

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

  const searchWithOptions = [
    {
      key: SEARCH_WITH_NAME,
      label: t("patient_name"),
      placeholder: t("search_by_patient_name"),
    },
    {
      key: SEARCH_WITH_EXTERNAL_IDENTIFIER,
      label: t("external_identifier"),
      placeholder: t("search_by_external_id"),
    },
  ];

  useEffect(() => {
    if (qParams.external_identifier) {
      setSearchWith(SEARCH_WITH_EXTERNAL_IDENTIFIER);
      setSearchText(qParams.external_identifier);
    } else if (qParams.name) {
      setSearchWith(SEARCH_WITH_NAME);
      setSearchText(qParams.name);
    } else {
      setSearchText("");
    }
  }, [qParams.name, qParams.external_identifier]);

  const selectedSearchType =
    searchWithOptions.find((option) => option.key === searchWith) ||
    searchWithOptions[0];
  const showSearchOptions = searchText.trim() !== "";

  const searchQueryParams =
    searchWith === SEARCH_WITH_NAME
      ? { name: searchText || undefined, external_identifier: undefined }
      : { name: undefined, external_identifier: searchText || undefined };

  const updateSearchQuery = (
    nextSearchWith: SearchWith,
    nextSearchText: string,
  ) => {
    if (nextSearchWith === SEARCH_WITH_NAME) {
      updateQuery({
        name: nextSearchText,
        external_identifier: "",
      });
    } else {
      updateQuery({
        name: "",
        external_identifier: nextSearchText,
      });
    }
  };

  const handleSearchWithChange = (nextSearchWith: SearchWith) => {
    setSearchWith(nextSearchWith);
    updateSearchQuery(nextSearchWith, searchText);
    setSearchOptionsOpen(false);
    searchInputRef.current?.focus();
  };

  const handleSearchInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !searchOptionsOpen) {
      event.preventDefault();
      updateSearchQuery(searchWith, searchText);
      return;
    }

    if (!showSearchOptions) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSearchOptionsOpen(true);
      setActiveSearchOptionIndex((prev) =>
        prev < searchWithOptions.length - 1 ? prev + 1 : prev,
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveSearchOptionIndex((prev) => (prev > 0 ? prev - 1 : prev));
      return;
    }

    if (event.key === "Enter" && searchOptionsOpen) {
      event.preventDefault();
      handleSearchWithChange(
        searchWithOptions[activeSearchOptionIndex]?.key || SEARCH_WITH_NAME,
      );
      return;
    }

    // Dismiss suggestions before the browser moves focus to the next toolbar control.
    if (event.key === "Tab" || event.key === "Escape") {
      setSearchOptionsOpen(false);
    }
  };

  // Restore filters from sessionStorage on mount AND set default dates if needed
  useEffect(() => {
    if (hasRestoredFilters.current === storageKey) return;
    hasRestoredFilters.current = storageKey;

    const urlParams = new URLSearchParams(window.location.search);
    const restoredParams: Record<string, string | undefined> = {};

    // Restore filters from session storage if no URL filters
    const hasUrlFilters =
      status ||
      priority ||
      (filtersByEncounterClass && qParams.encounter_class) ||
      organization ||
      care_team_user ||
      qParams.tags ||
      patient_filter;

    if (!hasUrlFilters) {
      try {
        const stored = sessionStorage.getItem(storageKey);
        if (stored) {
          const filters = JSON.parse(stored);
          if (filters.status) restoredParams.status = filters.status;
          if (filters.priority) restoredParams.priority = filters.priority;
          if (filtersByEncounterClass && filters.encounterClass)
            restoredParams.encounter_class = filters.encounterClass;
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
  }, [storageKey]);

  // The list's filters without its search text; the All search previews its
  // visit counts with the same ones.
  const listFilterParams = {
    ...buildQueryParams(
      facilityId,
      status,
      priority,
      created_date_after,
      created_date_before,
      organization,
      care_team_user,
    ),
    encounter_class: filtersByEncounterClass
      ? qParams.encounter_class
      : encounterClass,
    tags: qParams.tags,
    tags_behavior: qParams.tags_behavior,
    patient_filter: patient_filter,
  };
  // The All list reads only what the URL applies, never the unsubmitted draft.
  const listSearch = isAllList
    ? { name: qParams.name, external_identifier: qParams.external_identifier }
    : searchQueryParams;

  const { data: queryEncounters, isFetching } = useQuery({
    queryKey: ["encounters", facilityId, qParams, encounterClass],
    queryFn: query.debounced(encounterApi.list, {
      queryParams: {
        ...listFilterParams,
        external_identifier: listSearch.external_identifier,
        limit: resultsPerPage,
        offset: ((qParams.page || 1) - 1) * resultsPerPage,
        name: listSearch.name,
      },
    }),
    enabled: !propEncounters && !encounter_id,
  });

  const { data: queryEncounter } = useQuery({
    queryKey: ["encounter", encounter_id],
    queryFn: query(encounterApi.get, {
      pathParams: { id: encounter_id ?? "" },
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
  // A pending detail lookup is not an empty selection: keep the open tag picker mounted.
  const selectedTags = tagQueries.some((query) => query.isPending)
    ? undefined
    : tagQueries.flatMap((query) => (query.data ? [query.data] : []));

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
    ...(filtersByEncounterClass
      ? [encounterClassFilter("encounter_class")]
      : []),
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
          case "encounter_class":
            updates.encounterClass = (value as string) || undefined;
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
    handleClearFilters,
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
            from: created_date_after
              ? parseDateFilterValue(created_date_after)
              : undefined,
            to: created_date_before
              ? parseDateFilterValue(created_date_before)
              : undefined,
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

  const applySearchText = (field: VisitField, term: string) =>
    updateQuery(
      field === "name"
        ? { name: term, external_identifier: "" }
        : { name: "", external_identifier: term },
    );
  const removeSearchText = () =>
    updateQuery({ name: "", external_identifier: "" });

  // Selecting a patient clears the dates, as before. Undo restores the
  // previous patient and dates; the history is replaced, so Back can't.
  const selectPatient = (patient: SelectedPatient) => {
    const datesCleared = !!(created_date_after || created_date_before);
    updateQuery({
      patient_filter: patient.id,
      patient_name: patient.name,
      created_date_after: undefined,
      created_date_before: undefined,
    });
    setDateNotice(
      datesCleared
        ? {
            patientId: patient.id,
            snapshot: {
              patient_filter,
              patient_name: qParams.patient_name,
              created_date_after,
              created_date_before,
            },
          }
        : null,
    );
  };
  // Removing the patient isn't Undo: the default dates resume.
  const removePatient = () => {
    updateQuery({ patient_filter: undefined, patient_name: undefined });
    setDateNotice(null);
  };
  const showDateNotice =
    !!dateNotice &&
    dateNotice.patientId === patient_filter &&
    !created_date_after &&
    !created_date_before;
  const scannedPatient =
    qParams.patient_name === t("scanned_patient") ||
    qParams.patient_name === t("encounter_search_scanned_patient");

  const { created_date: dateState, ...toolbarFilters } = selectedFilters;
  // One button per applied filter, from the URL alone. The date range can
  // only be lifted for a patient; otherwise the default dates return.
  const emptyStateActions: EmptyStateAction[] = [
    ...(patient_filter && (created_date_after || created_date_before)
      ? [
          {
            key: "dates",
            label: t("encounter_list_empty_any_date"),
            onClick: () =>
              updateQuery({
                created_date_after: undefined,
                created_date_before: undefined,
              }),
          },
        ]
      : []),
    ...Object.entries(toolbarFilters).flatMap(([key, state]) =>
      Array.isArray(state.selected) && state.selected.length
        ? [
            {
              key,
              label: t("encounter_list_empty_remove_filter", {
                filter: t(state.filter.label),
              }),
              onClick: () => handleClearFilter(key),
            },
          ]
        : [],
    ),
    ...(qParams.name
      ? [
          {
            key: "name",
            label: t("encounter_search_remove_name_filter"),
            onClick: removeSearchText,
          },
        ]
      : []),
    ...(qParams.external_identifier
      ? [
          {
            key: "visit",
            label: t("encounter_search_remove_visit_id_filter"),
            onClick: removeSearchText,
          },
        ]
      : []),
    ...(patient_filter
      ? [
          {
            key: "patient",
            label: t("encounter_search_remove_patient"),
            onClick: removePatient,
          },
        ]
      : []),
  ];

  const dateRange =
    Array.isArray(dateState.selected) ||
    ((patient_filter || encounterClass === "imp") &&
      !created_date_after &&
      !created_date_before)
      ? {}
      : dateState.selected;

  return (
    <Page
      title={t("encounter_class_encounters", {
        encounterClassName: encounterClass
          ? t(`encounter_class__${encounterClass}`)
          : t("all"),
      })}
      componentRight={
        <Badge variant="neutral" className="ml-2 w-max">
          {isFetching
            ? t("loading")
            : t("entity_count", {
                count: queryEncounters?.count ?? 0,
                entity: "Encounter",
              })}
        </Badge>
      }
    >
      <div className="@container/toolbar space-y-4 mt-4 flex flex-col">
        <div className="flex w-full min-w-0 flex-wrap items-center gap-2 @4xl/toolbar:flex-nowrap">
          <div className="flex w-full min-w-0 items-center gap-2 @4xl/toolbar:w-auto">
            {isAllList ? (
              <EncounterSearch
                className="w-full @4xl/toolbar:w-[32rem]"
                previewQueryParams={listFilterParams}
                onApplyText={applySearchText}
                onSelectPatient={selectPatient}
              />
            ) : (
              <>
                <div className="relative min-w-24 flex-1 @4xl/toolbar:w-60 @4xl/toolbar:flex-none">
                  <Popover
                    open={searchOptionsOpen && showSearchOptions}
                    onOpenChange={setSearchOptionsOpen}
                  >
                    <PopoverAnchor asChild>
                      <InputGroup>
                        <InputGroupInput
                          ref={searchInputRef}
                          value={searchText}
                          onChange={(event) => {
                            const value = event.target.value;
                            setSearchText(value);
                            setSearchOptionsOpen(value.trim() !== "");
                            setActiveSearchOptionIndex(0);
                          }}
                          onFocus={() => {
                            if (showSearchOptions) {
                              setSearchOptionsOpen(true);
                            }
                          }}
                          onKeyDown={handleSearchInputKeyDown}
                          placeholder={selectedSearchType.placeholder}
                        />
                        <InputGroupAddon>
                          <Search aria-hidden="true" />
                        </InputGroupAddon>
                      </InputGroup>
                    </PopoverAnchor>
                    <PopoverContent
                      className="w-(--anchor-width) p-0"
                      align="start"
                      onOpenAutoFocus={(event) => {
                        event.preventDefault();
                        searchInputRef.current?.focus();
                      }}
                      onCloseAutoFocus={(event) => {
                        event.preventDefault();
                      }}
                    >
                      <Command>
                        <CommandList>
                          <CommandGroup>
                            {searchWithOptions.map((option, index) => (
                              <CommandItem
                                key={option.key}
                                value={option.key}
                                onSelect={() =>
                                  handleSearchWithChange(option.key)
                                }
                                className={`flex items-center gap-2 ${
                                  activeSearchOptionIndex === index
                                    ? "bg-accent"
                                    : ""
                                }`}
                                onMouseEnter={() =>
                                  setActiveSearchOptionIndex(index)
                                }
                              >
                                <div>
                                  {searchText}{" "}
                                  <span className="text-muted-foreground">
                                    {option.label}
                                  </span>
                                </div>
                                <Check
                                  className={`ml-auto size-4 ${
                                    option.key === searchWith
                                      ? "opacity-100"
                                      : "opacity-0"
                                  }`}
                                />
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
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
                  size="default"
                  className="w-auto min-w-0 flex-1 @4xl/toolbar:flex-none [&>[data-variant]]:shadow-2xs"
                  scanLabelClassName="hidden @lg/toolbar:block"
                  patientId={qParams.patient_filter}
                  patientName={qParams.patient_name}
                />
              </>
            )}
          </div>
          {/* On mobile the filters and Date share their row equally. Both
              halves are unpadded wrappers, so flex-basis 0 splits it evenly. */}
          <div className="shrink-0 max-md:min-w-0 max-md:flex-1 max-md:basis-0">
            <MultiFilter
              compact
              className="max-md:w-full"
              selectedFilters={toolbarFilters}
              onFilterChange={handleFilterChange}
              onOperationChange={handleOperationChange}
              onClearAll={() => handleClearFilters(Object.keys(toolbarFilters))}
              onClearFilter={handleClearFilter}
              facilityId={facilityId}
            />
          </div>
          <div className="ml-auto shrink-0 max-md:min-w-0 max-md:flex-1 max-md:basis-0">
            <DateFilterButton
              filter={dateState.filter}
              selected={dateRange}
              onFilterChange={handleFilterChange}
              className="max-md:w-full max-md:max-w-none max-md:justify-start"
            />
          </div>
        </div>

        {isAllList && (
          <EncounterSearchChips
            name={qParams.name}
            visitId={qParams.external_identifier}
            patient={
              patient_filter
                ? { name: qParams.patient_name, scanned: scannedPatient }
                : undefined
            }
            onRemoveText={removeSearchText}
            onRemovePatient={removePatient}
            datesCleared={showDateNotice}
            onUndo={() => {
              if (dateNotice) updateQuery(dateNotice.snapshot);
              setDateNotice(null);
            }}
            onDismissNotice={() => setDateNotice(null)}
          />
        )}

        <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {isFetching ? (
            <CardGridSkeleton count={6} />
          ) : encounters.length === 0 ? (
            <div className="col-span-full">
              {isAllList ? (
                <EncounterListEmptyState actions={emptyStateActions} />
              ) : (
                <EmptyState />
              )}
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
