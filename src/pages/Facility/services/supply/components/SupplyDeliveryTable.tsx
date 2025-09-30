import { formatDate } from "date-fns";
import { navigate, useQueryParams } from "raviger";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { TableSkeleton } from "@/components/Common/SkeletonLoading";

import { makeUrl } from "@/Utils/request/utils";
import { SupplyDeliveryTab } from "@/pages/Facility/services/supply/SupplyDeliveryList";
import {
  SUPPLY_DELIVERY_CONDITION_COLORS,
  SUPPLY_DELIVERY_STATUS_COLORS,
  SupplyDeliveryRead,
} from "@/types/inventory/supplyDelivery/supplyDelivery";

interface Props {
  deliveries: SupplyDeliveryRead[];
  isLoading: boolean;
  facilityId: string;
  locationId: string;
  tab?: SupplyDeliveryTab;
  showSupplier?: boolean;
  showDate?: boolean;
}

export default function SupplyDeliveryTable({
  deliveries,
  isLoading,
  facilityId,
  locationId,
  tab,
  showSupplier = false,
  showDate = false,
}: Props) {
  const { t } = useTranslation();
  const [qParams] = useQueryParams();

  if (isLoading) {
    return <TableSkeleton count={5} />;
  }

  if (deliveries.length === 0) {
    return (
      <EmptyState
        title={t("no_supply_deliveries_found")}
        description={t("no_supply_deliveries_found_description")}
        icon={<CareIcon icon="l-box" className="text-primary size-6" />}
      />
    );
  }

  return (
    <div className="rounded-md overflow-hidden border-2 border-white shadow-md">
      <Table>
        <TableHeader className="bg-gray-100">
          <TableRow className="divide-x">
            <TableHead className="text-gray-700">{t("item")}</TableHead>
            <TableHead className="text-gray-700">{t("quantity")}</TableHead>
            {showSupplier && (
              <TableHead className="text-gray-700">
                <div className="max-w-[200px] break-words">{t("supplier")}</div>
              </TableHead>
            )}
            {showDate && (
              <TableHead className="text-gray-700">
                {t("received_date")}
              </TableHead>
            )}
            <TableHead className="text-gray-700">{t("condition")}</TableHead>
            {tab != null && (
              <TableHead className="text-gray-700">
                {tab === SupplyDeliveryTab.INCOMING
                  ? t("origin")
                  : t("destination")}
              </TableHead>
            )}
            <TableHead className="text-gray-700">{t("status")}</TableHead>
            <TableHead className="w-[100px] text-gray-700">
              {t("actions")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="bg-white">
          {deliveries.map((delivery: SupplyDeliveryRead) => (
            <TableRow key={delivery.id} className="divide-x">
              <TableCell className="font-semibold text-gray-950">
                {delivery.supplied_item?.product_knowledge.name ||
                  delivery.supplied_inventory_item?.product.product_knowledge
                    .name}
                <div className="flex flex-row gap-1">
                  {delivery.supplied_item?.batch && (
                    <div className="text-xs text-gray-500 font-semibold ">
                      Lot #{delivery.supplied_item.batch.lot_number}
                    </div>
                  )}
                  {delivery.supplied_inventory_item?.product.batch && (
                    <div className="text-xs text-gray-500 font-normal">
                      Exp. #
                      {
                        delivery.supplied_inventory_item?.product.batch
                          .lot_number
                      }
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell className="font-medium text-gray-950">
                {delivery.supplied_item_quantity}
              </TableCell>
              {showSupplier && (
                <TableCell>
                  <div className="flex flex-col gap-1 justify-center">
                    <span className="text-gray-500">
                      {delivery.supplier?.name}
                    </span>
                  </div>
                </TableCell>
              )}
              {showDate && delivery.created_date && (
                <TableCell>
                  {formatDate(delivery.created_date, "dd MMM yyyy")}
                </TableCell>
              )}
              <TableCell>
                {delivery.supplied_item_condition && (
                  <Badge
                    variant={
                      SUPPLY_DELIVERY_CONDITION_COLORS[
                        delivery.supplied_item_condition
                      ]
                    }
                    className="capitalize"
                  >
                    {t(delivery.supplied_item_condition)}
                  </Badge>
                )}
              </TableCell>
              {tab != null && (
                <TableCell className="font-medium text-gray-950">
                  {tab === SupplyDeliveryTab.INCOMING
                    ? delivery.origin?.name
                    : delivery.destination.name}
                </TableCell>
              )}
              <TableCell>
                <Badge
                  variant={SUPPLY_DELIVERY_STATUS_COLORS[delivery.status]}
                  className="capitalize"
                >
                  {t(delivery.status)}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="font-semibold text-gray-950"
                    onClick={() =>
                      navigate(
                        makeUrl(
                          `/facility/${facilityId}/locations/${locationId}/external_supply/deliveries/${delivery.id}`,
                          qParams,
                        ),
                      )
                    }
                  >
                    <CareIcon icon="l-eye" className="size-4" />
                    {t("view_details")}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
