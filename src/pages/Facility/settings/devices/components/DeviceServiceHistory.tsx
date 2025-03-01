import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Edit, Plus } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import query from "@/Utils/request/query";
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
    useState<any>(null);

  const {
    data: serviceHistory,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["device", facilityId, deviceId],
    queryFn: query(deviceApi.serviceHistory.list, {
      pathParams: {
        facility_external_id: facilityId,
        device_external_id: deviceId,
      },
    }),
  });

  const handleAddService = () => {
    setSelectedServiceHistory(null);
    setIsServiceSheetOpen(true);
  };

  const handleEditService = (service: any) => {
    setSelectedServiceHistory(service);
    setIsServiceSheetOpen(true);
  };

  const handleServiceSheetClose = () => {
    setIsServiceSheetOpen(false);
    refetch();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{t("Service History")}</CardTitle>
          <CardDescription>
            {t("device service history description")}
          </CardDescription>
        </div>
        <Button onClick={handleAddService} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          {t("add_service_record")}
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : serviceHistory && serviceHistory?.results?.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("service_date")}</TableHead>
                <TableHead className="w-full">{t("notes")}</TableHead>
                <TableHead className="text-right">{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {serviceHistory.results.map((service: any) => (
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
          </Table>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            {t("no_service_records", "No service history available")}
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
