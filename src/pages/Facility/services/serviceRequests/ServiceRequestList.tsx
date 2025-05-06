import { useQuery } from "@tanstack/react-query";
import { ScanBarcode, X } from "lucide-react";
import { navigate } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import Page from "@/components/Common/Page";
import {
  CardGridSkeleton,
  TableSkeleton,
} from "@/components/Common/SkeletonLoading";
import BarcodeScanDialog from "@/components/barcode/BarcodeScanDialog";

import useFilters from "@/hooks/useFilters";

import query from "@/Utils/request/query";
import {
  Priority,
  type ServiceRequestReadSpec,
  Status,
} from "@/types/emr/serviceRequest/serviceRequest";
import serviceRequestApi from "@/types/emr/serviceRequest/serviceRequestApi";
import locationApi from "@/types/location/locationApi";

const STATUS_COLORS: Record<Status, string> = {
  [Status.draft]: "bg-gray-100 text-gray-700",
  [Status.active]: "bg-green-100 text-green-700",
  [Status.on_hold]: "bg-yellow-100 text-yellow-700",
  [Status.revoked]: "bg-red-100 text-red-700",
  [Status.completed]: "bg-blue-100 text-blue-700",
  [Status.entered_in_error]: "bg-red-100 text-red-700",
  [Status.ended]: "bg-gray-100 text-gray-700",
  [Status.unknown]: "bg-gray-100 text-gray-700",
};

