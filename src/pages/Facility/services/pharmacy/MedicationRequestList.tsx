import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowUpRightSquare, ReceiptTextIcon } from "lucide-react";
import { navigate } from "raviger";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
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
  encounterClassFilter,
  tagFilter,
} from "@/components/ui/multi-filter/filterConfigs";
import MultiFilter from "@/components/ui/multi-filter/MultiFilter";
import useMultiFilterState from "@/components/ui/multi-filter/utils/useMultiFilterState";
import { ENCOUNTER_CLASSES_COLORS } from "@/types/emr/encounter/encounter";
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

  // Create filter configurations
  const filters = useMemo(
    () => [
      tagFilter("tags", TagResource.PRESCRIPTION, "multi", "tags"),
      encounterClassFilter(),
    ],
    [],
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
      {/* Search and filter */}
      <div className="flex flex-col md:flex-row items-start gap-2">
        <div className="w-full md:w-auto">
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
        </div>
        <div className="flex flex-col sm:flex-row">
          <MultiFilter
            selectedFilters={selectedFilters}
            onFilterChange={handleFilterChange}
            onOperationChange={handleOperationChange}
            onClearAll={handleClearAll}
            onClearFilter={handleClearFilter}
            placeholder={t("filters")}
            className="flex sm:flex-row flex-wrap sm:items-center"
            triggerButtonClassName="self-start sm:self-center"
            clearAllButtonClassName="self-center"
            facilityId={facilityId}
          />
        </div>
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
                        {t("billing")}
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
