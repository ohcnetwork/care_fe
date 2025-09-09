import { useQuery } from "@tanstack/react-query";
import { ScanQrCode, X } from "lucide-react";
import { navigate } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FilterTabs } from "@/components/ui/filter-tabs";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

import Page from "@/components/Common/Page";
import {
  CardGridSkeleton,
  TableSkeleton,
} from "@/components/Common/SkeletonLoading";
import SpecimenIDScanDialog from "@/components/Scan/SpecimenIDScanDialog";
import ServiceRequestTable from "@/components/ServiceRequest/ServiceRequestTable";

import useFilters from "@/hooks/useFilters";

import query from "@/Utils/request/query";
import {
  Priority,
  SERVICE_REQUEST_PRIORITY_COLORS,
  SERVICE_REQUEST_STATUS_COLORS,
  type ServiceRequestReadSpec,
  Status,
} from "@/types/emr/serviceRequest/serviceRequest";
import serviceRequestApi from "@/types/emr/serviceRequest/serviceRequestApi";
import locationApi from "@/types/location/locationApi";

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

function FilterSelect({
  value,
  onValueChange,
  options,
  isStatus,
  onClear,
}: {
  value: string;
  onValueChange: (value: string | undefined) => void;
  options: string[];
  isStatus?: boolean;
  onClear: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex overflow-hidden rounded-lg border">
      <Select
        value={value}
        onValueChange={(newValue) => onValueChange(newValue || undefined)}
      >
        <SelectTrigger className="border-0 hover:bg-transparent focus:ring-0 focus:ring-offset-0">
          <div className="flex items-center gap-2">
            <CareIcon icon="l-filter" className="size-4" />
            {!value ? null : (
              <>
                <span>{isStatus ? t("status") : t("priority")}</span>
                {isStatus && <span className="text-gray-500">{t("is")}</span>}
                <span>{t(value)}</span>
              </>
            )}
            {!value && (
              <span className="text-gray-500">
                {isStatus ? t("status") : t("priority")}
              </span>
            )}
          </div>
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {t(option)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {value && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="h-auto border-l px-2 hover:bg-transparent"
        >
          <X className="size-4" />
        </Button>
      )}
    </div>
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
        ordering: "-created_date",
      },
    }),
  });

  const serviceRequests = response?.results || [];

  const handleClearPriority = () => {
    updateQuery({ priority: undefined });
  };

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
              <div className="relative w-full md:w-auto">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <CareIcon icon="l-search" className="size-5" />
                </span>
                <Input
                  placeholder={t("search_service_requests")}
                  value={qParams.search || ""}
                  onChange={(e) =>
                    updateQuery({ search: e.target.value || undefined })
                  }
                  className="w-full md:w-[300px] pl-10"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch gap-2 w-full sm:w-auto">
              <div className="flex-1 sm:flex-initial sm:w-auto">
                <FilterSelect
                  value={qParams.priority || ""}
                  onValueChange={(value) => updateQuery({ priority: value })}
                  options={Object.values(Priority)}
                  onClear={handleClearPriority}
                />
              </div>
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
