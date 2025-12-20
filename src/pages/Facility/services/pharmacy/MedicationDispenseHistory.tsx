import { useQuery } from "@tanstack/react-query";
import { ArrowUpRightSquare } from "lucide-react";
import { navigate, useQueryParams } from "raviger";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

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
import {
  DispenseOrderRead,
  DispenseOrderStatus,
} from "@/types/emr/dispenseOrder/dispenseOrder";
import dispenseOrderApi from "@/types/emr/dispenseOrder/dispenseOrderApi";
import query from "@/Utils/request/query";
import { formatDateTime } from "@/Utils/utils";
import { useEffect } from "react";

const DISPENSE_ORDER_STATUS_STYLES: Record<
  DispenseOrderStatus,
  React.ComponentProps<typeof Badge>["variant"]
> = {
  [DispenseOrderStatus.draft]: "secondary",
  [DispenseOrderStatus.in_progress]: "yellow",
  [DispenseOrderStatus.completed]: "green",
  [DispenseOrderStatus.abandoned]: "secondary",
  [DispenseOrderStatus.entered_in_error]: "danger",
};

export default function MedicationDispenseHistory({
  facilityId,
  locationId,
}: {
  facilityId: string;
  locationId: string;
}) {
  const { t } = useTranslation();
  const [{ patientId }] = useQueryParams();
  const { qParams, Pagination, resultsPerPage } = useFilters({
    limit: 14,
    disableCache: true,
  });

  const { data: dispenseOrderQueue, isLoading } = useQuery({
    queryKey: ["dispenseOrderQueue", facilityId, locationId, qParams],
    queryFn: query.debounced(dispenseOrderApi.list, {
      pathParams: { facilityId },
      queryParams: {
        location: locationId,
        patient: qParams.patientId,
        /*         status:
          qParams.exclude_status === "history"
            ? "completed,cancelled,entered_in_error,stopped,declined"
            : "preparation,in_progress,on_hold", */
        limit: resultsPerPage,
        offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
      },
    }),
  });

  useEffect(() => {
    if (patientId) {
      qParams.patientId = patientId;
    }
  }, [patientId]);

  /*   const DISPENSE_STATUS_OPTIONS = {
    pending: {
      label: "pending",
    },
    history: {
      label: "history",
    },
  } as const; */

  return (
    <Page title={t("dispense_orders")}>
      <div className="mt-4">
        {isLoading ? (
          <TableSkeleton count={5} />
        ) : dispenseOrderQueue?.results?.length === 0 ? (
          <EmptyState
            icon={
              <CareIcon
                icon="l-prescription-bottle"
                className="text-primary size-6"
              />
            }
            title={t("no_dispense_orders_found")}
            description={t("no_dispense_orders_found_description")}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("patient_name")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead>{t("location")}</TableHead>
                <TableHead>{t("action")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dispenseOrderQueue?.results?.map((item: DispenseOrderRead) => (
                <TableRow key={item.id}>
                  <TableCell className="font-semibold">
                    {item.patient.name}
                    <div className="text-xs text-gray-500">
                      {t("created_at")}: {formatDateTime(item.created_date)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={DISPENSE_ORDER_STATUS_STYLES[item.status]}>
                      {t(`dispense_order_status__${item.status}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="font-medium">{item.location.name}</div>
                    <div className="text-xs text-gray-500">
                      {item.location.description}
                    </div>
                  </TableCell>

                  <TableCell>
                    <Button
                      variant="outline"
                      className="font-semibold"
                      onClick={() => {
                        navigate(
                          `/facility/${facilityId}/locations/${locationId}/medication_dispense/order/${item.id}/preparation`,
                        );
                      }}
                    >
                      <ArrowUpRightSquare strokeWidth={1.5} />
                      {t("view_order")}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
      <div className="mt-8 flex justify-center">
        <Pagination totalCount={dispenseOrderQueue?.count || 0} />
      </div>
    </Page>
  );
}
