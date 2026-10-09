import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { AlertCircle, Edit, Wrench } from "lucide-react";
import { useQueryParams } from "raviger";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  ExpandableText,
  ExpandableTextContent,
  ExpandableTextExpandButton,
} from "@/components/ui/expandable-text";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import PaginationComponent from "@/components/Common/Pagination";
import { TableSkeleton } from "@/components/Common/SkeletonLoading";

import { RESULTS_PER_PAGE_LIMIT } from "@/common/constants";

import query from "@/Utils/request/query";
import { ServiceHistory } from "@/types/device/device";
import deviceApi from "@/types/device/deviceApi";

import AddServiceHistorySheet from "./AddServiceHistorySheet";
import EditServiceHistorySheet from "./EditServiceHistorySheet";

interface DeviceServiceHistoryProps {
  facilityId: string;
  deviceId: string;
}

export default function DeviceServiceHistory({
  facilityId,
  deviceId,
}: DeviceServiceHistoryProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [qParams, setQueryParams] = useQueryParams<{ page?: number }>();
  const {
    data: serviceHistory,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["deviceServiceHistory", facilityId, deviceId, qParams],
    queryFn: query(deviceApi.serviceHistory.list, {
      queryParams: {
        limit: RESULTS_PER_PAGE_LIMIT,
        offset: ((qParams.page || 1) - 1) * RESULTS_PER_PAGE_LIMIT,
      },
      pathParams: {
        facilityId,
        deviceId,
      },
    }),
  });

  const handleServiceCreated = () => {
    queryClient.invalidateQueries({
      queryKey: ["deviceServiceHistory", facilityId, deviceId, qParams],
    });
  };

  const handleServiceUpdated = () => {
    queryClient.invalidateQueries({
      queryKey: ["deviceServiceHistory", facilityId, deviceId, qParams],
    });
  };

  const serviceHistoryError = (
    <div className="p-4">
      <Alert variant="destructive">
        <AlertCircle />
        <AlertDescription>
          <p>
            {t(
              serviceHistory
                ? "device_service_history_refresh_error"
                : "device_service_history_load_error",
            )}
          </p>
          <Button
            variant="outline"
            disabled={isFetching}
            onClick={() => void refetch()}
            className="mt-3 h-12 border-neutral-400 text-neutral-950 shadow-md hover:bg-neutral-200/75 focus-visible:ring-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 md:h-10"
          >
            {t("try_again")}
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );

  return (
    <Card className="min-w-0 overflow-hidden rounded-[10px] border-neutral-200 bg-white text-neutral-950 shadow-xs">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-neutral-200 p-4">
        <CardTitle>
          <h2 className="text-lg leading-6 font-semibold">
            {t("service_history")}
          </h2>
        </CardTitle>
        <div className="[&_button]:h-12 [&_button]:border-neutral-400 [&_button]:bg-white [&_button]:text-sm [&_button]:text-neutral-950 [&_button]:shadow-md [&_button]:hover:bg-neutral-200/75 [&_button]:hover:text-neutral-950 [&_button]:focus-visible:ring-0 [&_button]:focus-visible:outline-2 [&_button]:focus-visible:outline-offset-2 [&_button]:focus-visible:outline-indigo-500 md:[&_button]:h-10 [&_svg]:size-5">
          <AddServiceHistorySheet
            facilityId={facilityId}
            deviceId={deviceId}
            onServiceCreated={handleServiceCreated}
          />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isError && serviceHistory && serviceHistoryError}
        {isLoading ? (
          <div className="p-4">
            <TableSkeleton count={5} />
          </div>
        ) : isError && !serviceHistory ? (
          serviceHistoryError
        ) : serviceHistory?.results?.length === 0 ? (
          <EmptyState
            icon={<Wrench className="size-6 text-neutral-500" />}
            className="min-h-40 rounded-none border-0 bg-white py-8 shadow-none [&>div]:bg-neutral-100 [&>h3]:text-base [&>h3]:text-neutral-950"
            title={t("service_records_none")}
          />
        ) : (
          <div>
            <Table aria-label={t("service_history")}>
              <TableHeader className="bg-neutral-50">
                <TableRow className="border-neutral-200 hover:bg-transparent">
                  <TableHead className="h-10 px-4 text-sm font-medium text-neutral-950">
                    {t("service_date")}
                  </TableHead>
                  <TableHead className="h-10 text-sm font-medium text-neutral-950">
                    {t("service_notes")}
                  </TableHead>
                  <TableHead className="h-10 px-4 text-right text-sm font-medium text-neutral-950">
                    {t("actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {serviceHistory?.results.map((service: ServiceHistory) => (
                  <TableRow
                    key={service.id}
                    className="border-neutral-200 hover:bg-neutral-100/50"
                  >
                    <TableCell className="min-w-28 whitespace-normal px-4 py-3 font-medium">
                      {format(new Date(service.serviced_on), "PPP")}
                    </TableCell>
                    <TableCell className="max-w-md whitespace-normal">
                      <ExpandableText className="flex-wrap gap-2">
                        <ExpandableTextContent className="min-w-0 break-words">
                          {service.note}
                        </ExpandableTextContent>
                        <ExpandableTextExpandButton className="h-12 bg-transparent px-0 text-sm text-neutral-950 underline underline-offset-4 hover:bg-neutral-100 focus-visible:ring-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 md:h-10">
                          {t("read_more")}
                        </ExpandableTextExpandButton>
                      </ExpandableText>
                    </TableCell>
                    <TableCell className="px-4 text-right">
                      <EditServiceHistorySheet
                        facilityId={facilityId}
                        deviceId={deviceId}
                        serviceRecord={service}
                        onServiceUpdated={handleServiceUpdated}
                        trigger={
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={t("service_record_edit")}
                            className="size-12 text-neutral-700 hover:bg-neutral-200/75 focus-visible:ring-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 md:size-10 [&_svg]:size-5"
                          >
                            <Edit className="size-4" />
                          </Button>
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {(serviceHistory?.count ?? 0) > RESULTS_PER_PAGE_LIMIT && (
              <div className="flex w-full items-center justify-end border-t border-neutral-200 p-4">
                <div
                  className={cn(
                    "flex w-full justify-center",
                    (serviceHistory?.count ?? 0) > RESULTS_PER_PAGE_LIMIT
                      ? "visible"
                      : "invisible",
                  )}
                >
                  <PaginationComponent
                    cPage={qParams.page || 1}
                    defaultPerPage={RESULTS_PER_PAGE_LIMIT}
                    data={{ totalCount: serviceHistory?.count ?? 0 }}
                    onChange={(page) => setQueryParams({ page })}
                    className="flex items-center [&_button]:h-12 [&_button]:min-w-12 [&_button]:focus-visible:ring-0 [&_button]:focus-visible:outline-2 [&_button]:focus-visible:outline-offset-2 [&_button]:focus-visible:outline-indigo-500 md:[&_button]:h-10 md:[&_button]:min-w-10 [&_button.bg-primary-700]:bg-emerald-800 [&_button.bg-primary-700]:hover:bg-emerald-900 [&_button.bg-gray-100]:bg-neutral-100 [&_button.bg-gray-100]:text-neutral-950 [&_button.bg-gray-100]:hover:bg-neutral-200/75 [&_nav]:border-neutral-300"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
