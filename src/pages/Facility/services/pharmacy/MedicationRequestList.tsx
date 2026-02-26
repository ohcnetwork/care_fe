import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowUpRightSquare,
  CheckCircle,
  MoreVertical,
  ReceiptTextIcon,
} from "lucide-react";
import { Link, navigate } from "raviger";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterTabs } from "@/components/ui/filter-tabs";
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
import useBreakpoints from "@/hooks/useBreakpoints";
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
import careConfig from "@careConfig";

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
    cacheBlacklist: ["patient_external_id", "patient_name"],
  });
  const encounterClassFilterVisibleTabs = useBreakpoints({
    default: 2,
    md: 3,
    xl: 4,
  });
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
        patient: qParams.search,
        status: qParams.status || "active",
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
        offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
      },
    }),
  });

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
      })({ status: "completed" }),
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
      {/* Search and filter */}
      <div className="flex flex-wrap items-center gap-2">
        <PatientIdentifierFilter
          onSelect={(patientId, patientName) =>
            updateQuery({
              patient_external_id: patientId,
              patient_name: patientName,
            })
          }
          placeholder={t("filter_by_identifier")}
          className="w-full sm:w-auto rounded-md h-9 text-gray-500 shadow-sm"
          patientId={qParams.patient_external_id}
          patientName={qParams.patient_name}
        />
        <FilterTabs
          value={
            qParams.encounter_class
              ? `encounter_class__${qParams.encounter_class}`
              : ""
          }
          onValueChange={(value) =>
            updateQuery({
              encounter_class: value
                ? value.replace("encounter_class__", "")
                : "",
            })
          }
          options={[...careConfig.encounterClasses].map(
            (ec) => `encounter_class__${ec}`,
          )}
          showAllOption={true}
          allOptionLabel="all"
          variant="background"
          showMoreDropdown={true}
          maxVisibleTabs={encounterClassFilterVisibleTabs}
          defaultVisibleOptions={[
            "encounter_class__imp",
            "encounter_class__amb",
            "encounter_class__emer",
          ]}
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

        {qParams.patient_external_id && (
          <div className="ml-auto items-end">
            <Button variant="outline_primary" asChild>
              <Link
                href={`/medication_requests/patient/${qParams.patient_external_id}/bill`}
              >
                <ReceiptTextIcon strokeWidth={1.5} />
                {t("bill_all_pending_prescriptions")}
              </Link>
            </Button>
          </div>
        )}
      </div>

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
                <TableHead>{t("patient_name")}</TableHead>
                <TableHead>{t("by")}</TableHead>
                <TableHead>{t("tags", { count: 2 })}</TableHead>
                <TableHead>{t("action")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prescriptionQueue?.results?.map((item: PrescriptionSummary) => (
                <TableRow key={item.id} className="group">
                  <TableCell
                    className="font-semibold group-hover:underline cursor-pointer"
                    onClick={() =>
                      updateQuery({
                        patient_external_id: item.encounter.patient.id,
                        patient_name: item.encounter.patient.name,
                      })
                    }
                  >
                    {item.encounter.patient.name}
                    <div className="text-xs text-gray-500">
                      {t("by")}: {formatName(item.prescribed_by)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {t("at")}: {formatDateTime(item.created_date)}
                    </div>
                  </TableCell>

                  <TableCell className="text-sm">
                    <div className="flex flex-col gap-1">
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
                        <div className="flex items-center gap-1 text-sm text-gray-700">
                          <span>
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
                    <div className="flex gap-2 self-center">
                      <Button
                        variant="outline"
                        className="font-semibold"
                        onClick={() => {
                          navigate(
                            `/facility/${facilityId}/locations/${locationId}/medication_requests/patient/${item.encounter.patient.id}/prescription/${item.id}/bill`,
                          );
                        }}
                      >
                        <ReceiptTextIcon strokeWidth={1.5} />
                        {t("bill")}
                      </Button>
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
