import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Hash, ScanQrCode } from "lucide-react";
import { navigate } from "raviger";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FilterTabs } from "@/components/ui/filter-tabs";

import Page from "@/components/Common/Page";
import {
  CardGridSkeleton,
  TableSkeleton,
} from "@/components/Common/SkeletonLoading";
import SpecimenIDScanDialog from "@/components/Scan/SpecimenIDScanDialog";
import ServiceRequestTable from "@/components/ServiceRequest/ServiceRequestTable";

import useFilters from "@/hooks/useFilters";

import PatientEncounterOrIdentifierFilter from "@/components/Patient/PatientEncounterOrIdentifierFilter";
import TagAssignmentSheet from "@/components/Tags/TagAssignmentSheet";
import { tagFilter } from "@/components/ui/multi-filter/filterConfigs";
import MultiFilter from "@/components/ui/multi-filter/MultiFilter";
import useMultiFilterState from "@/components/ui/multi-filter/utils/useMultiFilterState";
import { createFilterConfig } from "@/components/ui/multi-filter/utils/utils";
import {
  Priority,
  SERVICE_REQUEST_PRIORITY_COLORS,
  SERVICE_REQUEST_STATUS_COLORS,
  type ServiceRequestReadSpec,
  Status,
} from "@/types/emr/serviceRequest/serviceRequest";
import serviceRequestApi from "@/types/emr/serviceRequest/serviceRequestApi";
import { TagConfig, TagResource } from "@/types/emr/tagConfig/tagConfig";
import locationApi from "@/types/location/locationApi";
import query from "@/Utils/request/query";

function EmptyState() {
  const { t } = useTranslation();
  return (
    <Card className="flex flex-col items-center justify-center p-8 text-center border-dashed">
      <div className="rounded-full bg-primary/10 p-3 mb-4">
        <CareIcon icon="l-folder-open" className="size-6 text-primary" />
      </div>
      <h3 className="text-lg font-semibold mb-1">
        {t("no_service_requests_found")}
      </h3>
      <p className="text-sm text-gray-500 mb-4">
        {t("adjust_service_request_filters")}
      </p>
    </Card>
  );
}

