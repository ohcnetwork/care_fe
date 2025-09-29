import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowUpRightSquare } from "lucide-react";
import { navigate } from "raviger";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterTabs } from "@/components/ui/filter-tabs";

import Page from "@/components/Common/Page";
import { TableSkeleton } from "@/components/Common/SkeletonLoading";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/Common/Table";

import useFilters from "@/hooks/useFilters";

import PatientIdentifierFilter from "@/components/Patient/PatientIdentifierFilter";
import TagAssignmentSheet from "@/components/Tags/TagAssignmentSheet";
import { tagFilter } from "@/components/ui/multi-filter/filterConfigs";
import MultiFilter from "@/components/ui/multi-filter/MultiFilter";
import useMultiFilterState from "@/components/ui/multi-filter/utils/useMultiFilterState";
import { createFilterConfig } from "@/components/ui/multi-filter/utils/Utils";
import useBreakpoints from "@/hooks/useBreakpoints";
import {
  ENCOUNTER_CLASS_ICONS,
  ENCOUNTER_CLASSES_COLORS,
  EncounterClass,
} from "@/types/emr/encounter/encounter";
import {
  PRESCRIPTION_STATUS_STYLES,
  PrescriptionStatus,
  PrescriptionSummary,
} from "@/types/emr/prescription/prescription";
import prescriptionApi from "@/types/emr/prescription/prescriptionApi";
import {
  getTagHierarchyDisplay,
  TagConfig,
  TagResource,
} from "@/types/emr/tagConfig/tagConfig";
import useTagConfigs from "@/types/emr/tagConfig/useTagConfig";
import query from "@/Utils/request/query";
import { PaginatedResponse } from "@/Utils/request/types";
import { formatDateTime, formatName } from "@/Utils/utils";

