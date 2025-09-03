import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowUpRightSquare } from "lucide-react";
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

import { TableSkeleton } from "@/components/Common/SkeletonLoading";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/Common/Table";

import useFilters from "@/hooks/useFilters";

import query from "@/Utils/request/query";
import { makeUrl } from "@/Utils/request/utils";
import { ProductKnowledgeSelect } from "@/pages/Facility/services/inventory/ProductKnowledgeSelect";
import { ProductKnowledgeStatus } from "@/types/inventory/productKnowledge/productKnowledge";
import productKnowledgeApi from "@/types/inventory/productKnowledge/productKnowledgeApi";
import {
  SUPPLY_DELIVERY_STATUS_COLORS,
  SupplyDeliveryRead,
  SupplyDeliveryRetrieve,
  SupplyDeliveryStatus,
} from "@/types/inventory/supplyDelivery/supplyDelivery";
import supplyDeliveryApi from "@/types/inventory/supplyDelivery/supplyDeliveryApi";

interface Props {
  facilityId: string;
  locationId: string;
  defaultStatus: SupplyDeliveryStatus;
  mode?: "dispatch" | "receive";
}

export default function SupplyDeliveryTable({
  facilityId,
  locationId,
  defaultStatus,
  mode = "dispatch",
}: Props) {
  const { t } = useTranslation();
  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: 14,
    disableCache: true,
  });

  // Use defaultStatus when status is not set or is invalid
  const effectiveStatus =
    qParams.status && qParams.status !== "undefined"
      ? qParams.status
      : defaultStatus;

  const { data: productKnowledgeResponse } = useQuery({
    queryKey: ["productKnowledge", facilityId],
    queryFn: query(productKnowledgeApi.listProductKnowledge, {
      queryParams: {
        facility: facilityId,
        limit: 100,
        status: ProductKnowledgeStatus.active,
      },
    }),
  });

  const { mutate: retrieveDelivery, isPending: isRetrieving } = useMutation<
    SupplyDeliveryRetrieve,
    Error,
    string
  >({
    mutationFn: (deliveryId: string) =>
      query(supplyDeliveryApi.retrieveSupplyDelivery, {
        pathParams: { supplyDeliveryId: deliveryId },
      })({ signal: new AbortController().signal }),
    onSuccess: (data, deliveryId) => {
      const supplyRequestId = data.supply_request?.id;
      if (mode === "dispatch") {
        if (supplyRequestId) {
          const params = new URLSearchParams(qParams as Record<string, string>);
          params.set("highlight_delivery", deliveryId);
          navigate(
            `/facility/${facilityId}/locations/${locationId}/internal_transfers/to_dispatch/${supplyRequestId}?${params.toString()}`,
          );
        } else {
          const params = new URLSearchParams(qParams as Record<string, string>);
          params.set("highlight_delivery", deliveryId);
          navigate(
            `/facility/${facilityId}/locations/${locationId}/internal_transfers/to_dispatch/delivery/${deliveryId}?${params.toString()}`,
          );
        }
      } else {
        toast.error(t("no_supply_request_found_for_delivery"));
      }
    },
  });

  const { data: response, isLoading } = useQuery({
    queryKey: [
      "supplyDeliveries",
      facilityId,
      locationId,
      qParams,
      effectiveStatus,
    ],
    queryFn: query.debounced(supplyDeliveryApi.listSupplyDelivery, {
      queryParams: {
        facility: facilityId,
        ...(mode === "dispatch"
          ? { origin: locationId }
          : { destination: locationId }),
        limit: resultsPerPage,
        offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
        status: effectiveStatus,
        supplied_inventory_item_product_knowledge: qParams.item,
        origin_isnull: false,
        ordering: "-created_date",
      },
    }),
  });

  const deliveries = response?.results || [];
  const productKnowledges = productKnowledgeResponse?.results || [];

  const selectedProduct = productKnowledges.find((p) => p.id === qParams.item);

  const handleSeeDetails = (deliveryId: string) => {
    if (mode === "receive") {
      const path = `/facility/${facilityId}/locations/${locationId}/internal_transfers/to_receive/${deliveryId}`;
      navigate(makeUrl(path, qParams));
    } else {
      retrieveDelivery(deliveryId);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <ProductKnowledgeSelect
          value={selectedProduct}
          onChange={(product) => updateQuery({ item: product?.id })}
          placeholder={t("search_by_item")}
          className="placeholder:font-semibold"
        />
      </div>
      {isLoading ? (
        <TableSkeleton count={5} />
      ) : !deliveries.length ? (
        <EmptyState
          icon="l-box"
          title={t("no_deliveries_found")}
          description={t("no_deliveries_found_description")}
        />
      ) : (
        <div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("item")}</TableHead>
                <TableHead>{t("qty_requested")}</TableHead>
                <TableHead>
                  {mode === "dispatch" ? t("deliver_to") : t("deliver_from")}
                </TableHead>
                <TableHead>{t("condition")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead>{t("action")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deliveries.map((delivery: SupplyDeliveryRead) => (
                <TableRow key={delivery.id}>
                  <TableCell className="font-semibold w-1/3">
                    {delivery.supplied_item?.product_knowledge.name ||
                      delivery.supplied_inventory_item?.product
                        .product_knowledge.name}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold min-w-8 text-right">
                        {delivery.supplied_item_quantity}
                      </span>
                      <span className="text-gray-600 capitalize">
                        {delivery.supplied_item?.product_knowledge.base_unit
                          .display ||
                          delivery.supplied_inventory_item?.product
                            ?.product_knowledge.base_unit?.display ||
                          t("units")}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {mode === "dispatch"
                      ? delivery.destination.name
                      : delivery.origin?.name}
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
                  <TableCell>
                    <Badge
                      variant={SUPPLY_DELIVERY_STATUS_COLORS[delivery.status]}
                    >
                      {t(delivery.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="w-10">
                    <Button
                      variant="outline"
                      className="font-semibold"
                      onClick={() => handleSeeDetails(delivery.id)}
                      disabled={isRetrieving}
                    >
                      <ArrowUpRightSquare strokeWidth={1.5} />
                      {t("see_details")}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="mt-4">
        <Pagination totalCount={response?.count || 0} />
      </div>
    </div>
  );
}
