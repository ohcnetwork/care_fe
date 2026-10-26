import { useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDate, parseISO } from "date-fns";
import { Edit, EllipsisVertical, History } from "lucide-react";
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ExtensionFieldWithName,
  getExtensionFieldsWithName,
  getExtensionValue,
  groupFieldsByAnchor,
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
import { ExtensionContexts, SupplyDeliveryAnchor } from "@/Utils/schema/types";
import { dateQueryString } from "@/Utils/utils";

/** Extension anchors (x-ui.placement.after) this table renders, in column order */
const EXTENSION_ANCHORS = [
  "product",
  "batch",
  "expiry",
  "requested_quantity",
  "pack_size",
  "pack_quantity",
  "quantity",
  "date",
  "sale",
  "purchase",
  "tax",
  "discount",
  "status",
  "condition",
] as const satisfies readonly SupplyDeliveryAnchor[];

type SupplyDeliveryTableAnchor = (typeof EXTENSION_ANCHORS)[number];

/** Internal transfers hide the pack and purchase columns */
const INTERNAL_EXTENSION_ANCHORS = EXTENSION_ANCHORS.filter(
  (anchor) =>
    anchor !== "pack_size" &&
    anchor !== "pack_quantity" &&
    anchor !== "purchase",
);

interface SupplyDeliveryTableProps {
  deliveries: SupplyDeliveryRead[];
  showCheckbox?: boolean;
  selectedDeliveries?: string[];
  onDeliverySelect?: (deliveryId: string, checked: boolean) => void;
  onSelectAll?: (checked: boolean) => void;
  internal?: boolean;
  onDeliveryClick?: (delivery: SupplyDeliveryRead) => void;
  onEditDelivery?: (delivery: SupplyDeliveryRead) => void;
  editingDeliveryIds?: string[];
  deliveryOrderStatus?: DeliveryOrderStatus;
  autoSelectOnMount?: boolean;
  isRequester?: boolean;
  facilityId?: string;
  linkToProduct?: boolean;
}

function ProductLink({
  delivery,
  internal,
  linkToProduct,
  facilityId,
}: {
  delivery: SupplyDeliveryRead;
  internal: boolean;
  linkToProduct: boolean;
  facilityId?: string;
}) {
  const productId = internal
    ? delivery.supplied_inventory_item?.product?.id
    : delivery.supplied_item?.id;
  const productName = internal
    ? delivery.supplied_inventory_item?.product?.product_knowledge?.name
    : delivery.supplied_item?.product_knowledge?.name;

  if (linkToProduct && facilityId && productId) {
    return (
      <Link
        href={`/facility/${facilityId}/settings/product/${productId}`}
        className="min-w-0 flex-1 font-medium text-wrap wrap-anywhere text-gray-950 underline underline-offset-2"
        onClick={(e) => e.stopPropagation()}
        basePath="/"
      >
        {productName}
      </Link>
    );
  }
  return (
    <div className="min-w-0 flex-1 font-medium text-wrap wrap-anywhere">
      {productName}
    </div>
  );
}