export default function MedicationRequestList({
  facilityId,
  locationId,
}: {
  facilityId: string;
  locationId: string;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: 14,
    disableCache: true,
  });
  const tagIds = qParams.tags?.split(",") || [];
  const tagQueries = useTagConfigs({ ids: tagIds, facilityId });
  const selectedTags = tagQueries
    .map((query) => query.data)
    .filter(Boolean) as TagConfig[];

  // State for visible tabs and dropdown items
  const [visibleTabs] = useState<EncounterClass[]>(["imp", "amb", "emer"]);
  const [dropdownItems] = useState<EncounterClass[]>(["obsenc", "vr", "hh"]);

  // Create filter configurations
  const filters = useMemo(
    () => [
      tagFilter("tags", TagResource.PRESCRIPTION, "multi", "tags"),
      createFilterConfig(
        "status",
        t("status"),
        "command",
        Object.values(PrescriptionStatus).map((status) => ({
          value: status,
          label: t(`prescription_status__${status}`),
          color: PRESCRIPTION_STATUS_STYLES[status],
        })),
      ),
    ],
    [t],
  );

  // Handle filter updates
  const onFilterUpdate = (query: Record<string, unknown>) => {
    // Update the query parameters based on filter changes
    for (const [key, value] of Object.entries(query)) {
      switch (key) {
        case "tags":
          query.tags = (value as TagConfig[])?.map((tag) => tag.id);
          break;
      }
    }
    updateQuery(query);
  };

  // Use the multi-filter state hook
  const {
    selectedFilters,
    handleFilterChange,
    handleOperationChange,
    handleClearAll,
    handleClearFilter,
  } = useMultiFilterState(filters, onFilterUpdate, {
    ...qParams,
    tags: selectedTags,
  });

  // Handle tab selection
  const handleTabSelect = (value: string) =>
    updateQuery({ encounter_class: value === "" ? undefined : value });

  // Handle dropdown item selection

  const { data: prescriptionQueue, isLoading } = useQuery<
    PaginatedResponse<PrescriptionSummary>
  >({
    queryKey: ["prescriptionQueue", facilityId, qParams],
    queryFn: query.debounced(prescriptionApi.summary, {
      pathParams: { facilityId },
      queryParams: {
        patient: qParams.search,
        status: qParams.status || "active",
        patient_external_id: qParams.patient_external_id,
        encounter_class: qParams.encounter_class,
        tags: qParams.tags,
        tags_behavior: qParams.tags_behavior,
        limit: resultsPerPage,
        offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
      },
    }),
  });

  // Encounter class tab options with icons
  const encounterClassTabOptions = [
    ...visibleTabs.map((key) => ({
      value: key,
      label: `encounter_class__${key}`,
      icon: React.createElement(ENCOUNTER_CLASS_ICONS[key as EncounterClass], {
        className: "size-4",
      }),
    })),
    ...dropdownItems.map((key) => ({
      value: key,
      label: `encounter_class__${key}`,
      icon: React.createElement(ENCOUNTER_CLASS_ICONS[key as EncounterClass], {
        className: "size-4",
      }),
    })),
  ];

  const maxVisibleTabs = useBreakpoints({
    default: 2,
    xs: 3,
    sm: 4,
    md: 5,
    lg: 7,
  });

  return (
    <Page title={t("prescription_queue")}>
      {/* Priority tabs with original styling */}
      <div className="mb-4 pt-6">
        <FilterTabs
          value={qParams.status || PrescriptionStatus.active}
          onValueChange={(value) => updateQuery({ status: value })}
          options={[
            PrescriptionStatus.active,
            PrescriptionStatus.completed,
            PrescriptionStatus.cancelled,
          ]}
          variant="underline"
          defaultVisibleOptions={[
            PrescriptionStatus.active,
            PrescriptionStatus.completed,
            PrescriptionStatus.cancelled,
          ]}
          showAllOption={false}
          allOptionLabel="all_prescriptions"
          className="w-full justify-evenly sm:justify-start border-b rounded-none bg-transparent h-auto"
        />
      </div>
      {/* Category tabs and search */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center justify-between lg:gap-6 mb-2">
        <div className="flex flex-wrap gap-2">
          {/* Encounter Class Tabs with icons */}
          <FilterTabs
            value={qParams.encounter_class || ""}
            defaultVisibleOptions={visibleTabs}
            showAllOption
            allOptionLabel="all_prescriptions"
            onValueChange={handleTabSelect}
            options={encounterClassTabOptions}
            variant="background"
            showMoreDropdown
            maxVisibleTabs={maxVisibleTabs}
            className="overflow-y-auto text-gray-950"
          />
        </div>
        <div className="flex items-center gap-2">
          <PatientIdentifierFilter
            onSelect={(patientId) =>
              updateQuery({ patient_external_id: patientId })
            }
            placeholder={t("filter_by_identifier")}
            className="w-full sm:w-auto rounded-md h-9 text-gray-500 shadow-sm"
            patientId={qParams.patient_external_id}
          />
        </div>
      </div>
      <MultiFilter
        selectedFilters={selectedFilters}
        onFilterChange={handleFilterChange}
        onOperationChange={handleOperationChange}
        onClearAll={handleClearAll}
        onClearFilter={handleClearFilter}
        placeholder={t("filters")}
        className="flex sm:flex-row flex-wrap sm:items-center mb-4"
        triggerButtonClassName="self-start sm:self-center"
        clearAllButtonClassName="self-center"
        facilityId={facilityId}
      />
      {/* Table section */}
      <div>
        {isLoading ? (
          <TableSkeleton count={5} />
        ) : prescriptionQueue?.results?.length === 0 ? (
          <EmptyState
            icon="l-prescription-bottle"
            title={t("no_prescriptions_found")}
            description={t("no_prescriptions_found_description")}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("patient_name")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead>{t("by")}</TableHead>
                <TableHead>{t("tags", { count: 2 })}</TableHead>
                <TableHead>{t("action")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prescriptionQueue?.results?.map((item: PrescriptionSummary) => (
                <TableRow key={item.id}>
                  <TableCell className="font-semibold">
                    {item.encounter.patient.name}
                    <div className="text-xs text-gray-500">
                      {t("by")}: {formatName(item.prescribed_by)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {t("at")}: {formatDateTime(item.created_date)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={PRESCRIPTION_STATUS_STYLES[item.status]}>
                      {t(`prescription_status__${item.status}`)}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-sm">
                    <div>
                      <Badge
                        size="sm"
                        variant={
                          ENCOUNTER_CLASSES_COLORS[
                            item.encounter.encounter_class
                          ]
                        }
                      >
                        {t(
                          `encounter_class__${item.encounter.encounter_class}`,
                        )}
                      </Badge>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <TagAssignmentSheet
                        entityType="prescription"
                        entityId={item.id}
                        facilityId={facilityId}
                        currentTags={item.tags || []}
                        onUpdate={() => {
                          queryClient.invalidateQueries({
                            queryKey: [
                              "prescriptionQueue",
                              facilityId,
                              qParams,
                            ],
                          });
                        }}
                        patientId={item.encounter.patient.id}
                      />
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {item.tags.map((tag) => (
                            <Badge
                              key={tag.id}
                              variant="outline"
                              size="sm"
                              className="text-xs"
                            >
                              {getTagHierarchyDisplay(tag)}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      className="font-semibold"
                      onClick={() => {
                        navigate(
                          `/facility/${facilityId}/locations/${locationId}/medication_requests/patient/${item.encounter.patient.id}/prescription/${item.id}`,
                        );
                      }}
                    >
                      <ArrowUpRightSquare strokeWidth={1.5} />
                      {t("see_prescription")}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
      <div className="mt-8 flex justify-center">
        <Pagination totalCount={prescriptionQueue?.count || 0} />
      </div>
    </Page>
  );
}