function ServiceRequestCard({
  request,
  facilityId,
  locationId,
}: {
  request: ServiceRequestReadSpec;
  facilityId: string;
  locationId: string;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-2 flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="mb-2">
              <div className="font-semibold text-gray-900">
                {request.encounter.patient.name}
              </div>
              <div className="text-xs text-gray-500">
                {request.encounter.patient.id}
              </div>
            </div>
            <div className="mb-2 flex items-center gap-2">
              <Badge variant={SERVICE_REQUEST_STATUS_COLORS[request.status]}>
                {t(request.status)}
              </Badge>
              <Badge
                variant={SERVICE_REQUEST_PRIORITY_COLORS[request.priority]}
              >
                {t(request.priority)}
              </Badge>
            </div>
            <div>
              <div className="text-lg">{request.title || "-"}</div>
              {request.code?.display && (
                <div className="text-xs text-gray-500">
                  {request.code.display}
                </div>
              )}
              {/* Tags */}
              <div className="mt-2 flex flex-wrap gap-1">
                {request.tags && request.tags.length > 0 && (
                  <>
                    {request.tags.map((tag) => (
                      <Badge
                        key={tag.id}
                        variant="secondary"
                        className="text-xs"
                      >
                        {tag.display}
                      </Badge>
                    ))}
                    <TagAssignmentSheet
                      entityType="service_request"
                      entityId={request.id}
                      facilityId={facilityId}
                      currentTags={request.tags}
                      onUpdate={() => {
                        queryClient.invalidateQueries({
                          queryKey: ["serviceRequests", facilityId, locationId],
                        });
                      }}
                      patientId={request.encounter.patient.id}
                      trigger={
                        <Button variant="outline" size="xs">
                          <Hash className="size-3" /> {t("tags")}
                        </Button>
                      }
                    />
                  </>
                )}
                {(!request.tags || request.tags.length === 0) && (
                  <TagAssignmentSheet
                    entityType="service_request"
                    entityId={request.id}
                    facilityId={facilityId}
                    currentTags={[]}
                    onUpdate={() => {
                      queryClient.invalidateQueries({
                        queryKey: ["serviceRequests", facilityId, locationId],
                      });
                    }}
                    patientId={request.encounter.patient.id}
                    trigger={
                      <Button variant="outline" size="xs">
                        <Hash className="size-3" /> {t("add_tags")}
                      </Button>
                    }
                  />
                )}
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              navigate(
                `/facility/${facilityId}/locations/${locationId}/service_requests/${request.id}`,
              )
            }
          >
            <CareIcon icon="l-edit" />
            {t("see_details")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ServiceRequestList({
  facilityId,
  locationId,
}: {
  facilityId: string;
  locationId: string;
}) {
  const { t } = useTranslation();
  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: 14,
    disableCache: true,
  });
  const [isBarcodeOpen, setBarcodeOpen] = useState(false);

  // Create filter configurations
  const filters = useMemo(
    () => [
      tagFilter("tags", TagResource.SERVICE_REQUEST, "multi", "tags"),
      createFilterConfig(
        "priority",
        t("priority"),
        "command",
        Object.values(Priority).map((p) => ({
          value: p,
          label: t(p),
          color: SERVICE_REQUEST_PRIORITY_COLORS[p],
        })),
      ),
    ],
    [],
  );

  // Handle filter updates
  const onFilterUpdate = (query: Record<string, unknown>) => {
    // Update the query parameters based on filter changes
    const updates: Record<string, unknown> = {};

    if (query.tags) {
      const tags = query.tags as TagConfig[];
      updates.tags = tags.length > 0 ? tags.map((tag) => tag.id) : undefined;
    }

    if (query.priority) {
      updates.priority = query.priority;
    }

    updateQuery(updates);
  };

  // Use the multi-filter state hook
  const {
    selectedFilters,
    handleFilterChange,
    handleOperationChange,
    handleClearAll,
    handleClearFilter,
  } = useMultiFilterState(filters, onFilterUpdate);

  const { data: location } = useQuery({
    queryKey: ["location", facilityId, locationId],
    queryFn: query(locationApi.get, {
      pathParams: { facility_id: facilityId, id: locationId },
    }),
  });

  const { data: response, isLoading } = useQuery({
    queryKey: ["serviceRequests", facilityId, locationId, qParams],
    queryFn: query.debounced(serviceRequestApi.listServiceRequest, {
      pathParams: { facilityId },
      queryParams: {
        location: locationId,
        limit: resultsPerPage,
        offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
        title: qParams.search,
        status: qParams.status,
        priority: qParams.priority,
        tags: qParams.tags,
        ordering: "-created_date",
        patient: qParams.patient,
      },
    }),
  });

  const serviceRequests = response?.results || [];

  return (
    <Page title={t("service_requests")} hideTitleOnPage>
      <SpecimenIDScanDialog
        open={isBarcodeOpen}
        onOpenChange={setBarcodeOpen}
        facilityId={facilityId}
        locationId={locationId}
      />
      <div className="container mx-auto pb-8">
        <div className="mb-6 sm:mb-8">
          <div className="mb-4">
            <p className="text-sm text-gray-600">{location?.name}</p>
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
              <h1 className="text-2xl font-semibold text-gray-900">
                {t("service_requests")}
              </h1>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setBarcodeOpen(true)}
                className="w-full sm:w-auto"
              >
                <ScanQrCode className="size-4" />
                {t("scan_qr")}
              </Button>
            </div>
          </div>
          <div className="w-full mb-4 overflow-x-auto">
            <FilterTabs
              value={qParams.status || Status.active}
              onValueChange={(value) => updateQuery({ status: value })}
              options={Object.values(Status)}
              variant="underline"
              showMoreDropdown={true}
              maxVisibleTabs={4}
              defaultVisibleOptions={[
                Status.active,
                Status.on_hold,
                Status.completed,
                Status.draft,
              ]}
              showAllOption={false}
            />
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div className="w-full md:w-auto">
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
              />
            </div>
            <div className="flex flex-col sm:flex-row items-stretch gap-2 w-full sm:w-auto">
              <PatientEncounterOrIdentifierFilter
                onSelect={(patientId) => updateQuery({ patient: patientId })}
                placeholder={t("filter_by_identifier")}
                className="w-full sm:w-auto rounded-md h-9 text-gray-500 shadow-sm"
                patientId={qParams.patient}
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 md:hidden">
              <CardGridSkeleton count={6} />
            </div>
            <div className="hidden md:block">
              <TableSkeleton count={5} />
            </div>
          </>
        ) : serviceRequests.length === 0 && !isLoading ? (
          <EmptyState />
        ) : serviceRequests.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Mobile View */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 md:hidden">
              {serviceRequests.map((request) => (
                <ServiceRequestCard
                  key={request.id}
                  request={request}
                  facilityId={facilityId}
                  locationId={locationId}
                />
              ))}
            </div>

            {/* Desktop View */}
            <div className="hidden md:block">
              <ServiceRequestTable
                requests={serviceRequests}
                facilityId={facilityId}
                locationId={locationId}
              />
            </div>
          </>
        )}

        <div className="mt-8 flex justify-center">
          <Pagination totalCount={response?.count || 0} />
        </div>
      </div>
    </Page>
  );
}
