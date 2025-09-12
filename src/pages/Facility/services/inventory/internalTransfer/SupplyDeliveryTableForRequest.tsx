import { formatDate } from "date-fns";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { TableSkeleton } from "@/components/Common/SkeletonLoading";

import { EmptyState } from "@/components/ui/empty-state";
import {
  SUPPLY_DELIVERY_STATUS_COLORS,
  SupplyDeliveryRead,
} from "@/types/inventory/supplyDelivery/supplyDelivery";

interface Props {
  deliveries: SupplyDeliveryRead[];
  isLoading?: boolean;
  mode?: "internal" | "external";
}

export default function SupplyDeliveryTableForRequest({
  deliveries,
  isLoading = false,
  mode = "internal",
}: Props) {
  const { t } = useTranslation();

  if (isLoading) {
    return <TableSkeleton count={5} />;
  }

  if (deliveries.length === 0) {
    return (
      <EmptyState
        title={t("no_deliveries_dispatched_for_this_supply_request", {
          action:
            mode === "external" ? t("purchase_order") : t("stock_request"),
        })}
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-md border-2 border-white shadow-md">
      <Table className="rounded-md">
        <TableHeader className="bg-gray-100 text-gray-700 text-sm">
          <TableRow className="divide-x">
            <TableHead className="text-gray-700">
              {t("item_received")}
            </TableHead>
            <TableHead className="text-gray-700">
              {t("quantity_received")}
            </TableHead>
            <TableHead className="text-gray-700">{t("lot")}</TableHead>
            <TableHead className="text-gray-700">{t("expiry")}</TableHead>
            <TableHead className="text-gray-700">{t("condition")}</TableHead>
            <TableHead className="text-gray-700">{t("delivered_by")}</TableHead>
            <TableHead className="text-gray-700">{t("status")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="bg-white text-base">
          {deliveries.map((delivery: SupplyDeliveryRead) => (
            <TableRow key={delivery.id} className="hover:bg-gray-50 divide-x">
              <TableCell className="font-semibold text-gray-950">
                {delivery.supplied_item?.product_knowledge.name ||
                  delivery.supplied_inventory_item?.product?.product_knowledge
                    .name}
              </TableCell>
              <TableCell className="font-medium text-gray-950">
                {delivery.supplied_item_quantity}{" "}
                {delivery.supplied_item?.product_knowledge.base_unit.display ||
                  delivery.supplied_inventory_item?.product?.product_knowledge
                    .base_unit.display}
              </TableCell>
              <TableCell className="font-medium text-gray-950">
                {delivery.supplied_inventory_item?.product?.batch?.lot_number ||
                  delivery.supplied_item?.batch?.lot_number ||
                  "-"}
              </TableCell>
              <TableCell className="font-medium text-gray-950">
                {delivery.supplied_inventory_item?.product?.expiration_date
                  ? formatDate(
                      new Date(
                        delivery.supplied_inventory_item.product.expiration_date,
                      ),
                      "dd/MM/yyyy",
                    )
                  : delivery.supplied_item?.expiration_date
                    ? formatDate(
                        new Date(delivery.supplied_item.expiration_date),
                        "dd/MM/yyyy",
                      )
                    : "-"}
              </TableCell>
              <TableCell>
                {delivery.supplied_item_condition && (
                  <Badge
                    variant={
                      delivery.supplied_item_condition === "damaged"
                        ? "destructive"
                        : "secondary"
                    }
                    className="capitalize"
                  >
                    {t(delivery.supplied_item_condition)}
                  </Badge>
                )}
              </TableCell>
              <TableCell className="font-medium text-gray-950">
                {delivery.origin?.name || delivery.supplier?.name || "-"}
              </TableCell>
              <TableCell>
                <Badge variant={SUPPLY_DELIVERY_STATUS_COLORS[delivery.status]}>
                  {t(delivery.status)}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
