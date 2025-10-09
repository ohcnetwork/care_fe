import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowUpRightSquare, ChevronDown, NotepadText } from "lucide-react";
import { navigate } from "raviger";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

import CareIcon from "@/CAREUI/icons/CareIcon";
import PatientIdentifierFilter from "@/components/Patient/PatientIdentifierFilter";
import TagAssignmentSheet from "@/components/Tags/TagAssignmentSheet";
import { tagFilter } from "@/components/ui/multi-filter/filterConfigs";
import MultiFilter from "@/components/ui/multi-filter/MultiFilter";
import useMultiFilterState from "@/components/ui/multi-filter/utils/useMultiFilterState";
import { createFilterConfig } from "@/components/ui/multi-filter/utils/Utils";
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
  const [visibleTabs, setVisibleTabs] = useState<("all" | EncounterClass)[]>([
    "all",
    "imp",
    "amb",
    "emer",
  ]);
  const [dropdownItems, setDropdownItems] = useState<EncounterClass[]>([
    "obsenc",
    "vr",
    "hh",
  ]);

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
  const handleTabSelect = (value: string) => {
    updateQuery({
      encounter_class: value === "all" ? undefined : value,
    });
  };

  // Handle dropdown item selection
  const handleDropdownSelect = (value: EncounterClass) => {
    // Swap the selected dropdown item with the last visible tab
    const lastVisibleTab = visibleTabs[visibleTabs.length - 1];
    const newVisibleTabs = [...visibleTabs.slice(0, -1), value];
    const newDropdownItems = [
      ...dropdownItems.filter((item) => item !== value),
      lastVisibleTab as EncounterClass,
    ];

    setVisibleTabs(newVisibleTabs);
    setDropdownItems(newDropdownItems);
    handleTabSelect(value);
  };

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

  return (
    <Page title={t("prescription_queue")}>
      {/* Priority tabs with original styling */}
      <div className="mb-4 pt-6">
        <Tabs
          value={qParams.status || "active"}
          onValueChange={(value) => updateQuery({ status: value })}
          className="w-full"
        >
          <TabsList className="w-full justify-evenly sm:justify-start border-b rounded-none bg-transparent p-0 h-auto overflow-x-auto">
            {[
              PrescriptionStatus.active,
              PrescriptionStatus.completed,
              PrescriptionStatus.cancelled,
            ].map((key) => (
              <TabsTrigger
                key={key}
                value={key}
                className="border-b-2 px-2 sm:px-4 py-2 text-gray-600 hover:text-gray-900 data-[state=active]:border-b-primary-700  data-[state=active]:text-primary-800 data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none"
              >
                {t(`prescription_status__${key}`)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
      {/* Category tabs and search */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center justify-between lg:gap-6 mb-2">
        <div className="flex flex-wrap gap-2">
          {/* Encounter Class Tabs */}
          <Tabs
            value={qParams.encounter_class || "all"}
            onValueChange={handleTabSelect}
            className="overflow-y-auto text-gray-950"
          >
            <TabsList className="flex items-center">
              <TabsTrigger value="all">
                <span className="text-gray-950 font-medium text-sm flex items-center gap-1">
                  <NotepadText className="size-4 text-gray-500" />
                  {t("all_prescriptions")}
                </span>
              </TabsTrigger>
              {visibleTabs.slice(1).map((key) => (
                <TabsTrigger key={key} value={key}>
                  <span className="text-gray-950 font-medium text-sm flex items-center gap-1">
                    {React.createElement(
                      ENCOUNTER_CLASS_ICONS[key as EncounterClass],
                      {
                        className: "size-4 text-gray-500",
                      },
                    )}
                    {t(`encounter_class__${key as EncounterClass}`)}
                  </span>
                </TabsTrigger>
              ))}
              {dropdownItems.length > 0 && (
                <>
                  <Separator
                    orientation="vertical"
                    className="bg-gray-300 ml-2"
                  />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="text-gray-950 font-medium text-sm px-3 flex items-center"
                      >
                        {t("more")}
                        <ChevronDown />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      {dropdownItems.map((key) => (
                        <DropdownMenuItem
                          key={key}
                          onClick={() => handleDropdownSelect(key)}
                          className="text-gray-950 font-medium text-sm flex items-center gap-1"
                        >
                          {React.createElement(ENCOUNTER_CLASS_ICONS[key], {
                            className: "size-4",
                          })}
                          {t(`encounter_class__${key}`)}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </TabsList>
          </Tabs>
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
            icon={
              <CareIcon
                icon="l-prescription-bottle"
                className="text-primary size-6"
              />
            }
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
