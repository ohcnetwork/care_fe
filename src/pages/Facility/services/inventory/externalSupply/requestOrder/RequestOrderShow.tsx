import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import Page from "@/components/Common/Page";
import { AddItemsForm } from "./AddItemsForm";

import {
  REQUEST_ORDER_PRIORITY_COLORS,
  REQUEST_ORDER_STATUS_COLORS,
  RequestOrderStatus,
} from "@/types/inventory/requestOrder/requestOrder";
import requestOrderApi from "@/types/inventory/requestOrder/requestOrderApi";
import { SUPPLY_REQUEST_STATUS_COLORS } from "@/types/inventory/supplyRequest/supplyRequest";
import supplyRequestApi from "@/types/inventory/supplyRequest/supplyRequestApi";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { Link } from "raviger";

interface Props {
  facilityId: string;
  requestOrderId: string;
}

export function RequestOrderShow({ facilityId, requestOrderId }: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

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
      queryFn: query(supplyRequestApi.listSupplyRequest, {
        queryParams: {
          order: requestOrderId,
        },
      }),
      enabled: !!requestOrderId,
    },
  );

  const { mutate: approveOrder, isPending: isApproving } = useMutation({
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
      toast.success(t("order_approved_successfully"));
    },
    onError: (_error) => {
      toast.error(t("error_approving_order"));
    },
  });

  function handleSupplyRequestSuccess() {
    queryClient.invalidateQueries({
      queryKey: ["supplyRequests", requestOrderId],
    });
  }

  function handleApproveOrder() {
    if (!requestOrder) return;

    approveOrder({
      ...requestOrder,
      status: RequestOrderStatus.pending,
      supplier: requestOrder.supplier?.id || "",
      origin: requestOrder.origin?.id || undefined,
      destination: requestOrder.destination.id,
    });
  }

  if (isLoading) {
    return (
      <Page title={t("request_order_details")} hideTitleOnPage>
        <div className="space-y-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          </div>
        </div>
      </Page>
    );
  }

  if (!requestOrder) {
    return (
      <Page title={t("request_order_details")} hideTitleOnPage>
        <div className="space-y-4">
          <div className="text-center py-8">
            <p className="text-gray-500">{t("request_order_not_found")}</p>
          </div>
        </div>
      </Page>
    );
  }

  const canAddSupplyRequests = requestOrder.status === RequestOrderStatus.draft;

  return (
    <Page title={t("request_order_details")} hideTitleOnPage>
      <div className="space-y-6">
        {/* Back Button */}
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("back")}
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href={`${requestOrderId}/edit`}>{t("edit")}</Link>
            </Button>
            {canAddSupplyRequests && (
              <Button onClick={handleApproveOrder} disabled={isApproving}>
                {isApproving ? t("approving") : t("approve_order")}
              </Button>
            )}
          </div>
        </div>
        {/* Request Order Details */}
        <Card>
          <CardHeader>
            <div className="flex md:flex-row flex-col justify-between">
              <CardTitle className="text-xl">{requestOrder.name}</CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant={REQUEST_ORDER_STATUS_COLORS[requestOrder.status]}
                >
                  {t(requestOrder.status)}
                </Badge>
                <Badge
                  variant={REQUEST_ORDER_PRIORITY_COLORS[requestOrder.priority]}
                >
                  {t(requestOrder.priority)}
                </Badge>
                <Badge>{t(requestOrder.category)}</Badge>
                <Badge>{t(requestOrder.reason)}</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            {requestOrder.note && (
              <div>
                <label className="text-sm font-medium text-gray-500">
                  {t("notes")}
                </label>
                <p className="text-sm">{requestOrder.note}</p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  {t("destination")}
                </label>
                <p className="text-sm">{requestOrder.destination.name}</p>
              </div>
              {requestOrder.supplier && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    {t("supplier")}
                  </label>
                  <p className="text-sm">{requestOrder.supplier.name}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Supply Requests Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("supply_requests")}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingSupplyRequests ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                {/* Existing Supply Requests Table */}
                {supplyRequests?.results &&
                  supplyRequests.results.length > 0 && (
                    <div className="space-y-4">
                      <div className="rounded-md overflow-x-auto border-2 border-white shadow-md">
                        <Table className="rounded-lg border shadow-sm w-full bg-white">
                          <TableHeader className="bg-gray-100">
                            <TableRow className="border-b">
                              <TableHead className="border-x p-3 text-gray-700 text-sm font-medium leading-5">
                                {t("item")}
                              </TableHead>
                              <TableHead className="border-x p-3 text-gray-700 text-sm font-medium leading-5">
                                {t("quantity")}
                              </TableHead>
                              <TableHead className="border-x p-3 text-gray-700 text-sm font-medium leading-5">
                                {t("status")}
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody className="bg-white">
                            {supplyRequests.results.map((supplyRequest) => (
                              <TableRow
                                key={supplyRequest.id}
                                className="border-b hover:bg-gray-50"
                              >
                                <TableCell className="border-x p-3 text-gray-950">
                                  <div className="font-medium">
                                    {supplyRequest.item.name}
                                  </div>
                                </TableCell>
                                <TableCell className="border-x p-3 text-gray-950">
                                  {supplyRequest.quantity}
                                </TableCell>
                                <TableCell className="border-x p-3 text-gray-950">
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
                      </div>
                    </div>
                  )}

                {/* Add New Items Form - Always show when in draft mode */}
                {canAddSupplyRequests && (
                  <AddItemsForm
                    requestOrderId={requestOrderId}
                    onSuccess={handleSupplyRequestSuccess}
                  />
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Page>
  );
}
