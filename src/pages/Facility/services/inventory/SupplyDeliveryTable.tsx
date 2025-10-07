import { formatDate } from "date-fns";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { MonetaryDisplay } from "@/components/ui/monetary-display";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { cn } from "@/lib/utils";
import { MonetaryComponentType } from "@/types/base/monetaryComponent/monetaryComponent";
import {
  SUPPLY_DELIVERY_CONDITION_COLORS,
  SUPPLY_DELIVERY_STATUS_COLORS,
  SupplyDeliveryRead,
  SupplyDeliveryStatus,
} from "@/types/inventory/supplyDelivery/supplyDelivery";
import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";

interface SupplyDeliveryTableProps {
  deliveries: SupplyDeliveryRead[];
  showCheckbox?: boolean;
  selectedDeliveries?: string[];
  onDeliverySelect?: (deliveryId: string, checked: boolean) => void;
  onSelectAll?: (checked: boolean) => void;
  internal?: boolean;
  onDeliveryClick?: (delivery: SupplyDeliveryRead) => void;
}

export function SupplyDeliveryTable({
  deliveries,
  showCheckbox = false,
  selectedDeliveries = [],
  onDeliverySelect,
  onSelectAll,
  internal = false,
  onDeliveryClick,
}: SupplyDeliveryTableProps) {
  const { t } = useTranslation();

  const inProgressDeliveries = deliveries.filter(
    (d) => d.status === SupplyDeliveryStatus.in_progress,
  );

  const allInProgressSelected =
    inProgressDeliveries.length > 0 &&
    inProgressDeliveries.every((d) => selectedDeliveries.includes(d.id));

  const showAllCheckbox =
    showCheckbox &&
    deliveries.some((d) => d.status === SupplyDeliveryStatus.in_progress);

  return (
    <div className="rounded-md overflow-x-auto border-2 border-white shadow-md">
      <Table className="rounded-lg border shadow-sm w-full bg-white">
        <TableHeader className="bg-gray-100">
          <TableRow className="border-b">
            {showAllCheckbox && (
              <TableHead className="border-x p-3 text-gray-700 text-sm font-medium leading-5">
                <Checkbox
                  checked={
                    allInProgressSelected && selectedDeliveries.length > 0
                  }
                  disabled={inProgressDeliveries.length === 0}
                  onCheckedChange={(checked) => {
                    onSelectAll?.(!!checked);
                  }}
                  data-shortcut-id="select-all"
                />
                <ShortcutBadge actionId="select-all" alwaysShow={false} />
              </TableHead>
            )}
            <TableHead className="border-x p-3 text-gray-700 text-sm font-medium leading-5">
              {t("item")}
            </TableHead>
            <TableHead className="border-x p-3 text-gray-700 text-sm font-medium leading-5">
              {t("requested_qty")}
            </TableHead>
            <TableHead className="border-x p-3 text-gray-700 text-sm font-medium leading-5">
              {t("received_qty")}
            </TableHead>
            <TableHead className="border-x p-3 text-gray-700 text-sm font-medium leading-5">
              {t("received_date")}
            </TableHead>
            <TableHead className="border-x p-3 text-gray-700 text-sm font-medium leading-5">
              {t("base")}
            </TableHead>
            <TableHead className="border-x p-3 text-gray-700 text-sm font-medium leading-5">
              {t("tax")}
            </TableHead>
            <TableHead className="border-x p-3 text-gray-700 text-sm font-medium leading-5">
              {t("disc")}
            </TableHead>
            <TableHead className="border-x p-3 text-gray-700 text-sm font-medium leading-5">
              {t("status")}
            </TableHead>
            <TableHead className="border-x p-3 text-gray-700 text-sm font-medium leading-5">
              {t("condition")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="bg-white">
          {deliveries.map((delivery) => (
            <TableRow key={delivery.id} className="border-b hover:bg-gray-50">
              {showAllCheckbox && (
                <TableCell className="border-x p-3 text-gray-950">
                  {delivery.status === SupplyDeliveryStatus.in_progress && (
                    <Checkbox
                      checked={selectedDeliveries.includes(delivery.id)}
                      onCheckedChange={(checked) => {
                        onDeliverySelect?.(delivery.id, !!checked);
                      }}
                    />
                  )}
                </TableCell>
              )}
              <TableCell
                className={cn(
                  "border-x p-3 text-gray-950",
                  onDeliveryClick && "cursor-pointer underline",
                )}
                onClick={() => onDeliveryClick?.(delivery)}
              >
                <div className="font-medium">
                  {internal
                    ? delivery.supplied_inventory_item?.product
                        ?.product_knowledge?.name
                    : delivery.supplied_item?.product_knowledge?.name}
                </div>
              </TableCell>
              <TableCell className="border-x p-3 text-gray-950">
                {delivery.supply_request?.quantity}
              </TableCell>
              <TableCell className="border-x p-3 text-gray-950">
                {delivery.supplied_item_quantity}
              </TableCell>
              <TableCell className="border-x p-3 text-gray-950">
                {delivery.created_date &&
                  formatDate(new Date(delivery.created_date), "dd/MM/yyyy")}
              </TableCell>
              <TableCell className="border-x p-3 text-gray-950">
                <MonetaryDisplay
                  amount={
                    delivery.supplied_inventory_item?.product.charge_item_definition.price_components.filter(
                      (c) =>
                        c.monetary_component_type ===
                        MonetaryComponentType.base,
                    )[0].amount
                  }
                />
              </TableCell>
              <TableCell className="border-x p-3 text-gray-950">
                <MonetaryDisplay
                  amount={String(
                    delivery.supplied_inventory_item?.product.charge_item_definition.price_components
                      .filter(
                        (c) =>
                          c.monetary_component_type ===
                          MonetaryComponentType.tax,
                      )
                      .reduce((acc, curr) => acc + Number(curr.amount || 0), 0),
                  )}
                  hideCurrency
                />
              </TableCell>
              <TableCell className="border-x p-3 text-gray-950">
                <MonetaryDisplay
                  amount={String(
                    delivery.supplied_inventory_item?.product.charge_item_definition.price_components
                      .filter(
                        (c) =>
                          c.monetary_component_type ===
                          MonetaryComponentType.discount,
                      )
                      .reduce((acc, curr) => acc + Number(curr.amount || 0), 0),
                  )}
                  hideCurrency
                />
              </TableCell>
              <TableCell className="border-x p-3 text-gray-950">
                <Badge variant={SUPPLY_DELIVERY_STATUS_COLORS[delivery.status]}>
                  {t(delivery.status)}
                </Badge>
              </TableCell>
              <TableCell className="border-x p-3 text-gray-950">
                {delivery.supplied_item_condition && (
                  <Badge
                    variant={
                      SUPPLY_DELIVERY_CONDITION_COLORS[
                        delivery.supplied_item_condition
                      ] as "secondary" | "destructive"
                    }
                  >
                    {t(delivery.supplied_item_condition)}
                  </Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
