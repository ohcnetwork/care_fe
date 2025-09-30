import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Edit } from "lucide-react";
import { useQueryParams } from "raviger";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

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

import CareIcon from "@/CAREUI/icons/CareIcon";
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
  const { data: serviceHistory, isLoading } = useQuery({
    queryKey: ["deviceServiceHistory", facilityId, deviceId, qParams],
    queryFn: query(deviceApi.serviceHistory.list, {
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

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <CardTitle>{t("service_history")}</CardTitle>
        <AddServiceHistorySheet
          facilityId={facilityId}
          deviceId={deviceId}
          onServiceCreated={handleServiceCreated}
        />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <TableSkeleton count={5} />
        ) : serviceHistory?.results?.length === 0 ? (
          <EmptyState
            icon={<CareIcon icon="l-wrench" className="size-6 text-primary" />}
            title={t("service_records_none")}
          />
        ) : (
          <div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("service_date")}</TableHead>
                  <TableHead>{t("service_notes")}</TableHead>
                  <TableHead className="text-right">{t("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {serviceHistory?.results.map((service: ServiceHistory) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-medium">
                      {format(new Date(service.serviced_on), "PPP")}
                    </TableCell>
                    <TableCell className="max-w-md whitespace-normal">
                      <ExpandableText>
                        <ExpandableTextContent>
                          {service.note}
                        </ExpandableTextContent>
                        <ExpandableTextExpandButton>
                          {t("read_more")}
                        </ExpandableTextExpandButton>
                      </ExpandableText>
                    </TableCell>
                    <TableCell className="text-right ">
                      <EditServiceHistorySheet
                        facilityId={facilityId}
                        deviceId={deviceId}
                        serviceRecord={service}
                        onServiceUpdated={handleServiceUpdated}
                        trigger={
                          <Button variant="ghost" size="icon">
                            <Edit className="size-4" />
                          </Button>
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex w-full items-center justify-center mt-4">
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
          </div>
        )}
      </CardContent>
    </Card>
  );
}
