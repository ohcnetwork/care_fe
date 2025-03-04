import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Edit, Plus } from "lucide-react";
import { useQueryParams } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

import ServiceHistorySheet from "./ServiceHistorySheet";

interface DeviceServiceHistoryProps {
  facilityId: string;
  deviceId: string;
}

export default function DeviceServiceHistory({
  facilityId,
  deviceId,
}: DeviceServiceHistoryProps) {
  const { t } = useTranslation();
  const [isServiceSheetOpen, setIsServiceSheetOpen] = useState(false);
  const [selectedServiceHistory, setSelectedServiceHistory] =
    useState<ServiceHistory | null>(null);
  const queryClient = useQueryClient();

  const [qParams, setQueryParams] = useQueryParams<{ page?: number }>();
  const { data: serviceHistory, isLoading } = useQuery({
    queryKey: ["deviceserviceHistory", facilityId, deviceId, qParams],
    queryFn: query(deviceApi.serviceHistory, {
      queryParams: {
        limit: RESULTS_PER_PAGE_LIMIT,
        offset: ((qParams.page ?? 1) - 1) * RESULTS_PER_PAGE_LIMIT,
      },
      pathParams: {
        facilityId,
        deviceId,
      },
    }),
  });

  const handleAddService = () => {
    setSelectedServiceHistory(null);
    setIsServiceSheetOpen(true);
  };

  const handleEditService = (service: ServiceHistory) => {
    setSelectedServiceHistory(service);
    setIsServiceSheetOpen(true);
  };

  const handleServiceSheetClose = () => {
    setIsServiceSheetOpen(false);
    queryClient.invalidateQueries({
      queryKey: ["deviceserviceHistory", facilityId, deviceId, qParams],
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{t("service_history")}</CardTitle>
        </div>
        <Button onClick={handleAddService} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          {t("service_record_add")}
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <TableSkeleton count={5} />
        ) : serviceHistory && serviceHistory?.results?.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("service_date")}</TableHead>
                <TableHead>{t("service_notes")}</TableHead>
                <TableHead className="text-right">{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {serviceHistory.results.map((service: ServiceHistory) => (
                <TableRow key={service.id}>
                  <TableCell className="font-medium">
                    {format(new Date(service.serviced_on), "PPP")}
                  </TableCell>
                  <TableCell className="max-w-md truncate">
                    {service.note}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditService(service)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <div className="flex w-full items-center justify-center">
              <div
                className={cn(
                  "flex w-full justify-center",
                  (serviceHistory?.count ?? 0) > RESULTS_PER_PAGE_LIMIT
                    ? "visible"
                    : "invisible",
                )}
              >
                <PaginationComponent
                  cPage={qParams.page ?? 1}
                  defaultPerPage={RESULTS_PER_PAGE_LIMIT}
                  data={{ totalCount: serviceHistory?.count ?? 0 }}
                  onChange={(page) => setQueryParams({ page })}
                />
              </div>
            </div>
          </Table>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            {t("service_records_none")}
          </div>
        )}
      </CardContent>
      <ServiceHistorySheet
        open={isServiceSheetOpen}
        onOpenChange={handleServiceSheetClose}
        facilityId={facilityId}
        deviceId={deviceId}
        serviceRecord={selectedServiceHistory}
      />
    </Card>
  );
}
