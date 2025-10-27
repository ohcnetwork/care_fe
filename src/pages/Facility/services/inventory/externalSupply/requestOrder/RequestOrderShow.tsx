import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Box, ChevronLeft, Edit, Truck } from "lucide-react";
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
import { getInventoryBasePath } from "@/pages/Facility/services/inventory/externalSupply/utils/inventoryUtils";
import {
  REQUEST_ORDER_PRIORITY_COLORS,
  REQUEST_ORDER_STATUS_COLORS,
  RequestOrderStatus,
} from "@/types/inventory/requestOrder/requestOrder";
import requestOrderApi from "@/types/inventory/requestOrder/requestOrderApi";
import { SupplyDeliveryStatus } from "@/types/inventory/supplyDelivery/supplyDelivery";
import supplyDeliveryApi from "@/types/inventory/supplyDelivery/supplyDeliveryApi";
import { SUPPLY_REQUEST_STATUS_COLORS } from "@/types/inventory/supplyRequest/supplyRequest";
import supplyRequestApi from "@/types/inventory/supplyRequest/supplyRequestApi";
import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";

interface AllSupplyDeliveriesProps {
  facilityId: string;
  requestOrderId: string;
  selectedProductKnowledge?: ProductKnowledgeBase;
  internal: boolean;
}

function AllSupplyDeliveriesComponent({
  facilityId,
  requestOrderId,
  selectedProductKnowledge,
  internal,
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

  const { data: allSupplyDeliveries, isLoading: isLoadingAllSupplyDeliveries } =
    useQuery({
      queryKey: ["allSupplyDeliveries", requestOrderId, qParams],
      queryFn: query.paginated(supplyDeliveryApi.listSupplyDelivery, {
        queryParams: {
          facility: facilityId,
          request_order: requestOrderId,
          ...qParams,
        },
      }),
      enabled: !!requestOrderId,
    });

  return (
    <div className="space-y-4 max-h-[68vh] overflow-y-auto px-4 pt-4">
      {isLoadingAllSupplyDeliveries ? (
        <TableSkeleton count={3} />
      ) : allSupplyDeliveries?.results &&
        allSupplyDeliveries.results.length > 0 ? (
        <SupplyDeliveryTable
          deliveries={allSupplyDeliveries.results}
          internal={internal}
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
    "supply-requests" | "delivery-orders" | "all-supply-deliveries"
  >("supply-requests");

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

  const { data: supplyRequests, isLoading: isLoadingSupplyRequests } = useQuery(
    {
      queryKey: ["supplyRequests", requestOrderId],
      queryFn: query.paginated(supplyRequestApi.listSupplyRequest, {
        queryParams: {
          order: requestOrderId,
        },
      }),
      enabled: !!requestOrderId && currentTab === "supply-requests",
    },
  );

  const { data: deliveryOrders, isLoading: isLoadingDeliveryOrders } = useQuery(
    {
      queryKey: ["deliveryOrders", requestOrderId],
      queryFn: query(supplyDeliveryApi.deliveryOrders, {
        queryParams: {
          request_order: requestOrderId,
          status: [SupplyDeliveryStatus.completed],
        },
      }),
      enabled: !!requestOrderId && currentTab === "delivery-orders",
    },
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

  const isRequester = requestOrder?.destination.id === locationId;

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
            {isRequester && (
              <Button variant="outline" asChild>
                <Link href={`${requestOrderId}/edit`}>
                  <Edit /> {t("edit")}
                  <ShortcutBadge actionId="edit-order" />
                </Link>
              </Button>
            )}

            {canAddSupplyRequests && (
              <Button
                onClick={() => updateOrderStatus(RequestOrderStatus.pending)}
                disabled={isUpdating || supplyRequests?.results.length === 0}
              >
                {isUpdating ? t("approving") : t("mark_as_approved")}
                <ShortcutBadge actionId="mark-as" />
              </Button>
            )}

            {((internal && !isRequester) ||
              (!internal &&
                requestOrder.status === RequestOrderStatus.pending)) && (
              <Button variant="outline" asChild>
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
                    <Button
                      variant="outline"
                      data-cy="invoice-actions-button"
                      className="border-gray-400 px-2"
                    >
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
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
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
              "supply-requests": {
                label: t("supply_requests"),
                component: (
                  <div className="space-y-6">
                    {isLoadingSupplyRequests ? (
                      <TableSkeleton count={3} />
                    ) : (
                      <>
                        {/* Supply Requests Table */}
                        {supplyRequests?.results &&
                        supplyRequests.results.length > 0 ? (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>{t("item")}</TableHead>
                                <TableHead>{t("quantity")}</TableHead>
                                <TableHead>{t("status")}</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {supplyRequests.results.map((supplyRequest) => (
                                <TableRow key={supplyRequest.id}>
                                  <TableCell>
                                    {supplyRequest.item.name}
                                  </TableCell>
                                  <TableCell>
                                    {supplyRequest.quantity}
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
                              ))}
                            </TableBody>
                          </Table>
                        ) : (
                          <EmptyState
                            icon={<Box className="text-primary size-5" />}
                            title={t("no_supply_requests_found")}
                            description={t("add_items_to_get_started")}
                          />
                        )}

                        {/* Add New Items Form - Always show when in draft mode */}
                        {canAddSupplyRequests && (
                          <div className="border-t pt-6">
                            <AddItemsForm
                              requestOrderId={requestOrderId}
                              onSuccess={handleSupplyRequestSuccess}
                            />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ),
              },

              "delivery-orders": {
                label: t("delivery_orders"),
                component: (
                  <div>
                    {isLoadingDeliveryOrders ? (
                      <TableSkeleton count={3} />
                    ) : deliveryOrders?.results &&
                      deliveryOrders.results.length > 0 ? (
                      <DeliveryOrderTable
                        deliveries={deliveryOrders.results}
                        isLoading={false}
                        facilityId={facilityId}
                        locationId={requestOrder?.destination.id || ""}
                        internal={true}
                        isRequester={false}
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

              "all-supply-deliveries": {
                label: t("all_supply_deliveries"),
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
                      />
                    </div>
                    <AllSupplyDeliveriesComponent
                      facilityId={facilityId}
                      requestOrderId={requestOrderId}
                      internal={internal}
                      selectedProductKnowledge={selectedProductKnowledge}
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
