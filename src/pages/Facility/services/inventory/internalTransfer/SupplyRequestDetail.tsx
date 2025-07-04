import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDate } from "date-fns";
import { MoreVertical } from "lucide-react";
import { Link } from "raviger";
import { useQueryParams } from "raviger";
import React, { useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import BackButton from "@/components/Common/BackButton";
import ConfirmActionDialog from "@/components/Common/ConfirmActionDialog";
import Page from "@/components/Common/Page";
import { TableSkeleton } from "@/components/Common/SkeletonLoading";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { makeUrl } from "@/Utils/request/utils";
import {
  SUPPLY_DELIVERY_STATUS_COLORS,
  SupplyDeliveryRead,
} from "@/types/inventory/supplyDelivery/supplyDelivery";
import supplyDeliveryApi from "@/types/inventory/supplyDelivery/supplyDeliveryApi";
import {
  SUPPLY_REQUEST_PRIORITY_COLORS,
  SUPPLY_REQUEST_STATUS_COLORS,
} from "@/types/inventory/supplyRequest/supplyRequest";
import {
  SupplyRequestCreate,
  SupplyRequestStatus,
} from "@/types/inventory/supplyRequest/supplyRequest";
import supplyRequestApi from "@/types/inventory/supplyRequest/supplyRequestApi";

const statusUpdateConfig: Partial<
  Record<
    SupplyRequestStatus,
    {
      labelKey: string;
      actionTextKey: string;
      variant?: "primary" | "destructive" | "default";
    }
  >
> = {
  [SupplyRequestStatus.suspended]: {
    labelKey: "suspend",
    actionTextKey: "suspend_this_request",
    variant: "destructive",
  },
  [SupplyRequestStatus.cancelled]: {
    labelKey: "cancel",
    actionTextKey: "cancel_this_request",
    variant: "destructive",
  },
  [SupplyRequestStatus.entered_in_error]: {
    labelKey: "mark_as_error",
    actionTextKey: "mark_this_as_error",
    variant: "destructive",
  },
  [SupplyRequestStatus.active]: {
    labelKey: "mark_as_active",
    actionTextKey: "activate_this_request",
    variant: "primary",
  },
  [SupplyRequestStatus.draft]: {
    labelKey: "move_to_draft",
    actionTextKey: "move_this_to_draft",
    variant: "primary",
  },
};

interface Props {
  facilityId: string;
  locationId: string;
  id: string;
  mode: "internal" | "external";
}

export default function SupplyRequestDetail({
  facilityId,
  locationId,
  id,
  mode,
}: Props) {
  const { t } = useTranslation();
  const [qParams] = useQueryParams();
  const queryClient = useQueryClient();
  const [dialog, setDialog] = useState<{
    open: boolean;
    title: string;
    description: React.ReactNode;
    onConfirm: () => void;
    variant: "primary" | "destructive" | "default" | "outline_primary";
  }>({
    open: false,
    title: "",
    description: "",
    onConfirm: () => {},
    variant: "primary",
  });

  const { data: supplyRequest, isLoading } = useQuery({
    queryKey: ["supplyRequest", id],
    queryFn: query(supplyRequestApi.retrieveSupplyRequest, {
      pathParams: { supplyRequestId: id },
    }),
    enabled: !!id,
  });

  const { data: deliveriesResponse, isLoading: deliveriesLoading } = useQuery({
    queryKey: ["deliveries", id],
    queryFn: query(supplyDeliveryApi.listSupplyDelivery, {
      queryParams: { supply_request: id },
    }),
    enabled: !!id,
  });

  const deliveries = deliveriesResponse?.results || [];

  const { mutate: updateSupplyRequest } = useMutation({
    mutationFn: mutate(supplyRequestApi.updateSupplyRequest, {
      pathParams: { supplyRequestId: id },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplyRequest", id] });
      queryClient.invalidateQueries({ queryKey: ["supplyRequests"] });
      toast.success(t("status_updated_successfully"));
      setDialog((d) => ({ ...d, open: false }));
    },
    onError: () => {
      toast.error(t("error_updating_status"));
    },
  });

  const handleStatusUpdate = (status: SupplyRequestStatus) => {
    if (!supplyRequest) return;
    const data: SupplyRequestCreate = {
      status: status,
      intent: supplyRequest.intent,
      category: supplyRequest.category,
      priority: supplyRequest.priority,
      reason: supplyRequest.reason,
      quantity: supplyRequest.quantity,
      deliver_from:
        mode === "internal" ? supplyRequest.deliver_from?.id : undefined,
      deliver_to: supplyRequest.deliver_to.id,
      item: supplyRequest.item.id,
      supplier: mode === "external" ? supplyRequest.supplier?.id : undefined,
    };
    updateSupplyRequest(data);
  };

  const openDialog = (newStatus: SupplyRequestStatus) => {
    const config = statusUpdateConfig[newStatus];
    if (!config) return;

    const isIrreversible =
      newStatus === SupplyRequestStatus.cancelled ||
      newStatus === SupplyRequestStatus.entered_in_error;

    setDialog({
      open: true,
      title: t(config.labelKey),
      description: (
        <>
          <Trans
            i18nKey="confirm_action_description"
            values={{ action: t(config.actionTextKey) }}
            components={{ 1: <strong className="text-gray-900" /> }}
          />
          {isIrreversible && (
            <p className="mt-2">{t("this_action_cannot_be_undone")}</p>
          )}
        </>
      ),
      onConfirm: () => handleStatusUpdate(newStatus),
      variant: config.variant || "destructive",
    });
  };

  const getActions = (status: SupplyRequestStatus) => {
    const availableActions: SupplyRequestStatus[] = [];
    switch (status) {
      case SupplyRequestStatus.draft:
        availableActions.push(
          SupplyRequestStatus.active,
          SupplyRequestStatus.suspended,
          SupplyRequestStatus.cancelled,
          SupplyRequestStatus.entered_in_error,
        );
        break;
      case SupplyRequestStatus.active:
        availableActions.push(
          SupplyRequestStatus.suspended,
          SupplyRequestStatus.cancelled,
          SupplyRequestStatus.entered_in_error,
        );
        break;
      case SupplyRequestStatus.suspended:
        availableActions.push(
          SupplyRequestStatus.active,
          SupplyRequestStatus.draft,
          SupplyRequestStatus.cancelled,
          SupplyRequestStatus.entered_in_error,
        );
        break;
      default:
        break;
    }
    return availableActions
      .map((newStatus) => {
        const config = statusUpdateConfig[newStatus];
        if (!config) return null;
        return {
          label: t(config.labelKey),
          action: () => openDialog(newStatus),
        };
      })
      .filter(Boolean);
  };

  const hasCompletedDelivery = deliveries.some(
    (delivery) => delivery.status === "completed",
  );

  const handleMarkAsFullyReceived = () => {
    if (!supplyRequest) return;

    setDialog({
      open: true,
      title: t("mark_as_fully_received"),
      description: (
        <>
          <Trans
            i18nKey="confirm_action_description"
            values={{
              action: t("mark_as_fully_received").toLowerCase(),
            }}
            components={{
              1: <strong className="text-gray-900" />,
            }}
          />{" "}
          {t("this_action_cannot_be_undone")}
        </>
      ),
      onConfirm: () => handleStatusUpdate(SupplyRequestStatus.completed),
      variant: "primary",
    });
  };

  if (isLoading || !supplyRequest) {
    return (
      <Page title={t("loading")} hideTitleOnPage>
        <div className="container mx-auto max-w-6xl">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg">{t("loading")}</div>
          </div>
        </div>
      </Page>
    );
  }

  const backUrl =
    mode === "external"
      ? makeUrl(
          `/facility/${facilityId}/locations/${locationId}/external_supply/purchase_orders`,
          qParams,
        )
      : qParams.from === "receive_item"
        ? makeUrl(
            `/facility/${facilityId}/locations/${locationId}/internal_transfers/to_receive/${qParams.deliveryId}`,
            qParams,
          )
        : makeUrl(
            `/facility/${facilityId}/locations/${locationId}/internal_transfers/to_receive`,
            qParams,
          );

  const actions = getActions(supplyRequest.status);

  return (
    <div className="max-w-5xl container mx-auto">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <BackButton to={backUrl} />
        </div>

        <div className="flex justify-between items-center gap-1">
          {supplyRequest.status === SupplyRequestStatus.draft && (
            <Button variant="outline" asChild className="w-full">
              <Link
                href={
                  mode === "internal"
                    ? `/internal_transfers/requests/${id}/edit`
                    : `/external_supply/purchase_orders/${id}/edit`
                }
              >
                {t("edit")}
              </Link>
            </Button>
          )}

          {actions.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="border-gray-400 shadow-sm"
                >
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {actions.map(
                  (action) =>
                    action && (
                      <DropdownMenuItem
                        key={action.label}
                        onClick={action.action}
                        className="cursor-pointer hover:bg-gray-100 focus:bg-gray-200 capitalize"
                      >
                        {action.label}
                      </DropdownMenuItem>
                    ),
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h5 className="text-lg font-bold text-gray-950">
            {t("request") + " " + t("raised")}
          </h5>
          <p className="text-gray-600">
            {t("request_raised_by")} {supplyRequest.deliver_to?.name}
            {", "}
            {`${deliveries.length} ${t("deliveries") + " " + t("have") + " " + t("been") + " " + t("received")}`}
          </p>
        </div>
        {hasCompletedDelivery &&
          (supplyRequest.status === SupplyRequestStatus.active ||
            supplyRequest.status === SupplyRequestStatus.processed) && (
            <Button
              variant="outline_primary"
              onClick={handleMarkAsFullyReceived}
              className="font-semibold"
            >
              {t("mark_as_fully_received")}
            </Button>
          )}
      </div>

      <Card className="shadow-sm rounded-md mt-4">
        <CardContent className="p-4">
          <div className="grid grid-cols-5 gap-4">
            <div>
              <p className="text-sm text-gray-700 font-medium">{t("item")}</p>
              <p className="font-semibold text-lg text-gray-950">
                {supplyRequest.item?.name}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-700 font-medium">
                {t("requested") + " " + t("quantity")}
              </p>
              <p className="font-semibold text-lg">
                {supplyRequest.quantity}{" "}
                {supplyRequest.item?.definitional?.dosage_form?.display}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-700 font-medium">
                {mode === "internal" ? t("deliver_from") : t("vendor")}
              </p>
              <p className="font-semibold text-lg text-gray-950">
                {mode === "internal"
                  ? supplyRequest.deliver_from?.name
                  : supplyRequest.supplier?.name}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-700 font-medium">
                {t("priority")}
              </p>
              <Badge
                variant={SUPPLY_REQUEST_PRIORITY_COLORS[supplyRequest.priority]}
              >
                {t(supplyRequest.priority)}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-700 font-medium">{t("status")}</p>
              <Badge
                variant={SUPPLY_REQUEST_STATUS_COLORS[supplyRequest.status]}
              >
                {t(supplyRequest.status)}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mx-4 bg-gray-100 rounded-md p-3 mt-2 text-gray-950 border border-gray-200">
        <h2 className="text-base font-semibold mb-1">
          {t("deliveries")} ({deliveries.length})
        </h2>
        {deliveriesLoading ? (
          <TableSkeleton count={5} />
        ) : deliveries.length > 0 ? (
          <div className="overflow-hidden rounded-md border-2 border-white shadow-md">
            <Table className="rounded-md">
              <TableHeader className="bg-gray-100 text-gray-700 text-sm">
                <TableRow className="divide-x">
                  <TableHead className="text-gray-700">
                    {t("item") + " " + t("received")}
                  </TableHead>
                  <TableHead className="text-gray-700">
                    {t("quantity") + " " + t("received")}
                  </TableHead>
                  <TableHead className="text-gray-700">{t("lot")}</TableHead>
                  <TableHead className="text-gray-700">{t("expiry")}</TableHead>
                  <TableHead className="text-gray-700">
                    {t("condition")}
                  </TableHead>
                  <TableHead className="text-gray-700">
                    {t("delivered_by")}
                  </TableHead>
                  <TableHead className="text-gray-700">{t("status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-white text-base">
                {deliveries.map((delivery: SupplyDeliveryRead) => (
                  <TableRow
                    key={delivery.id}
                    className="hover:bg-gray-50 divide-x"
                  >
                    <TableCell className="font-semibold text-gray-950">
                      {delivery.supplied_item?.product_knowledge.name ||
                        delivery.supplied_inventory_item?.product
                          ?.product_knowledge.name}
                    </TableCell>
                    <TableCell className="font-medium text-gray-950">
                      {delivery.supplied_item_quantity}{" "}
                      {delivery.supplied_item?.product_knowledge.definitional
                        ?.dosage_form?.display ||
                        delivery.supplied_inventory_item?.product
                          ?.product_knowledge.definitional?.dosage_form
                          ?.display}
                    </TableCell>
                    <TableCell className="font-medium text-gray-950">
                      {delivery.supplied_inventory_item?.product?.batch
                        ?.lot_number || "-"}
                    </TableCell>
                    <TableCell className="font-medium text-gray-950">
                      {delivery.supplied_inventory_item?.product
                        ?.expiration_date
                        ? formatDate(
                            new Date(
                              delivery.supplied_inventory_item.product.expiration_date,
                            ),
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
                      <Badge
                        variant={SUPPLY_DELIVERY_STATUS_COLORS[delivery.status]}
                      >
                        {t(delivery.status)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex items-center justify-center p-4 bg-white rounded-md">
            <p className="text-base text-gray-800 font-medium">
              {t("no_deliveries_dispatched_for_this_supply_request", {
                action:
                  mode === "external"
                    ? t("purchase_order")
                    : t("stock_request"),
              })}
            </p>
          </div>
        )}
      </div>
      <ConfirmActionDialog
        open={dialog.open}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
        title={dialog.title}
        description={dialog.description}
        onConfirm={dialog.onConfirm}
        variant={dialog.variant}
        confirmText={t("confirm")}
        cancelText={t("cancel")}
      />
    </div>
  );
}
