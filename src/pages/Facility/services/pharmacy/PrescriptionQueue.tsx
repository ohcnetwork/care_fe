import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRightIcon,
  CheckCircle,
  MoreVertical,
  PrinterIcon,
} from "lucide-react";
import { Link } from "raviger";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import careConfig from "@careConfig";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterSelect } from "@/components/ui/filter-select";
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
import {
  dateFilter,
  tagFilter,
} from "@/components/ui/multi-filter/filterConfigs";
import MultiFilter from "@/components/ui/multi-filter/MultiFilter";
import useMultiFilterState from "@/components/ui/multi-filter/utils/useMultiFilterState";
import {
  FilterDateRange,
  longDateRangeOptions,
} from "@/components/ui/multi-filter/utils/Utils";
import { cn } from "@/lib/utils";
import { CreateDispenseSheet } from "@/pages/Facility/services/pharmacy/CreateDispenseSheet";
import {
  ENCOUNTER_CLASS_ICONS,
  ENCOUNTER_CLASSES_COLORS,
  ENCOUNTER_STATUS_COLORS,
  ENCOUNTER_STATUS_ICONS,
} from "@/types/emr/encounter/encounter";
import {
  PrescriptionStatus,
  PrescriptionSummary,
} from "@/types/emr/prescription/prescription";
import prescriptionApi from "@/types/emr/prescription/prescriptionApi";
import { TagConfig, TagResource } from "@/types/emr/tagConfig/tagConfig";
import useTagConfigs from "@/types/emr/tagConfig/useTagConfig";
import { getLocationPath } from "@/types/location/utils";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { PaginatedResponse } from "@/Utils/request/types";
import {
  dateQueryString,
  dateTimeQueryString,
  formatDateTime,
  formatName,
} from "@/Utils/utils";

