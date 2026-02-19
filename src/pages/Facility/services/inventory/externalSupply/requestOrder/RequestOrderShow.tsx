import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Box, ChevronLeft, Edit, Hash, Printer, Truck } from "lucide-react";
import { Link } from "raviger";
import { useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { toast } from "sonner";

import Page from "@/components/Common/Page";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/Common/Table";
import TagAssignmentSheet from "@/components/Tags/TagAssignmentSheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { NavTabs } from "@/components/ui/nav-tabs";
import { SupplyDeliveryTable } from "@/pages/Facility/services/inventory/SupplyDeliveryTable";

import DeliveryOrderTable from "@/pages/Facility/services/inventory/externalSupply/components/DeliveryOrderTable";
import { ProductKnowledgeSelect } from "@/pages/Facility/services/inventory/ProductKnowledgeSelect";
import { ProductKnowledgeBase } from "@/types/inventory/productKnowledge/productKnowledge";
import { AddItemsForm } from "./AddItemsForm";

import CareIcon from "@/CAREUI/icons/CareIcon";
import BackButton from "@/components/Common/BackButton";
import {
  CardListWithHeaderSkeleton,
  TableSkeleton,
} from "@/components/Common/SkeletonLoading";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import useBreakpoints from "@/hooks/useBreakpoints";
import { cn } from "@/lib/utils";
import { getInventoryBasePath } from "@/pages/Facility/services/inventory/externalSupply/utils/inventoryUtils";
import { DeliveryOrderStatus } from "@/types/inventory/deliveryOrder/deliveryOrder";
import { ProductRead } from "@/types/inventory/product/product";
import {
  REQUEST_ORDER_PRIORITY_COLORS,
  REQUEST_ORDER_STATUS_COLORS,
  RequestOrderStatus,
} from "@/types/inventory/requestOrder/requestOrder";
import requestOrderApi from "@/types/inventory/requestOrder/requestOrderApi";
import supplyDeliveryApi from "@/types/inventory/supplyDelivery/supplyDeliveryApi";
import { SUPPLY_REQUEST_STATUS_COLORS } from "@/types/inventory/supplyRequest/supplyRequest";
import supplyRequestApi from "@/types/inventory/supplyRequest/supplyRequestApi";
import { add, isPositive, round, subtract } from "@/Utils/decimal";
import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { formatDateTime, formatName } from "@/Utils/utils";
import Decimal from "decimal.js";

interface AllSupplyDeliveriesProps {
  facilityId: string;
  deliverOrderIds: string[];
  selectedProductKnowledge?: ProductKnowledgeBase;
  internal: boolean;
  isRequester: boolean;
}

function AllSupplyDeliveriesComponent({
  facilityId,
  deliverOrderIds,
  selectedProductKnowledge,
  internal,
  isRequester,
}: AllSupplyDeliveriesProps) {
  const { t } = useTranslation();

  const qParams = {
    ...(internal
      ? {
          supplied_inventory_item_product_knowledge:
            selectedProductKnowledge?.id,
        }
      : {
          supplied_item_product_knowledge: selectedProductKnowledge?.id,
        }),
  };

  const { data: allSupplyDeliveries, loading: isLoadingAllSupplyDeliveries } =
    useQueries({
      queries: deliverOrderIds.map((deliverOrderId) => ({
        queryKey: ["allSupplyDeliveries", deliverOrderId, qParams],
        queryFn: query(supplyDeliveryApi.listSupplyDelivery, {
          queryParams: {
            order: deliverOrderId,
            facility: facilityId,
            ...qParams,
          },
        }),
      })),
      combine: (results) => {
        return {
          data: results.map((result) => result.data?.results || []).flat(),
          loading: results.some((result) => result.isLoading),
        };
      },
    });

  return (
    <div className="space-y-4 max-h-[68vh] overflow-y-auto px-4 pt-4">
      {isLoadingAllSupplyDeliveries ? (
        <TableSkeleton count={3} />
      ) : allSupplyDeliveries && allSupplyDeliveries.length > 0 ? (
        <SupplyDeliveryTable
          deliveries={allSupplyDeliveries}
          internal={internal}
          isRequester={isRequester}
        />
      ) : (
        <EmptyState
          icon={<Truck className="text-primary size-5" />}
          title={t("no_deliveries_found")}
          description={t("deliveries_will_appear_here")}
        />
      )}
    </div>
  );
}

interface Props {
  facilityId: string;
  requestOrderId: string;
  internal: boolean;
  locationId: string;
}

export function RequestOrderShow({
  facilityId,
  requestOrderId,
  internal,
  locationId,
}: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedProductKnowledge, setSelectedProductKnowledge] =
    useState<ProductKnowledgeBase>();
  const [currentTab, setCurrentTab] = useState<
    "requested-items" | "deliveries" | "items-summary"
  >("requested-items");

  const showMoreAfterIndex = useBreakpoints({
    default: 1,
    xs: 3,
  });

  const { data: requestOrder, isLoading } = useQuery({
    queryKey: ["requestOrders", requestOrderId],
    queryFn: query(requestOrderApi.retrieveRequestOrder, {
      pathParams: {
        facilityId: facilityId,
        requestOrderId: requestOrderId,
      },
    }),
  });

  const isRequester = requestOrder?.destination.id === locationId;

  const { data: supplyRequests, isLoading: isLoadingSupplyRequests } = useQuery(
    {
      queryKey: ["supplyRequests", requestOrderId],
      queryFn: query.paginated(supplyRequestApi.listSupplyRequest, {
        queryParams: {
          order: requestOrderId,
        },
      }),
      enabled: !!requestOrderId && currentTab === "requested-items",
    },
  );

  const qParams = {
    request_order: requestOrderId,
    ...(isRequester && {
      status: "pending,in_progress,completed",
    }),
  };

  const { data: deliveryOrdersData, isLoading: isLoadingDeliveryOrders } =
    useQuery({
      queryKey: ["deliveryOrders", qParams],
      queryFn: query(supplyDeliveryApi.deliveryOrders, {
        queryParams: qParams,
      }),
      enabled: !!requestOrderId,
    });

  const deliveryOrders = deliveryOrdersData?.results || [];

  const pendingDeliveryOrderCount =
    deliveryOrders.filter(
      (deliveryOrder) =>
        deliveryOrder.status === DeliveryOrderStatus.pending ||
        deliveryOrder.status === DeliveryOrderStatus.draft,
    ).length || 0;

  const pendingDeliveryOrderCountBadge =
    pendingDeliveryOrderCount > 0 ? (
      <Badge variant="yellow" size="sm" className="text-xs px-2">
        {pendingDeliveryOrderCount}
      </Badge>
    ) : (
      <></>
    );

  const { mutate: updateOrder, isPending: isUpdating } = useMutation({
    mutationFn: mutate(requestOrderApi.updateRequestOrder, {
      pathParams: {
        facilityId: facilityId,
        requestOrderId: requestOrderId,
      },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["requestOrders", requestOrderId],
      });
      toast.success(t("order_updated_successfully"));
    },
    onError: (_error) => {
      toast.error(t("error_updating_order"));
    },
  });

  const { data: allSupplyDeliveries } = useQuery({
    queryKey: ["allSupplyDeliveries", requestOrderId],
    queryFn: query.paginated(supplyDeliveryApi.listSupplyDelivery, {
      queryParams: {
        facility: facilityId,
        request_order: requestOrderId,
      },
    }),
    enabled: !!requestOrderId,
  });

  const supplyDeliveriesGroupedByItem = allSupplyDeliveries?.results?.reduce(
    (acc, delivery) => {
      acc[
        delivery.supplied_inventory_item?.product?.product_knowledge?.id || ""
      ] = {
        quantity: add(
          acc[
            delivery.supplied_inventory_item?.product?.product_knowledge?.id ||
              ""
          ]?.quantity || 0,
          delivery.supplied_item_quantity,
        ),
        product: delivery.supplied_inventory_item?.product,
      };
      return acc;
    },
    {} as Record<
      string,
      { quantity: Decimal; product: ProductRead | undefined }
    >,
  );

  const supplyRequestsWithDeliveries = supplyRequests?.results?.map(
    (supplyRequest) => {
      const dispatchedQuantity =
        supplyDeliveriesGroupedByItem?.[supplyRequest.item.id]?.quantity ||
        new Decimal(0);
      return {
        ...supplyRequest,
        dispatched_quantity: dispatchedQuantity,
        remaining_quantity: subtract(
          supplyRequest.quantity,
          dispatchedQuantity,
        ),
      };
    },
  );

  function handleSupplyRequestSuccess() {
    queryClient.invalidateQueries({
      queryKey: ["supplyRequests", requestOrderId],
    });
  }

  function updateOrderStatus(status: RequestOrderStatus) {
    if (!requestOrder) return;

    updateOrder({
      ...requestOrder,
      supplier: requestOrder.supplier?.id || "",
      origin: requestOrder.origin?.id || undefined,
      destination: requestOrder.destination.id,
      status,
    });
  }

  if (isLoading) {
    return (
      <Page title={t("request_order_details")} hideTitleOnPage>
        <CardListWithHeaderSkeleton count={1} />
      </Page>
    );
  }

  if (!requestOrder) {
    return (
      <Page title={t("request_order_details")} hideTitleOnPage>
        <EmptyState
          title={t("request_order_not_found")}
          description={t(
            "the_request_order_you_are_looking_for_does_not_exist",
          )}
          action={<BackButton> {t("go_back")} </BackButton>}
        />
      </Page>
    );
  }

  const canAddSupplyRequests = requestOrder.status === RequestOrderStatus.draft;

  return (
    <Page
      title={t("request_order_details")}
      hideTitleOnPage
      shortCutContext="facility:inventory"
    >
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-4">
            <BackButton size="icon" className="shrink-0">
              <ChevronLeft />
            </BackButton>
            <div>
              <h4>{requestOrder.name}</h4>
              <p className="text-sm text-gray-700">
                <Trans
                  i18nKey="delivery_request_from_to"
                  values={{
                    from:
                      requestOrder.origin?.name ||
                      requestOrder.supplier?.name ||
                      t("origin"),
                    to: requestOrder.destination?.name || t("destination"),
                  }}
                  components={{
                    strong: <span className="font-semibold text-gray-700" />,
                  }}
                />
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" asChild>
              <Link href={`${requestOrderId}/print`}>
                <Printer className="size-4" /> {t("print")}
                <ShortcutBadge actionId="print-button" />
              </Link>
            </Button>
            {isRequester && (
              <Button variant="outline" asChild>
                <Link href={`${requestOrderId}/edit`}>
                  <Edit /> {t("edit")}
                  <ShortcutBadge actionId="edit-order" />
                </Link>
              </Button>
            )}

            {((internal && !isRequester) ||
              (!internal &&
                requestOrder.status === RequestOrderStatus.pending)) && (
              <Button variant="primary" asChild>
                <Link
                  basePath="/"
                  href={getInventoryBasePath(
                    facilityId,
                    locationId,
                    internal,
                    false,
                    isRequester,
                    `new?supplyOrder=${requestOrderId}`,
                  )}
                >
                  {t("create_delivery_order")}
                  <ShortcutBadge actionId="create-order" />
                </Link>
              </Button>
            )}

            {isRequester &&
              requestOrder.status !== RequestOrderStatus.completed &&
              requestOrder.status !== RequestOrderStatus.entered_in_error && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="border-gray-400 px-2">
                      <CareIcon icon="l-ellipsis-v" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {requestOrder.status !== RequestOrderStatus.draft && (
                      <DropdownMenuItem asChild className="text-primary-900">
                        <Button
                          variant="ghost"
                          onClick={() =>
                            updateOrderStatus(RequestOrderStatus.draft)
                          }
                          className="w-full flex flex-row justify-stretch items-center"
                          disabled={isUpdating}
                        >
                          <CareIcon icon="l-pause" className="mr-1" />
                          {t("mark_as_draft")}
                        </Button>
                      </DropdownMenuItem>
                    )}
                    {requestOrder.status === RequestOrderStatus.draft ||
                      (requestOrder.status === RequestOrderStatus.pending && (
                        <DropdownMenuItem asChild className="text-primary-900">
                          <Button
                            variant="ghost"
                            onClick={() =>
                              updateOrderStatus(RequestOrderStatus.completed)
                            }
                            className="w-full flex flex-row justify-stretch items-center"
                            disabled={isUpdating}
                          >
                            <CareIcon icon="l-play" className="mr-1" />
                            {t("mark_as_completed")}
                          </Button>
                        </DropdownMenuItem>
                      ))}
                    <DropdownMenuItem asChild className="text-primary-900">
                      <Button
                        variant="ghost"
                        onClick={() =>
                          updateOrderStatus(RequestOrderStatus.entered_in_error)
                        }
                        disabled={isUpdating}
                        className="w-full flex flex-row self-center"
                      >
                        <CareIcon
                          icon="l-exclamation-circle"
                          className="mr-1"
                        />
                        <span>{t("mark_as_entered_in_error")}</span>
                      </Button>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="text-primary-900">
                      <Button
                        variant="ghost"
                        onClick={() =>
                          updateOrderStatus(RequestOrderStatus.abandoned)
                        }
                        disabled={isUpdating}
                        className="w-full flex flex-row justify-stretch items-center"
                      >
                        <CareIcon icon="l-ban" className="mr-1" />
                        {t("mark_as_abandoned")}
                      </Button>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
          </div>
        </div>

        <Card className="border-none rounded-lg">
          <CardContent className="space-y-1 p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  {t("deliver_to")}
                </label>
                <div className="text-lg font-semibold text-gray-950">
                  {requestOrder.destination.name}
                </div>
              </div>

              {requestOrder.origin && (
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    {t("origin")}
                  </label>
                  <div className="text-lg font-semibold text-gray-950">
                    {requestOrder.origin.name}
                  </div>
                </div>
              )}

              {requestOrder.supplier && (
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    {t("supplier")}
                  </label>
                  <div className="text-lg font-semibold text-gray-950">
                    {requestOrder.supplier.name}
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700">
                  {t("priority")}
                </label>
                <div>
                  <Badge
                    className="rounded-sm"
                    variant={
                      REQUEST_ORDER_PRIORITY_COLORS[requestOrder.priority]
                    }
                  >
                    {t(requestOrder.priority)}
                  </Badge>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  {t("tags_proper")}
                </label>
                <div className="flex flex-wrap gap-1">
                  <TagAssignmentSheet
                    entityType="request_order"
                    entityId={requestOrder.id}
                    facilityId={facilityId}
                    currentTags={requestOrder.tags ?? []}
                    onUpdate={async () => {
                      await queryClient.invalidateQueries({
                        queryKey: ["requestOrders"],
                        exact: false,
                      });
                      await queryClient.refetchQueries({
                        queryKey: ["requestOrders"],
                        exact: false,
                      });
                    }}
                    trigger={
                      requestOrder.tags && requestOrder.tags.length > 0 ? (
                        <Button variant="outline" size="xs">
                          <Hash className="size-3" /> {t("tags")}
                        </Button>
                      ) : (
                        <Button variant="outline" size="xs">
                          <Hash className="size-3" /> {t("add_tags")}
                        </Button>
                      )
                    }
                  />
                  {requestOrder.tags.map((tag) => (
                    <Badge key={tag.id} variant="secondary" className="text-xs">
                      {tag.display}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  {t("status")}
                </label>
                <div>
                  <Badge
                    className="rounded-sm"
                    variant={REQUEST_ORDER_STATUS_COLORS[requestOrder.status]}
                  >
                    {t(requestOrder.status)}
                  </Badge>
                </div>
              </div>
              {requestOrder.created_by && (
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    {t("created_by")}
                  </label>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-md font-semibold text-gray-950">
                      {formatName(requestOrder.created_by)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDateTime(requestOrder.created_date)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {requestOrder.note && (
              <div className="pt-3">
                <label className="text-sm font-medium text-gray-700">
                  {t("note")}
                </label>
                <p className="text-sm whitespace-pre-wrap">
                  {requestOrder.note}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="-mt-4 mx-5 rounded-t-none shadow-none bg-gray-100">
          <CardContent className="space-y-1 px-5 py-2 grid lg:grid-cols-2 ">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  {t("category")}
                </label>
                <div className="text-base font-semibold">
                  {t(requestOrder.category)}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  {t("intent")}
                </label>
                <div className="text-base font-semibold">
                  {t(requestOrder.intent)}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  {t("reason")}
                </label>
                <div className="text-base font-semibold">
                  {t(requestOrder.reason)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Supply Requests and Deliveries Tabs */}
        <div className="pb-4">
          <NavTabs
            tabs={{
              "requested-items": {
                label: isRequester
                  ? t("requested_items")
                  : t("items_to_dispatch"),
                component: (
                  <div className="space-y-2 p-2 bg-gray-100 rounded-md border border-gray-200">
                    {isLoadingSupplyRequests ? (
                      <TableSkeleton count={3} />
                    ) : (
                      <div className="flex flex-col gap-4">
                        {/* Supply Requests Table */}
                        {supplyRequestsWithDeliveries &&
                          supplyRequestsWithDeliveries.length > 0 && (
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>{t("item")}</TableHead>
                                  <TableHead>{t("quantity")}</TableHead>
                                  <TableHead>
                                    {t("dispatched_quantity")}
                                  </TableHead>
                                  <TableHead>
                                    {t("remaining_quantity")}
                                  </TableHead>
                                  <TableHead>{t("status")}</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {supplyRequestsWithDeliveries.map(
                                  (supplyRequest) => (
                                    <TableRow key={supplyRequest.id}>
                                      <TableCell>
                                        {supplyRequest.item.name}
                                      </TableCell>
                                      <TableCell>
                                        {round(supplyRequest.quantity)}
                                      </TableCell>
                                      <TableCell>
                                        {round(
                                          supplyRequest.dispatched_quantity,
                                        )}
                                      </TableCell>
                                      <TableCell
                                        className={cn(
                                          isPositive(
                                            supplyRequest.remaining_quantity,
                                          )
                                            ? "text-red-500"
                                            : "text-green-500",
                                        )}
                                      >
                                        {round(
                                          supplyRequest.remaining_quantity,
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        <Badge
                                          variant={
                                            SUPPLY_REQUEST_STATUS_COLORS[
                                              supplyRequest.status
                                            ]
                                          }
                                        >
                                          {t(supplyRequest.status)}
                                        </Badge>
                                      </TableCell>
                                    </TableRow>
                                  ),
                                )}
                              </TableBody>
                            </Table>
                          )}

                        {/* Add New Items Form - Always show when in draft mode */}
                        {canAddSupplyRequests && (
                          <div className="">
                            <AddItemsForm
                              requestOrderId={requestOrderId}
                              onSuccess={handleSupplyRequestSuccess}
                              updateOrderStatus={updateOrderStatus}
                              disableApproveButton={
                                isUpdating ||
                                supplyRequests?.results.length === 0
                              }
                              showEmptyState={
                                supplyRequests?.results.length === 0
                              }
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ),
              },

              deliveries: {
                label: isRequester
                  ? t("deliveries_received")
                  : t("deliveries_created"),
                labelSuffix: !isRequester ? (
                  pendingDeliveryOrderCountBadge
                ) : (
                  <></>
                ),
                component: (
                  <div>
                    {isLoadingDeliveryOrders ? (
                      <TableSkeleton count={3} />
                    ) : deliveryOrders && deliveryOrders.length > 0 ? (
                      <DeliveryOrderTable
                        deliveries={deliveryOrders}
                        isLoading={false}
                        facilityId={facilityId}
                        locationId={requestOrder?.destination.id || ""}
                        internal={true}
                        isRequester={isRequester}
                      />
                    ) : (
                      <EmptyState
                        icon={<Box className="text-primary size-5" />}
                        title={t("no_delivery_orders_found")}
                        description={t("deliveries_will_appear_here")}
                      />
                    )}
                  </div>
                ),
              },

              "items-summary": {
                label: isRequester
                  ? t("received_items_summary")
                  : t("dispatched_items_summary"),
                component: (
                  <div>
                    <div className="flex justify-end px-4">
                      <ProductKnowledgeSelect
                        value={selectedProductKnowledge}
                        onChange={(value) => {
                          setSelectedProductKnowledge(value);
                        }}
                        placeholder={t("filter_by_product")}
                        disableFavorites
                        alignContent="end"
                      />
                    </div>
                    <AllSupplyDeliveriesComponent
                      facilityId={facilityId}
                      deliverOrderIds={deliveryOrders.map(
                        (deliveryOrder) => deliveryOrder.id,
                      )}
                      internal={internal}
                      selectedProductKnowledge={selectedProductKnowledge}
                      isRequester={isRequester}
                    />
                  </div>
                ),
              },
            }}
            currentTab={currentTab}
            onTabChange={setCurrentTab}
            className="overflow-hidden"
            tabContentClassName="px-1"
            showMoreAfterIndex={showMoreAfterIndex}
          />
        </div>
      </div>
    </Page>
  );
}
