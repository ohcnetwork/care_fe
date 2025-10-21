import { useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDate } from "date-fns";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/Common/Table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { MonetaryDisplay } from "@/components/ui/monetary-display";

import CareIcon from "@/CAREUI/icons/CareIcon";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { MonetaryComponentType } from "@/types/base/monetaryComponent/monetaryComponent";
import {
  SUPPLY_DELIVERY_CONDITION_COLORS,
  SUPPLY_DELIVERY_STATUS_COLORS,
  SupplyDeliveryRead,
  SupplyDeliveryStatus,
} from "@/types/inventory/supplyDelivery/supplyDelivery";
import supplyDeliveryApi from "@/types/inventory/supplyDelivery/supplyDeliveryApi";
import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";
import mutate from "@/Utils/request/mutate";
import { EllipsisVertical } from "lucide-react";

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
  const queryClient = useQueryClient();

  const { mutate: updateDeliveryStatus } = useMutation({
    mutationFn: ({
      deliveryId,
      status,
    }: {
      deliveryId: string;
      status: SupplyDeliveryStatus;
    }) => {
      return mutate(supplyDeliveryApi.updateSupplyDelivery, {
        pathParams: { supplyDeliveryId: deliveryId },
      })({ status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplyDeliveries"] });
      toast.success(t("status_updated_successfully"));
    },
  });

  const updateStatus = (
    deliveryId: string,
    newStatus: SupplyDeliveryStatus,
  ) => {
    updateDeliveryStatus({
      deliveryId,
      status: newStatus,
    });
  };

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
    <Table>
      <TableHeader>
        <TableRow>
          {showAllCheckbox && (
            <TableHead>
              <Checkbox
                checked={allInProgressSelected && selectedDeliveries.length > 0}
                disabled={inProgressDeliveries.length === 0}
                onCheckedChange={(checked) => {
                  onSelectAll?.(!!checked);
                }}
                data-shortcut-id="select-all"
              />
              <ShortcutBadge actionId="select-all" alwaysShow={false} />
            </TableHead>
          )}
          <TableHead>{t("item")}</TableHead>
          <TableHead>{t("requested_qty")}</TableHead>
          <TableHead>{t("received_qty")}</TableHead>
          <TableHead>{t("received_date")}</TableHead>
          <TableHead>{t("base")}</TableHead>
          <TableHead>{t("tax")}</TableHead>
          <TableHead>{t("disc")}</TableHead>
          <TableHead>{t("status")}</TableHead>
          <TableHead>{t("condition")}</TableHead>
          <TableHead>{t("actions")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {deliveries.map((delivery) => (
          <TableRow key={delivery.id}>
            {showAllCheckbox && (
              <TableCell>
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
              className={cn(onDeliveryClick && "cursor-pointer underline")}
              onClick={() => onDeliveryClick?.(delivery)}
            >
              <div className="font-medium">
                {internal
                  ? delivery.supplied_inventory_item?.product?.product_knowledge
                      ?.name
                  : delivery.supplied_item?.product_knowledge?.name}
              </div>
            </TableCell>
            <TableCell>{delivery.supply_request?.quantity}</TableCell>
            <TableCell>{delivery.supplied_item_quantity}</TableCell>
            <TableCell>
              {delivery.created_date &&
                formatDate(new Date(delivery.created_date), "dd/MM/yyyy")}
            </TableCell>
            <TableCell>
              <MonetaryDisplay
                amount={
                  delivery.supplied_inventory_item?.product.charge_item_definition?.price_components.filter(
                    (c) =>
                      c.monetary_component_type === MonetaryComponentType.base,
                  )[0].amount
                }
              />
            </TableCell>
            <TableCell>
              <MonetaryDisplay
                amount={String(
                  delivery.supplied_inventory_item?.product.charge_item_definition?.price_components
                    .filter(
                      (c) =>
                        c.monetary_component_type === MonetaryComponentType.tax,
                    )
                    .reduce((acc, curr) => acc + Number(curr.amount || 0), 0),
                )}
                hideCurrency
              />
            </TableCell>
            <TableCell>
              <MonetaryDisplay
                amount={String(
                  delivery.supplied_inventory_item?.product.charge_item_definition?.price_components
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
            <TableCell>
              <Badge variant={SUPPLY_DELIVERY_STATUS_COLORS[delivery.status]}>
                {t(delivery.status)}
              </Badge>
            </TableCell>
            <TableCell>
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
            <TableCell className="text-center">
              {delivery.status === SupplyDeliveryStatus.in_progress ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <EllipsisVertical className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Button
                        variant="ghost"
                        onClick={() =>
                          updateStatus(
                            delivery.id,
                            SupplyDeliveryStatus.entered_in_error,
                          )
                        }
                        className="w-full flex flex-row self-center"
                      >
                        <CareIcon icon="l-exclamation-circle" />
                        <span>{t("mark_as_entered_in_error")}</span>
                      </Button>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Button
                        variant="ghost"
                        onClick={() =>
                          updateStatus(
                            delivery.id,
                            SupplyDeliveryStatus.abandoned,
                          )
                        }
                        className="w-full flex flex-row justify-stretch items-center"
                      >
                        <CareIcon icon="l-ban" />
                        {t("mark_as_abandoned")}
                      </Button>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                "-"
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