export function SupplyDeliveryTable({
  deliveries,
  showCheckbox = false,
  selectedDeliveries = [],
  onDeliverySelect,
  onSelectAll,
  internal = false,
  onDeliveryClick,
  onEditDelivery,
  editingDeliveryIds = [],
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
  const allExtensions = useMemo(
    () => getExtensions(ExtensionEntityType.supply_delivery, "read"),
    [getExtensions],
  );

  // Extension columns grouped by the core column they follow (x-ui.placement)
  const extensionColumns = useMemo(
    () =>
      groupFieldsByAnchor(
        getExtensionFieldsWithName(
          allExtensions,
          ExtensionContexts.supply_delivery_table,
        ),
        internal ? INTERNAL_EXTENSION_ANCHORS : EXTENSION_ANCHORS,
      ),
    [allExtensions, internal],
  );

  const renderExtensionHeads = (fields: ExtensionFieldWithName[]) =>
    fields.map((field) => (
      <TableHead rowSpan={2} key={`${field.extensionName}-${field.name}`}>
        {field.label}
      </TableHead>
    ));
  const extensionHeadsAfter = (anchor: SupplyDeliveryTableAnchor) =>
    renderExtensionHeads(extensionColumns.at(anchor));

  // Read namespaced extension values for a delivery row
  const renderExtensionValues = (
    delivery: SupplyDeliveryRead,
    fields: ExtensionFieldWithName[],
  ) =>
    fields.map((field) => {
      const value = getExtensionValue(
        delivery.extensions as NamespacedExtensionData,
        field,
      );
      return (
        <TableCell key={`${field.extensionName}-${field.name}`}>
          {value !== undefined && value !== null ? String(value) : "-"}
        </TableCell>
      );
    });
  const extensionValuesAfter = (
    delivery: SupplyDeliveryRead,
    anchor: SupplyDeliveryTableAnchor,
  ) => renderExtensionValues(delivery, extensionColumns.at(anchor));

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
      queryClient.invalidateQueries({ queryKey: ["deliveryOrders"] });
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
  const isEditingFromMenuRef = useRef(false);
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
          <TableHead rowSpan={2}>{t("hash_tag")}</TableHead>
          <TableHead
            rowSpan={2}
            className="sticky left-0 z-20 border-r border-gray-200 bg-gray-100 shadow-[1px_0_0_0_var(--color-gray-300)]"
          >
            {t("item")}
          </TableHead>
          {extensionHeadsAfter("product")}
          <TableHead rowSpan={2}>{t("batch")}</TableHead>
          {extensionHeadsAfter("batch")}
          <TableHead rowSpan={2}>{t("expiry")}</TableHead>
          {extensionHeadsAfter("expiry")}
          <TableHead rowSpan={2}>{t("requested_qty")}</TableHead>
          {extensionHeadsAfter("requested_quantity")}
          {!internal && <TableHead rowSpan={2}>{t("pack_size")}</TableHead>}
          {extensionHeadsAfter("pack_size")}
          {!internal && <TableHead rowSpan={2}>{t("pack_qty")}</TableHead>}
          {extensionHeadsAfter("pack_quantity")}
          <TableHead rowSpan={2}>
            {isRequester ? t("received_qty") : t("dispatched_qty")}
          </TableHead>
          {extensionHeadsAfter("quantity")}
          <TableHead rowSpan={2}>
            {isRequester ? t("received_date") : t("dispatched_date")}
          </TableHead>
          {extensionHeadsAfter("date")}
          <TableHead
            colSpan={1 + informationalCodes.length}
            className="text-center border-b"
          >
            {t("sale")}
          </TableHead>
          {extensionHeadsAfter("sale")}
          {!internal && (
            <TableHead colSpan={2} className="text-center border-b">
              {t("purchase")}
            </TableHead>
          )}
          {extensionHeadsAfter("purchase")}
          <TableHead rowSpan={2}>{t("tax")}</TableHead>
          {extensionHeadsAfter("tax")}
          <TableHead rowSpan={2}>{t("disc")}</TableHead>
          {extensionHeadsAfter("discount")}
          <TableHead rowSpan={2}>{t("status")}</TableHead>
          {extensionHeadsAfter("status")}
          <TableHead rowSpan={2}>{t("condition")}</TableHead>
          {extensionHeadsAfter("condition")}
          {renderExtensionHeads(extensionColumns.trailing)}
          {showActionsColumn && (
            <TableHead
              rowSpan={2}
              className={cn(
                onEditDelivery &&
                  "sm:sticky sm:right-0 z-10 bg-gray-100 border-l",
              )}
            >
              {t("actions")}
            </TableHead>
          )}
        </TableRow>
        <TableRow>
          <TableHead>{t("item_price")}</TableHead>
          {informationalCodes.map((code) => (
            <TableHead key={code.code} className="border border-r">
              {code.display}
            </TableHead>
          ))}
          {!internal && <TableHead>{t("pr")}</TableHead>}
          {!internal && <TableHead className="border-r">{t("tpr")}</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody className="text-sm">
        {deliveries.map((delivery) => {
          const isEditing = editingDeliveryIds.includes(delivery.id);
          const isInactive =
            delivery.status === SupplyDeliveryStatus.abandoned ||
            delivery.status === SupplyDeliveryStatus.entered_in_error;
          const expiry = dateQueryString(
            delivery.supplied_inventory_item?.product?.expiration_date ||
              delivery.supplied_item?.expiration_date,
          );
          return (
            <TableRow
              key={delivery.id}
              className={cn(
                isEditing && "bg-primary-50/60 hover:bg-primary-50",
                isInactive && "bg-gray-50 hover:bg-gray-100/50",
              )}
            >
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
                className={cn(
                  "sticky left-0 z-10 border-r border-gray-200 bg-white shadow-[1px_0_0_0_var(--color-gray-300)]",
                  isEditing && "bg-primary-50",
                  isInactive && "bg-gray-50",
                )}
              >
                <div className="flex w-24 items-center gap-2 sm:w-56">
                  <ProductLink
                    delivery={delivery}
                    internal={internal}
                    linkToProduct={linkToProduct}
                    facilityId={facilityId}
                  />
                  {onDeliveryClick && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-7 shrink-0 text-gray-500"
                          aria-label={t("view_history")}
                          onClick={() => onDeliveryClick(delivery)}
                        >
                          <History className="size-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t("view_history")}</TooltipContent>
                    </Tooltip>
                  )}
                </div>
                {isEditing && (
                  <Badge
                    variant="outline"
                    className="mt-1 border-primary-200 bg-primary-50 text-primary-800"
                  >
                    {t("editing")}
                  </Badge>
                )}
              </TableCell>
              {extensionValuesAfter(delivery, "product")}
              <TableCell>
                {delivery.supplied_inventory_item?.product?.batch?.lot_number ||
                  "-"}
              </TableCell>
              {extensionValuesAfter(delivery, "batch")}
              <TableCell>
                {expiry ? formatDate(parseISO(expiry), "dd/MM/yyyy") : "-"}
              </TableCell>
              {extensionValuesAfter(delivery, "expiry")}
              <TableCell>
                {delivery.supply_request
                  ? round(delivery.supply_request.quantity)
                  : "-"}
              </TableCell>
              {extensionValuesAfter(delivery, "requested_quantity")}
              {!internal && (
                <TableCell>{delivery.supplied_item_pack_size || "-"}</TableCell>
              )}
              {extensionValuesAfter(delivery, "pack_size")}
              {!internal && (
                <TableCell>
                  {delivery.supplied_item_pack_quantity || "-"}
                </TableCell>
              )}
              {extensionValuesAfter(delivery, "pack_quantity")}
              <TableCell>{round(delivery.supplied_item_quantity)}</TableCell>
              {extensionValuesAfter(delivery, "quantity")}
              <TableCell>
                {delivery.created_date &&
                  formatDate(new Date(delivery.created_date), "dd/MM/yyyy")}
              </TableCell>
              {extensionValuesAfter(delivery, "date")}
              <TableCell>
                <MonetaryDisplay
                  amount={
                    delivery.supplied_inventory_item?.product.charge_item_definition?.price_components.filter(
                      (c) =>
                        c.monetary_component_type ===
                        MonetaryComponentType.base,
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
              {extensionValuesAfter(delivery, "sale")}
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
              {extensionValuesAfter(delivery, "purchase")}
              <TableCell>
                <MonetaryDisplay
                  factor={add(
                    ...(
                      delivery.supplied_inventory_item?.product
                        .charge_item_definition?.price_components || []
                    )
                      .filter(
                        (c) =>
                          c.monetary_component_type ===
                          MonetaryComponentType.tax,
                      )
                      .map((c) => c.factor || "0"),
                  )}
                />
              </TableCell>
              {extensionValuesAfter(delivery, "tax")}
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
              {extensionValuesAfter(delivery, "discount")}
              <TableCell>
                <Badge variant={SUPPLY_DELIVERY_STATUS_COLORS[delivery.status]}>
                  {t(delivery.status)}
                </Badge>
              </TableCell>
              {extensionValuesAfter(delivery, "status")}
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
              {extensionValuesAfter(delivery, "condition")}
              {renderExtensionValues(delivery, extensionColumns.trailing)}
              {showActionsColumn && (
                <TableCell
                  className={cn(
                    onEditDelivery &&
                      "sm:sticky sm:right-0 z-10 border-l bg-white",
                    onEditDelivery && isEditing && "bg-primary-50",
                  )}
                >
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
                      <DropdownMenuContent
                        align="end"
                        onCloseAutoFocus={(event) => {
                          if (isEditingFromMenuRef.current) {
                            event.preventDefault();
                            isEditingFromMenuRef.current = false;
                          }
                        }}
                      >
                        {onEditDelivery && (
                          <DropdownMenuItem
                            onSelect={() => {
                              isEditingFromMenuRef.current = true;
                              onEditDelivery(delivery);
                            }}
                          >
                            <Edit className="size-4" />
                            {isEditing ? t("continue_editing") : t("edit")}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem asChild disabled={isEditing}>
                          <Button
                            variant="ghost"
                            disabled={isEditing}
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
                        <DropdownMenuItem asChild disabled={isEditing}>
                          <Button
                            variant="ghost"
                            disabled={isEditing}
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
          );
        })}
      </TableBody>
    </Table>
  );
}
