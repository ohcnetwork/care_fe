import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  dateFilter,
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
import { CardGridSkeleton } from "@/components/Common/SkeletonLoading";
import EncounterInfoCard from "@/components/Encounter/EncounterInfoCard";

import useFilters from "@/hooks/useFilters";

import PatientIdentifierFilter from "@/components/Patient/PatientIdentifierFilter";
import { EncounterClass, EncounterRead } from "@/types/emr/encounter/encounter";
import encounterApi from "@/types/emr/encounter/encounterApi";
import { TagConfig, TagResource } from "@/types/emr/tagConfig/tagConfig";
import useTagConfigs from "@/types/emr/tagConfig/useTagConfig";
import query from "@/Utils/request/query";
import { dateQueryString, dateTimeQueryString } from "@/Utils/utils";
import careConfig from "@careConfig";
import { subDays } from "date-fns";

interface EncounterListProps {
  encounters?: EncounterRead[];
  facilityId: string;
  encounterClass?: EncounterClass;
}

const buildQueryParams = (
  facilityId: string,
  status?: string,
  priority?: string,
  created_date_after?: string,
  created_date_before?: string,
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
    priority,
    name,
    encounter_id,
    external_identifier,
    patient_filter,
    created_date_after,
    created_date_before,
  } = qParams;

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
        ),
        name,
        encounter_class: encounterClass,
        external_identifier,
        limit: resultsPerPage,
        offset: ((qParams.page || 1) - 1) * resultsPerPage,
        tags: qParams.tags,
        tags_behavior: qParams.tags_behavior,
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

  const encounters =
    propEncounters ||
    queryEncounters?.results ||
    (queryEncounter ? [queryEncounter] : []);

  const tagIds = qParams.tags?.split(",") || [];
  const tagQueries = useTagConfigs({ ids: tagIds, facilityId });
  const selectedTags = tagQueries
    .map((query) => query.data)
    .filter(Boolean) as TagConfig[];

  useEffect(() => {
    // Set default date range if no dates are present
    if (!created_date_after && !created_date_before) {
      const today = new Date();
      const defaultDays = careConfig.encounterDateFilter;
      if (defaultDays === 0) {
        // Today only
        updateQuery({
          created_date_after: dateQueryString(today),
          created_date_before: dateQueryString(today),
        });
      } else {
        updateQuery({
          created_date_after: dateQueryString(subDays(today, defaultDays)),
          created_date_before: dateQueryString(today),
        });
      }
    }
  }, [created_date_after, created_date_before, updateQuery]);

  const filters = [
    encounterStatusFilter("status"),
    encounterPriorityFilter("priority"),
    tagFilter("tags", TagResource.ENCOUNTER, "multi", t("tags", { count: 2 })),
    dateFilter("created_date", t("date"), longDateRangeOptions),
  ];

  const onFilterUpdate = (query: Record<string, unknown>) => {
    for (const [key, value] of Object.entries(query)) {
      switch (key) {
        case "tags":
          query.tags = (value as TagConfig[])?.map((tag) => tag.id).join(",");
          break;
        case "tags_behavior":
          // tags_behavior is already handled by the filter system
          break;
        case "created_date":
          {
            const dateRange = value as FilterDateRange;
            query = {
              ...query,
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
    updateQuery(query);
  };

  const {
    selectedFilters,
    handleFilterChange,
    handleOperationChange,
    handleClearAll,
    handleClearFilter,
  } = useMultiFilterState(filters, onFilterUpdate, {
    ...qParams,
    tags: selectedTags,
    created_date:
      created_date_after || created_date_before
        ? {
            from: created_date_after ? new Date(created_date_after) : undefined,
            to: created_date_before ? new Date(created_date_before) : undefined,
          }
        : undefined,
  });

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
                <PatientIdentifierFilter
                  onSelect={(patientId) =>
                    updateQuery({ patient_filter: patientId })
                  }
                  placeholder={t("filter_by_identifier")}
                  className="w-full sm:w-auto rounded-md h-9 text-gray-500 shadow-sm"
                  patientId={qParams.patient_filter}
                />
                <MultiFilter
                  selectedFilters={selectedFilters}
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

        <div
          className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3"
          data-cy="encounter-list-cards"
        >
          {isFetching ? (
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
