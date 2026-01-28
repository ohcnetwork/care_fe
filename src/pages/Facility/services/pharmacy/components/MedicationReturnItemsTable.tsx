import { useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDate } from "date-fns";
import { EllipsisVertical } from "lucide-react";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import CareIcon from "@/CAREUI/icons/CareIcon";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/Common/Table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { DeliveryOrderStatus } from "@/types/inventory/deliveryOrder/deliveryOrder";
import {
  SUPPLY_DELIVERY_CONDITION_COLORS,
  SUPPLY_DELIVERY_STATUS_COLORS,
  SupplyDeliveryRead,
  SupplyDeliveryStatus,
} from "@/types/inventory/supplyDelivery/supplyDelivery";
import supplyDeliveryApi from "@/types/inventory/supplyDelivery/supplyDeliveryApi";
import { round } from "@/Utils/decimal";
import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";
import mutate from "@/Utils/request/mutate";

interface MedicationReturnItemsTableProps {
  deliveries: SupplyDeliveryRead[];
  showCheckbox?: boolean;
  selectedDeliveries?: string[];
  onDeliverySelect?: (deliveryId: string, checked: boolean) => void;
  onSelectAll?: (checked: boolean) => void;
  deliveryOrderStatus?: DeliveryOrderStatus;
  autoSelectOnMount?: boolean;
}

export function MedicationReturnItemsTable({
  deliveries,
  showCheckbox = false,
  selectedDeliveries = [],
  onDeliverySelect,
  onSelectAll,
  deliveryOrderStatus,
  autoSelectOnMount = false,
}: MedicationReturnItemsTableProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { mutate: updateDeliveryStatus } = useMutation({
    mutationFn: ({
      deliveryId,
      status,
      extensions,
    }: {
      deliveryId: string;
      status: SupplyDeliveryStatus;
      extensions: Record<string, unknown>;
    }) => {
      return mutate(supplyDeliveryApi.updateSupplyDelivery, {
        pathParams: { supplyDeliveryId: deliveryId },
      })({ status, extensions: extensions || {} });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplyDeliveries"] });
      toast.success(t("status_updated_successfully"));
    },
  });

  const inProgressDeliveries = deliveries.filter(
    (d) => d.status === SupplyDeliveryStatus.in_progress,
  );

  const allInProgressSelected =
    inProgressDeliveries.length > 0 &&
    inProgressDeliveries.every((d) => selectedDeliveries.includes(d.id));

  const showAllCheckbox =
    showCheckbox &&
    deliveries.some((d) => d.status === SupplyDeliveryStatus.in_progress);

  const showActionsColumn =
    deliveryOrderStatus === DeliveryOrderStatus.draft &&
    inProgressDeliveries.length > 0;

  const didAutoSelectRef = useRef(false);
  useEffect(() => {
    if (!autoSelectOnMount) return;
    if (!showAllCheckbox) return;
    if (didAutoSelectRef.current) return;
    if (selectedDeliveries.length > 0) return;

    onSelectAll?.(true);
    didAutoSelectRef.current = true;
  }, [
    autoSelectOnMount,
    showAllCheckbox,
    onSelectAll,
    selectedDeliveries.length,
  ]);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {showAllCheckbox && (
            <TableHead className="w-10">
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
          <TableHead>{t("batch")}</TableHead>
          <TableHead>{t("quantity")}</TableHead>
          <TableHead>{t("date")}</TableHead>
          <TableHead>{t("status")}</TableHead>
          <TableHead>{t("condition")}</TableHead>
          {showActionsColumn && (
            <TableHead className="w-20">{t("actions")}</TableHead>
          )}
        </TableRow>
      </TableHeader>
      <TableBody className="text-sm">
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
            <TableCell>
              <div className="font-medium">
                {delivery.supplied_item?.product_knowledge?.name ||
                  delivery.supplied_inventory_item?.product?.product_knowledge
                    ?.name}
              </div>
            </TableCell>
            <TableCell>
              {delivery.supplied_item?.batch?.lot_number ||
                delivery.supplied_inventory_item?.product?.batch?.lot_number ||
                "-"}
            </TableCell>
            <TableCell>{round(delivery.supplied_item_quantity)}</TableCell>
            <TableCell>
              {delivery.created_date &&
                formatDate(new Date(delivery.created_date), "dd/MM/yyyy")}
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
            {showActionsColumn && (
              <TableCell>
                {delivery.status === SupplyDeliveryStatus.in_progress && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label={t("actions")}
                      >
                        <EllipsisVertical className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Button
                          variant="ghost"
                          onClick={() =>
                            updateDeliveryStatus({
                              deliveryId: delivery.id,
                              status: SupplyDeliveryStatus.entered_in_error,
                              extensions: delivery.extensions,
                            })
                          }
                          className="w-full flex justify-stretch"
                        >
                          <CareIcon icon="l-exclamation-circle" />
                          <span>{t("mark_as_entered_in_error")}</span>
                        </Button>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Button
                          variant="ghost"
                          onClick={() =>
                            updateDeliveryStatus({
                              deliveryId: delivery.id,
                              status: SupplyDeliveryStatus.abandoned,
                              extensions: delivery.extensions,
                            })
                          }
                          className="w-full flex justify-stretch"
                        >
                          <CareIcon icon="l-ban" />
                          <span>{t("mark_as_abandoned")}</span>
                        </Button>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