const PRIORITY_COLORS: Record<Priority, string> = {
  [Priority.routine]: "bg-gray-100 text-gray-700",
  [Priority.urgent]: "bg-yellow-100 text-yellow-700",
  [Priority.asap]: "bg-orange-100 text-orange-700",
  [Priority.stat]: "bg-red-100 text-red-700",
};

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
  serviceId,
  locationId,
}: {
  request: ServiceRequestReadSpec;
  facilityId: string;
  serviceId: string;
  locationId: string;
}) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <div className="mb-2">
              <div className="font-semibold text-gray-900">
                {request.encounter.patient.name}
              </div>
              <div className="text-xs text-gray-500">
                {request.encounter.patient.id}
              </div>
            </div>
            <div className="mb-2 flex items-center gap-2">
              <Badge
                variant="outline"
                className={STATUS_COLORS[request.status]}
              >
                {t(request.status)}
              </Badge>
              <Badge
                variant="outline"
                className={PRIORITY_COLORS[request.priority]}
              >
                {t(request.priority)}
              </Badge>
            </div>
            <h3 className="font-medium text-gray-900">{request.title}</h3>
            <p className="mt-1 text-sm text-gray-500">
              {request.note || t("no_notes")}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              navigate(
                `/facility/${facilityId}/services/${serviceId}/requests/locations/${locationId}/service_requests/${request.id}`,
              )
            }
          >
            <CareIcon icon="l-edit" />
            {t("see_details")}
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <CareIcon icon="l-calender" className="size-4" />
            <span>{request.occurance || t("no_occurrence_set")}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ServiceRequestTable({
  requests,
  facilityId,
  serviceId,
  locationId,
}: {
  requests: ServiceRequestReadSpec[];
  facilityId: string;
  serviceId: string;
  locationId: string;
}) {
  const { t } = useTranslation();

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader className="bg-gray-100">
          <TableRow className="divide-gray-200">
            <TableHead>{t("patient_name")}</TableHead>
            <TableHead>{t("service_type")}</TableHead>
            <TableHead>{t("status")}</TableHead>
            <TableHead>{t("priority")}</TableHead>
            <TableHead>{t("actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="bg-white">
          {requests.map((request) => (
            <TableRow key={request.id} className="divide-x divide-gray-200">
              <TableCell className="font-medium">
                <div className="font-semibold text-gray-900">
                  {request.encounter.patient.name}
                </div>
                <div className="text-xs text-gray-500">
                  {request.encounter.patient.id}
                </div>
              </TableCell>
              <TableCell>{request.title}</TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={STATUS_COLORS[request.status]}
                >
                  {t(request.status)}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={PRIORITY_COLORS[request.priority]}
                >
                  {t(request.priority)}
                </Badge>
              </TableCell>
              <TableCell className="text-left">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    navigate(
                      `/facility/${facilityId}/services/${serviceId}/requests/locations/${locationId}/service_requests/${request.id}`,
                    )
                  }
                >
                  <CareIcon icon="l-edit" />
                  {t("see_details")}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
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
                <span>{isStatus ? "Status" : "Priority"}</span>
                {isStatus && <span className="text-gray-500">is</span>}
                <span>{t(value)}</span>
              </>
            )}
            {!value && (
              <span className="text-gray-500">
                {isStatus ? "Status" : "Priority"}
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
  serviceId,
  locationId,
}: {
  facilityId: string;
  serviceId: string;
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
    queryKey: ["serviceRequests", qParams],
    queryFn: query.debounced(serviceRequestApi.listServiceRequest, {
      pathParams: { facilityId },
      queryParams: {
        location: locationId,
        limit: resultsPerPage,
        offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
        title: qParams.search,
        status: qParams.status,
        priority: qParams.priority,
      },
    }),
  });

  const serviceRequests = response?.results || [];

  const handleClearStatus = () => {
    updateQuery({ status: undefined });
  };

  const handleClearPriority = () => {
    updateQuery({ priority: undefined });
  };

  const handleClearAll = () => {
    updateQuery({ status: undefined, priority: undefined });
  };

  return (
    <Page title={t("service_requests")} hideTitleOnPage>
      <div className="flex justify-between items-center gap-4 mb-4">
        <Button
          variant="outline"
          onClick={() =>
            navigate(`/facility/${facilityId}/services/${serviceId}`)
          }
          className="gap-2"
          size="sm"
        >
          <CareIcon icon="l-arrow-left" className="size-4" />
          {t("back")}
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setBarcodeOpen(true)}
        >
          <ScanBarcode className="size-4" />
          {t("scan_barcode")}
        </Button>
      </div>
      <BarcodeScanDialog
        open={isBarcodeOpen}
        onOpenChange={setBarcodeOpen}
        facilityId={facilityId}
        serviceId={serviceId}
        locationId={locationId}
      />
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <div className="mb-4">
            <p className="text-sm text-gray-600">{location?.name}</p>
            <h1 className="text-2xl font-semibold text-gray-900">
              {t("service_requests")}
            </h1>
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
                  value={qParams.status || ""}
                  onValueChange={(value) => updateQuery({ status: value })}
                  options={Object.values(Status)}
                  isStatus
                  onClear={handleClearStatus}
                />
              </div>
              <div className="flex-1 sm:flex-initial sm:w-auto">
                <FilterSelect
                  value={qParams.priority || ""}
                  onValueChange={(value) => updateQuery({ priority: value })}
                  options={Object.values(Priority)}
                  onClear={handleClearPriority}
                />
              </div>
              {qParams.status && qParams.priority && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                  className="text-sm font-medium"
                >
                  {t("clear")}
                </Button>
              )}
            </div>
          </div>
        </div>

        {isLoading ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 md:hidden">
              <CardGridSkeleton count={6} />
            </div>
            <div className="phidden md:block">
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
                  serviceId={serviceId}
                  locationId={locationId}
                />
              ))}
            </div>

            {/* Desktop View */}
            <div className="hidden md:block">
              <ServiceRequestTable
                requests={serviceRequests}
                facilityId={facilityId}
                serviceId={serviceId}
                locationId={locationId}
              />
            </div>
          </>
        )}

        {response && response.count > resultsPerPage && (
          <div className="mt-8 flex justify-center">
            <Pagination totalCount={response.count} />
          </div>
        )}
      </div>
    </Page>
  );
}
