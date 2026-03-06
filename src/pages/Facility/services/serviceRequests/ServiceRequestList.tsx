import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ScanQrCode } from "lucide-react";
import { navigate } from "raviger";
import { useEffect, useMemo, useState } from "react";
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

import PatientIdentifierFilter from "@/components/Patient/PatientIdentifierFilter";
import TagAssignmentSheet from "@/components/Tags/TagAssignmentSheet";
import { ActivityDefinitionFilterValue } from "@/components/ui/multi-filter/activityDefinitionFilter";
import {
  activityDefinitionFilter,
  dateFilter,
  encounterClassFilter,
  tagFilter,
} from "@/components/ui/multi-filter/filterConfigs";
import MultiFilter from "@/components/ui/multi-filter/MultiFilter";
import useMultiFilterState from "@/components/ui/multi-filter/utils/useMultiFilterState";
import {
  createFilterConfig,
  FilterDateRange,
  getVariantColorClasses,
  longDateRangeOptions,
} from "@/components/ui/multi-filter/utils/Utils";
import { useShortcutSubContext } from "@/context/ShortcutContext";
import activityDefinitionApi from "@/types/emr/activityDefinition/activityDefinitionApi";
import {
  Priority,
  SERVICE_REQUEST_PRIORITY_COLORS,
  SERVICE_REQUEST_STATUS_COLORS,
  type ServiceRequestReadSpec,
  Status,
} from "@/types/emr/serviceRequest/serviceRequest";
import serviceRequestApi from "@/types/emr/serviceRequest/serviceRequestApi";
import { TagConfig, TagResource } from "@/types/emr/tagConfig/tagConfig";
import useTagConfigs from "@/types/emr/tagConfig/useTagConfig";
import locationApi from "@/types/location/locationApi";
import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";
import query from "@/Utils/request/query";
import { dateQueryString, dateTimeQueryString } from "@/Utils/utils";

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
                <TagAssignmentSheet
                  entityType="service_request"
                  entityId={request.id}
                  facilityId={facilityId}
                  currentTags={request.tags}
                  onUpdate={() => {
                    queryClient.invalidateQueries({
                      queryKey: ["serviceRequests", facilityId],
                    });
                  }}
                  patientId={request.encounter.patient.id}
                />
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
    defaultQueryParams: {
      status: "active",
    },
  });
  const [isBarcodeOpen, setBarcodeOpen] = useState(false);
  useShortcutSubContext("facility:service");

  const tagIds = qParams.tags?.split(",") || [];
  const tagQueries = useTagConfigs({ ids: tagIds, facilityId });
  const selectedTags = tagQueries
    .map((query) => query.data)
    .filter(Boolean) as TagConfig[];

  const [selectedActivityDefinition, setSelectedActivityDefinition] = useState<
    ActivityDefinitionFilterValue | undefined
  >(undefined);

  const { data: activityDefinitionData } = useQuery({
    queryKey: ["activityDefinition", facilityId, qParams.activity_definition],
    queryFn: query(activityDefinitionApi.retrieveActivityDefinition, {
      pathParams: {
        facilityId,
        activityDefinitionSlug: qParams.activity_definition,
      },
    }),
    enabled: !!qParams.activity_definition && !selectedActivityDefinition,
  });

  useEffect(() => {
    if (activityDefinitionData && !selectedActivityDefinition) {
      setSelectedActivityDefinition({
        id: activityDefinitionData.id,
        slug: activityDefinitionData.slug,
        title: activityDefinitionData.title,
        category: activityDefinitionData.category,
      });
    } else if (!qParams.activity_definition && selectedActivityDefinition) {
      setSelectedActivityDefinition(undefined);
    }
  }, [
    activityDefinitionData,
    qParams.activity_definition,
    selectedActivityDefinition,
  ]);

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
          color: getVariantColorClasses(SERVICE_REQUEST_PRIORITY_COLORS[p]),
        })),
      ),
      encounterClassFilter(),
      activityDefinitionFilter(
        "activity_definition",
        "single",
        "activity_definition",
      ),
      dateFilter("created_date", t("date"), longDateRangeOptions),
    ],
    [],
  );

  // Handle filter updates
  const onFilterUpdate = (updates: Record<string, unknown>) => {
    for (const [key, value] of Object.entries(updates)) {
      switch (key) {
        case "tags":
          updates.tags = (value as TagConfig[])?.map((tag) => tag.id);
          break;
        case "activity_definition": {
          const adValue = Array.isArray(value)
            ? (value as ActivityDefinitionFilterValue[])[0]
            : (value as ActivityDefinitionFilterValue | undefined);

          setSelectedActivityDefinition(adValue);

          if (adValue) {
            updates.activity_definition = adValue.slug;
          } else {
            updates.activity_definition = undefined;
          }
          break;
        }
        case "created_date":
          {
            const dateRange = value as FilterDateRange;
            updates.created_date = undefined;
            updates.created_date_after = dateRange?.from
              ? dateQueryString(dateRange.from)
              : undefined;
            updates.created_date_before = dateRange?.to
              ? dateQueryString(dateRange.to)
              : undefined;
          }
          break;
      }
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
  } = useMultiFilterState(filters, onFilterUpdate, {
    ...qParams,
    tags: selectedTags,
    activity_definition: selectedActivityDefinition
      ? [selectedActivityDefinition]
      : [],
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

  const { data: location } = useQuery({
    queryKey: ["location", facilityId, locationId],
    queryFn: query(locationApi.get, {
      pathParams: { facility_id: facilityId, id: locationId },
    }),
  });

  const { data: response, isLoading } = useQuery({
    queryKey: ["serviceRequests", facilityId, { ...qParams, locationId }],
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
        patient: qParams.patient,
        tags_behavior: qParams.tags_behavior,
        encounter_class: qParams.encounter_class,
        activity_definition: qParams.activity_definition,
        created_date_after: qParams.created_date_after
          ? dateTimeQueryString(new Date(qParams.created_date_after))
          : undefined,
        created_date_before: qParams.created_date_before
          ? dateTimeQueryString(new Date(qParams.created_date_before), true)
          : undefined,
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
        <div className="mb-4">
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
                <ShortcutBadge actionId="scan-button" className="ml-2" />
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

          <div className="flex flex-col md:flex-row items-start gap-2">
            <div className="w-full md:w-auto">
              <PatientIdentifierFilter
                onSelect={(patientId, patientName) =>
                  updateQuery({ patient: patientId, patient_name: patientName })
                }
                placeholder={t("filter_by_identifier")}
                className="w-full sm:w-auto rounded-md h-9 text-gray-500 shadow-sm"
                patientId={qParams.patient}
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
                onPatientClick={(request) =>
                  updateQuery({
                    patient: request.encounter.patient.id,
                    patient_name: request.encounter.patient.name,
                  })
                }
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
