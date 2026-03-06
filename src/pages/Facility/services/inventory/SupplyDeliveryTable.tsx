import { useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDate } from "date-fns";
import { EllipsisVertical } from "lucide-react";
import { Link } from "raviger";
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
import {
  getExtensionFieldsWithName,
  getExtensionValue,
  NamespacedExtensionData,
} from "@/hooks/useExtensions";
import useExtensionSchemas from "@/hooks/useExtensionSchemas";
import { cn } from "@/lib/utils";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import { MonetaryComponentType } from "@/types/base/monetaryComponent/monetaryComponent";
import { ExtensionEntityType } from "@/types/extensions/extensions";
import { DeliveryOrderStatus } from "@/types/inventory/deliveryOrder/deliveryOrder";
import {
  ACTIVE_SUPPLY_DELIVERY_STATUSES,
  SUPPLY_DELIVERY_CONDITION_COLORS,
  SUPPLY_DELIVERY_STATUS_COLORS,
  SupplyDeliveryRead,
  SupplyDeliveryStatus,
} from "@/types/inventory/supplyDelivery/supplyDelivery";
import supplyDeliveryApi from "@/types/inventory/supplyDelivery/supplyDeliveryApi";
import { add, round } from "@/Utils/decimal";
import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";
import mutate from "@/Utils/request/mutate";

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
  facilityId?: string;
  linkToProduct?: boolean;
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
  facilityId,
  linkToProduct = false,
}: SupplyDeliveryTableProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { facility } = useCurrentFacility();
  const { getExtensions } = useExtensionSchemas();

  const informationalCodes = facility?.instance_informational_codes || [];

  // Get extensions and extract field metadata with owner info for table headers
  const allExtensions = getExtensions(
    ExtensionEntityType.supply_delivery,
    "read",
  );

  // Get field metadata with extension name for reading namespaced values
  const extensionFields = useMemo(
    () => getExtensionFieldsWithName(allExtensions),
    [allExtensions],
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

  // Build a map of delivery id -> serial number for non-cancelled deliveries
  const serialNumberMap = useMemo(() => {
    const map = new Map<string, number>();
    let serial = 1;
    for (const delivery of deliveries) {
      if (
        ACTIVE_SUPPLY_DELIVERY_STATUSES.includes(
          delivery.status as (typeof ACTIVE_SUPPLY_DELIVERY_STATUSES)[number],
        )
      ) {
        map.set(delivery.id, serial++);
      }
    }
    return map;
  }, [deliveries]);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {showAllCheckbox && (
            <TableHead rowSpan={2}>
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
          <TableHead rowSpan={2}>{t("#")}</TableHead>
          <TableHead rowSpan={2}>{t("item")}</TableHead>
          <TableHead rowSpan={2}>{t("batch")}</TableHead>
          <TableHead rowSpan={2}>{t("requested_qty")}</TableHead>
          {!internal && <TableHead rowSpan={2}>{t("pack_size")}</TableHead>}
          {!internal && <TableHead rowSpan={2}>{t("pack_qty")}</TableHead>}
          <TableHead rowSpan={2}>
            {isRequester ? t("received_qty") : t("dispatched_qty")}
          </TableHead>
          <TableHead rowSpan={2}>
            {isRequester ? t("received_date") : t("dispatched_date")}
          </TableHead>
          <TableHead
            colSpan={1 + informationalCodes.length}
            className="text-center border-b"
          >
            {t("sale")}
          </TableHead>
          {!internal && (
            <TableHead colSpan={2} className="text-center border-b">
              {t("purchase")}
            </TableHead>
          )}
          <TableHead rowSpan={2}>{t("tax")}</TableHead>
          <TableHead rowSpan={2}>{t("disc")}</TableHead>
          <TableHead rowSpan={2}>{t("status")}</TableHead>
          <TableHead rowSpan={2}>{t("condition")}</TableHead>
          {extensionFields.map((field) => (
            <TableHead rowSpan={2} key={`${field.extensionName}-${field.name}`}>
              {field.label}
            </TableHead>
          ))}
          {showActionsColumn && (
            <TableHead rowSpan={2}>{t("actions")}</TableHead>
          )}
        </TableRow>
        <TableRow>
          <TableHead>{t("item_price")}</TableHead>
          {informationalCodes.map((code) => (
            <TableHead key={code.code}>{code.display}</TableHead>
          ))}
          {!internal && <TableHead className="border-r">{t("pr")}</TableHead>}
          {!internal && <TableHead>{t("tpr")}</TableHead>}
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
            <TableCell>{serialNumberMap.get(delivery.id)}</TableCell>
            <TableCell
              className={cn(onDeliveryClick && "cursor-pointer underline")}
              onClick={() => onDeliveryClick?.(delivery)}
            >
              {(() => {
                const productId = internal
                  ? delivery.supplied_inventory_item?.product?.id
                  : delivery.supplied_item?.id;
                const productName = internal
                  ? delivery.supplied_inventory_item?.product?.product_knowledge
                      ?.name
                  : delivery.supplied_item?.product_knowledge?.name;

                if (linkToProduct && facilityId && productId) {
                  return (
                    <Link
                      href={`/facility/${facilityId}/settings/product/${productId}`}
                      className="font-medium text-primary-600 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                      basePath="/"
                    >
                      {productName}
                    </Link>
                  );
                }
                return <div className="font-medium">{productName}</div>;
              })()}
            </TableCell>
            <TableCell>
              {delivery.supplied_inventory_item?.product?.batch?.lot_number ||
                "-"}
            </TableCell>
            <TableCell>
              {delivery.supply_request
                ? round(delivery.supply_request.quantity)
                : "-"}
            </TableCell>
            {!internal && (
              <TableCell>{delivery.supplied_item_pack_size || "-"}</TableCell>
            )}
            {!internal && (
              <TableCell>
                {delivery.supplied_item_pack_quantity || "-"}
              </TableCell>
            )}
            <TableCell>{round(delivery.supplied_item_quantity)}</TableCell>
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
            {!internal && (
              <TableCell>
                <MonetaryDisplay
                  amount={delivery.supplied_item?.purchase_price}
                />
              </TableCell>
            )}
            {!internal && (
              <TableCell>
                <MonetaryDisplay amount={delivery.total_purchase_price} />
              </TableCell>
            )}
            <TableCell>
              <MonetaryDisplay
                factor={add(
                  ...(
                    delivery.supplied_inventory_item?.product
                      .charge_item_definition?.price_components || []
                  )
                    .filter(
                      (c) =>
                        c.monetary_component_type === MonetaryComponentType.tax,
                    )
                    .map((c) => c.factor || "0"),
                )}
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
              const value = getExtensionValue(
                delivery.extensions as NamespacedExtensionData,
                field.extensionName,
                field.name,
              );
              return (
                <TableCell key={`${field.extensionName}-${field.name}`}>
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