export default function PrescriptionQueue({
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
    cacheBlacklist: ["patient_external_id", "patient_name", "status"],
  });

  const currentTab: PrescriptionStatus =
    qParams.status || PrescriptionStatus.active;

  const tagIds = qParams.tags?.split(",") || [];
  const tagQueries = useTagConfigs({ ids: tagIds, facilityId });
  const selectedTags = tagQueries
    .map((query) => query.data)
    .filter(Boolean) as TagConfig[];

  // Create filter configurations
  const filters = useMemo(
    () => [
      tagFilter("tags", TagResource.PRESCRIPTION, "multi", "tags"),
      dateFilter("created_date", t("date"), longDateRangeOptions),
    ],
    [t],
  );

  // Handle filter updates
  const onFilterUpdate = (filterQuery: Record<string, unknown>) => {
    // Update the query parameters based on filter changes
    let query = { ...filterQuery };
    for (const [key, value] of Object.entries(filterQuery)) {
      switch (key) {
        case "tags":
          query.tags = (value as TagConfig[])?.map((tag) => tag.id).join(",");
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
    created_date:
      qParams.created_date_after || qParams.created_date_before
        ? {
            from: qParams.created_date_after
              ? new Date(qParams.created_date_after)
              : undefined,
            to: qParams.created_date_before
              ? new Date(qParams.created_date_before)
              : undefined,
          }
        : undefined,
  });

  const { data: prescriptionQueue, isLoading } = useQuery<
    PaginatedResponse<PrescriptionSummary>
  >({
    queryKey: ["prescriptionQueue", facilityId, qParams],
    queryFn: query.debounced(prescriptionApi.summary, {
      pathParams: { facilityId },
      queryParams: {
        status: currentTab,
        patient_external_id: qParams.patient_external_id,
        encounter_class: qParams.encounter_class,
        tags: qParams.tags,
        tags_behavior: qParams.tags_behavior,
        created_date_after: qParams.created_date_after
          ? dateTimeQueryString(new Date(qParams.created_date_after))
          : undefined,
        created_date_before: qParams.created_date_before
          ? dateTimeQueryString(new Date(qParams.created_date_before), true)
          : undefined,
        limit: resultsPerPage,
        offset: ((qParams.page || 1) - 1) * resultsPerPage,
      },
    }),
  });

  const isFilteredByPatient = !!qParams.patient_external_id;
  const showBillingSelection =
    isFilteredByPatient && currentTab === PrescriptionStatus.active;

  // State for selected prescription IDs
  const [selectedPrescriptionIds, setSelectedPrescriptionIds] = useState<
    string[]
  >([]);

  // Auto-select all prescriptions when billing selection is shown and data loads
  useEffect(() => {
    if (showBillingSelection && prescriptionQueue?.results) {
      setSelectedPrescriptionIds(
        prescriptionQueue.results.map((item) => item.id),
      );
    } else {
      setSelectedPrescriptionIds([]);
    }
  }, [showBillingSelection, prescriptionQueue?.results, qParams.page]);

  // Handle select all toggle
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPrescriptionIds(
        prescriptionQueue?.results?.map((item) => item.id) || [],
      );
    } else {
      setSelectedPrescriptionIds([]);
    }
  };

  // Handle individual checkbox toggle
  const handleSelectPrescription = (prescriptionId: string) => {
    setSelectedPrescriptionIds((prev) =>
      prev.includes(prescriptionId)
        ? prev.filter((id) => id !== prescriptionId)
        : [...prev, prescriptionId],
    );
  };

  const allSelected =
    (prescriptionQueue?.results?.length ?? 0) > 0 &&
    prescriptionQueue?.results?.every((item) =>
      selectedPrescriptionIds.includes(item.id),
    );

  const { mutate: completePrescription } = useMutation({
    mutationFn: ({
      patientId,
      prescriptionId,
    }: {
      patientId: string;
      prescriptionId: string;
    }) =>
      mutate(prescriptionApi.update, {
        pathParams: { patientId, id: prescriptionId },
      })({ status: PrescriptionStatus.completed }),
    onSuccess: () => {
      toast.success(t("prescription_marked_as_completed"));
      queryClient.invalidateQueries({
        queryKey: ["prescriptionQueue", facilityId, qParams],
      });
    },
    onError: () => {
      toast.error(t("prescription_marking_complete_failed"));
    },
  });

  return (
    <Page
      title={t("prescription_queue")}
      options={
        <CreateDispenseSheet
          facilityId={facilityId}
          locationId={locationId}
          patientId={qParams.patient_external_id}
        />
      }
    >
      {/* Priority tabs with original styling */}
      <div className="mb-4 pt-6">
        <Tabs
          value={currentTab}
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
                className="relative px-2 sm:px-4 py-2 text-gray-600 hover:text-gray-900  data-[state=active]:text-primary-800 data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none font-semibold transition-colors whitespace-nowrap ease-in-out"
              >
                {t(`prescription_status__${key}`)}
                <div
                  className={cn(
                    "absolute inset-x-0 bg-primary-700 h-0.75 rounded-t-md -bottom-px transition-opacity duration-200 ease-in-out",
                    currentTab === key ? "opacity-100" : "opacity-0",
                  )}
                />
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
      {/* Search and filter */}
      <div className="flex flex-wrap items-center gap-2">
        <PatientIdentifierFilter
          onSelect={(patientId, patientName) =>
            updateQuery({
              patient_external_id: patientId,
              patient_name: patientName,
            })
          }
          placeholder={t("or_search_by_id")}
          className="w-full sm:w-auto rounded-md h-9 text-gray-500 shadow-sm"
          patientId={qParams.patient_external_id}
          patientName={qParams.patient_name}
        />
        <FilterSelect
          value={
            qParams.encounter_class
              ? `encounter_class__${qParams.encounter_class}`
              : ""
          }
          onValueChange={(value) =>
            updateQuery({
              encounter_class: value?.replace("encounter_class__", ""),
            })
          }
          options={careConfig.encounterClasses.map(
            (c) => `encounter_class__${c}`,
          )}
          label={t("encounter_class")}
          onClear={() => updateQuery({ encounter_class: undefined })}
        />
        <MultiFilter
          selectedFilters={selectedFilters}
          onFilterChange={handleFilterChange}
          onOperationChange={handleOperationChange}
          onClearAll={handleClearAll}
          onClearFilter={handleClearFilter}
          placeholder={t("filters")}
          className="flex flex-wrap md:flex-row items-start"
          facilityId={facilityId}
        />
      </div>

      {/* Selection bar when filtered by patient with active status */}
      {showBillingSelection && (
        <div className="mt-4 border border-gray-300 bg-white rounded-lg p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-gray-950">
                {t("select_prescriptions_to_bill")}
              </span>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label={t("select_all")}
                  id="select-all-prescriptions"
                />
                <label
                  htmlFor="select-all-prescriptions"
                  className="text-sm font-medium cursor-pointer"
                >
                  {t("select_all")}
                </label>
              </div>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Button variant="link" className="underline">
                {/* TODO: wire this */}
                <PrinterIcon />
                {t("print_all_rx")}
              </Button>
              <Button variant="outline_primary" asChild>
                <Link
                  href={`/medication_requests/patient/${qParams.patient_external_id}/bill/prescriptions/${selectedPrescriptionIds.join(",")}`}
                  className={
                    selectedPrescriptionIds.length === 0
                      ? "pointer-events-none opacity-50"
                      : ""
                  }
                >
                  {t("bill_selected_prescriptions")}
                  <ArrowRightIcon />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Table section */}
      <div className="mt-4">
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
                {showBillingSelection && <TableHead className="min-w-8" />}
                <TableHead className="w-1/3">{t("patient_name")}</TableHead>
                <TableHead className="w-1/3">
                  {t("encounter_status_location")}
                </TableHead>
                <TableHead className="w-1/3">
                  {t("tags", { count: 2 })}
                </TableHead>
                <TableHead>{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prescriptionQueue?.results?.map((item: PrescriptionSummary) => (
                <TableRow key={item.id} className="group">
                  {showBillingSelection && (
                    <TableCell>
                      <Checkbox
                        checked={selectedPrescriptionIds.includes(item.id)}
                        onCheckedChange={() =>
                          handleSelectPrescription(item.id)
                        }
                        aria-label={t("select_prescription")}
                      />
                    </TableCell>
                  )}
                  <TableCell
                    className="cursor-pointer min-h-15"
                    onClick={() => {
                      if (showBillingSelection) {
                        handleSelectPrescription(item.id);
                      } else {
                        updateQuery({
                          patient_external_id: item.encounter.patient.id,
                          patient_name: item.encounter.patient.name,
                        });
                      }
                    }}
                  >
                    <span className="underline decoration-1 underline-offset-2 font-semibold">
                      {item.encounter.patient.name}
                    </span>
                    <div className="text-sm font-medium text-gray-700 whitespace-pre-wrap">
                      <span>{formatName(item.prescribed_by)}</span>
                      <span> · </span>
                      <span>{formatDateTime(item.created_date)}</span>
                    </div>
                  </TableCell>

                  <TableCell className="text-sm">
                    <div className="flex flex-col gap-2">
                      <div className="space-x-1">
                        <Badge
                          size="sm"
                          variant={
                            ENCOUNTER_CLASSES_COLORS[
                              item.encounter.encounter_class
                            ]
                          }
                        >
                          {React.createElement(
                            ENCOUNTER_CLASS_ICONS[
                              item.encounter.encounter_class
                            ],
                            { className: "size-3" },
                          )}
                          {t(
                            `encounter_class__${item.encounter.encounter_class}`,
                          )}
                        </Badge>
                        <Badge
                          size="sm"
                          variant={
                            ENCOUNTER_STATUS_COLORS[item.encounter.status]
                          }
                        >
                          {React.createElement(
                            ENCOUNTER_STATUS_ICONS[item.encounter.status],
                            { className: "size-3" },
                          )}
                          {t(`encounter_status__${item.encounter.status}`)}
                        </Badge>
                      </div>
                      {item.encounter.current_location && (
                        <div className="bg-gray-100 py-1 px-3">
                          <span className="text-gray-800">
                            {getLocationPath(item.encounter.current_location)}
                          </span>
                        </div>
                      )}
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
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-4 items-center">
                      <span className="font-semibold underline">
                        <Button variant="link" className="underline">
                          <Link
                            href={`/medication_requests/patient/${item.encounter.patient.id}/prescriptions/${item.id}`}
                          >
                            {t("view_rx")}
                          </Link>
                        </Button>
                      </span>
                      {item.status === PrescriptionStatus.active &&
                        !isFilteredByPatient && (
                          <Button
                            variant="outline"
                            className="font-semibold text-sm text-gray-950"
                          >
                            <Link
                              href={`/medication_requests/patient/${item.encounter.patient.id}/bill/prescriptions/${item.id}`}
                            >
                              {t("bill_now")}
                            </Link>
                          </Button>
                        )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              completePrescription({
                                patientId: item.encounter.patient.id,
                                prescriptionId: item.id,
                              })
                            }
                            disabled={item.status !== "active"}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            {t("mark_prescription_complete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
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
