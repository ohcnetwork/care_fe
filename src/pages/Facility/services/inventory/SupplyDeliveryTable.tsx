import { useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDate } from "date-fns";
import { useEffect, useMemo, useRef } from "react";
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
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import { MonetaryComponentType } from "@/types/base/monetaryComponent/monetaryComponent";
import { DeliveryOrderStatus } from "@/types/inventory/deliveryOrder/deliveryOrder";
import {
  SUPPLY_DELIVERY_CONDITION_COLORS,
  SUPPLY_DELIVERY_STATUS_COLORS,
  SupplyDeliveryRead,
  SupplyDeliveryStatus,
} from "@/types/inventory/supplyDelivery/supplyDelivery";
import supplyDeliveryApi from "@/types/inventory/supplyDelivery/supplyDeliveryApi";
import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";
import mutate from "@/Utils/request/mutate";
import { extractSchemaInfo } from "@/Utils/schema/extensionSchema";
import { EllipsisVertical } from "lucide-react";

interface SupplyDeliveryTableProps {
  deliveries: SupplyDeliveryRead[];
  showCheckbox?: boolean;
  selectedDeliveries?: string[];
  onDeliverySelect?: (deliveryId: string, checked: boolean) => void;
  onSelectAll?: (checked: boolean) => void;
  internal?: boolean;
  onDeliveryClick?: (delivery: SupplyDeliveryRead) => void;
  deliveryOrderStatus?: DeliveryOrderStatus;
  autoSelectOnMount?: boolean;
  isRequester?: boolean;
}

export function SupplyDeliveryTable({
  deliveries,
  showCheckbox = false,
  selectedDeliveries = [],
  onDeliverySelect,
  onSelectAll,
  internal = false,
  onDeliveryClick,
  deliveryOrderStatus,
  autoSelectOnMount = false,
  isRequester = false,
}: SupplyDeliveryTableProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { facility } = useCurrentFacility();

  const informationalCodes = facility?.instance_informational_codes || [];

  // Extract extension field metadata for table headers
  const { fieldMetadata: extensionFields } = useMemo(
    () => extractSchemaInfo(facility?.extensions_schema_supply_delivery),
    [facility?.extensions_schema_supply_delivery],
  );

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
          <TableHead>
            {isRequester ? t("received_qty") : t("dispatched_qty")}
          </TableHead>
          <TableHead>
            {isRequester ? t("received_date") : t("dispatched_date")}
          </TableHead>
          <TableHead>{t("base")}</TableHead>
          {informationalCodes.map((code) => (
            <TableHead key={code.code}>{code.display}</TableHead>
          ))}
          <TableHead>{t("tax")}</TableHead>
          <TableHead>{t("disc")}</TableHead>
          <TableHead>{t("status")}</TableHead>
          <TableHead>{t("condition")}</TableHead>
          {extensionFields.map((field) => (
            <TableHead key={field.name}>{field.label}</TableHead>
          ))}
          {showActionsColumn && <TableHead>{t("actions")}</TableHead>}
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
            <TableCell>{delivery.supply_request?.quantity || "-"}</TableCell>
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
                  )[0]?.amount
                }
              />
            </TableCell>
            {informationalCodes.map((code) => {
              const informationalComponent =
                delivery.supplied_inventory_item?.product.charge_item_definition?.price_components.find(
                  (c) =>
                    c.monetary_component_type ===
                      MonetaryComponentType.informational &&
                    c.code?.code === code.code,
                );
              return (
                <TableCell key={code.code}>
                  {informationalComponent?.amount && (
                    <MonetaryDisplay amount={informationalComponent.amount} />
                  )}
                </TableCell>
              );
            })}
            <TableCell>
              <MonetaryDisplay
                factor={
                  delivery.supplied_inventory_item?.product.charge_item_definition?.price_components
                    .filter(
                      (c) =>
                        c.monetary_component_type === MonetaryComponentType.tax,
                    )
                    .reduce((sum, c) => sum + (c.factor || 0), 0) || undefined
                }
              />
            </TableCell>
            <TableCell>
              {(() => {
                const discountComponents =
                  delivery.supplied_inventory_item?.product.charge_item_definition?.price_components?.filter(
                    (c) =>
                      c.monetary_component_type ===
                      MonetaryComponentType.discount,
                  );

                return discountComponents?.map((component, index) => (
                  <div key={index}>
                    <MonetaryDisplay {...component} />
                  </div>
                ));
              })()}
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
            {extensionFields.map((field) => {
              const value = (
                delivery.extensions as Record<string, unknown> | undefined
              )?.[field.name];
              return (
                <TableCell key={field.name}>
                  {value !== undefined && value !== null ? String(value) : "-"}
                </TableCell>
              );
            })}
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
