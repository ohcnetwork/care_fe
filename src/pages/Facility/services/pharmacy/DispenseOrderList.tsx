import { useQuery } from "@tanstack/react-query";
import { ArrowUpRightSquare } from "lucide-react";
import { navigate } from "raviger";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import MultiFilter from "@/components/ui/multi-filter/MultiFilter";
import useMultiFilterState from "@/components/ui/multi-filter/utils/useMultiFilterState";
import { createFilterConfig } from "@/components/ui/multi-filter/utils/Utils";

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

export default function DispenseOrderList({
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

  const filters = useMemo(
    () => [
      createFilterConfig(
        "status",
        t("status"),
        "command",
        Object.values(DispenseOrderStatus).map((status) => ({
          value: status,
          label: t(`dispense_order_status__${status}`),
          color: DISPENSE_ORDER_STATUS_STYLES[status] as string,
        })),
      ),
    ],
    [],
  );

  const onFilterUpdate = (query: Record<string, unknown>) => {
    updateQuery(query);
  };

  const {
    selectedFilters,
    handleFilterChange,
    handleOperationChange,
    handleClearAll,
    handleClearFilter,
  } = useMultiFilterState(filters, onFilterUpdate, {
    ...qParams,
    status: qParams.status ? [qParams.status] : undefined,
  });

  const { data: dispenseOrderQueue, isLoading } = useQuery({
    queryKey: ["dispenseOrderQueue", facilityId, locationId, qParams],
    queryFn: query.debounced(dispenseOrderApi.list, {
      pathParams: { facilityId },
      queryParams: {
        location: locationId,
        status: qParams.status,
        limit: resultsPerPage,
        offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
      },
    }),
  });

  return (
    <Page title={t("dispense_orders")}>
      {/* Filters */}
      <div className="flex flex-col md:flex-row items-start gap-2 mt-6">
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

      {/* Table section */}
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
                <TableHead>{t("order_name")}</TableHead>
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
                      {t("created_at")}:{" "}
                      {formatDateTime(item.patient.created_date)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{item.name}</div>
                    {item.note && (
                      <div className="text-xs text-gray-500">{item.note}</div>
                    )}
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
                          `/facility/${facilityId}/locations/${locationId}/dispense_orders/${item.id}`,
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
