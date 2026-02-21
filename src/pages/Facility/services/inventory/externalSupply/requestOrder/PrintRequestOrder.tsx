import careConfig from "@careConfig";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";

import PrintPreview from "@/CAREUI/misc/PrintPreview";

import Loading from "@/components/Common/Loading";
import PrintFooter from "@/components/Common/PrintFooter";
import PrintTable from "@/components/Common/PrintTable";

import { Badge } from "@/components/ui/badge";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import {
  REQUEST_ORDER_STATUS_COLORS,
  RequestOrderRetrieve,
} from "@/types/inventory/requestOrder/requestOrder";
import requestOrderApi from "@/types/inventory/requestOrder/requestOrderApi";
import supplyDeliveryApi from "@/types/inventory/supplyDelivery/supplyDeliveryApi";
import { SupplyRequestRead } from "@/types/inventory/supplyRequest/supplyRequest";
import supplyRequestApi from "@/types/inventory/supplyRequest/supplyRequestApi";
import { add, round, subtract } from "@/Utils/decimal";
import query from "@/Utils/request/query";
import Decimal from "decimal.js";

interface DetailRowProps {
  label: string;
  value?: string | null;
  isStrong?: boolean;
}

const DetailRow = ({ label, value, isStrong = false }: DetailRowProps) => {
  return (
    <div className="flex">
      <span className="text-gray-600 w-32">{label}</span>
      <span className="text-gray-600">: </span>
      <span className={`ml-1 ${isStrong ? "font-semibold" : ""}`}>
        {value || "-"}
      </span>
    </div>
  );
};

interface RequestOrderContentProps {
  requestOrder: RequestOrderRetrieve;
  supplyRequests: SupplyRequestRead[];
  dispatchedQuantities: Record<string, Decimal>;
}

const RequestOrderContent = ({
  requestOrder,
  supplyRequests,
  dispatchedQuantities,
}: RequestOrderContentProps) => {
  const { t } = useTranslation();

  return (
    <div>
      {/* Request Order Header */}
      <div className="mb-4">
        <div className="text-2xl font-semibold mb-2 flex items-end gap-4">
          <p>{requestOrder.name}</p>
        </div>
        {requestOrder.note && (
          <p className="text-sm text-gray-600">{requestOrder.note}</p>
        )}
      </div>

      {/* Supply Requests Table */}
      {supplyRequests && supplyRequests.length > 0 && (
        <div className="mt-4">
          <p className="text-base font-semibold mb-2">{t("requested_items")}</p>
          <PrintTable
            headers={[
              { key: "product" },
              { key: "quantity" },
              { key: "dispatched_quantity" },
              { key: "remaining_quantity" },
              { key: "status" },
            ]}
            rows={supplyRequests.map((request) => {
              const dispatched =
                dispatchedQuantities[request.item.id] || new Decimal(0);
              const remaining = subtract(request.quantity, dispatched);

              return {
                product: request.item.name || "-",
                quantity: String(round(request.quantity)),
                dispatched_quantity: String(round(dispatched)),
                remaining_quantity: String(round(remaining)),
                status: t(request.status),
              };
            })}
          />
        </div>
      )}
    </div>
  );
};

interface RequestOrderPreviewProps {
  requestOrder: RequestOrderRetrieve;
  supplyRequests: SupplyRequestRead[];
  dispatchedQuantities: Record<string, Decimal>;
}

const RequestOrderPreview = ({
  requestOrder,
  supplyRequests,
  dispatchedQuantities,
}: RequestOrderPreviewProps) => {
  const { t } = useTranslation();
  const { facility } = useCurrentFacility();

  return (
    <PrintPreview
      title={`${t("request_order")} - ${requestOrder.name}`}
      disabled={!supplyRequests?.length}
    >
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-start mb-2 pb-2 border-b border-gray-200">
          <div className="flex items-start gap-4">
            <div className="text-left">
              <h1 className="text-2xl font-medium">{facility?.name}</h1>
              {facility?.address && (
                <div className="text-gray-500 whitespace-pre-wrap wrap-break-word text-sm">
                  {facility.address}
                  {facility.phone_number && (
                    <p className="text-gray-500 text-sm">
                      {t("phone")}: {facility.phone_number}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
          <img
            src={careConfig.mainLogo?.dark}
            alt="Logo"
            className="h-10 w-auto object-contain mb-2 sm:mb-0 text-end"
          />
        </div>

        <h2 className="text-gray-500 uppercase text-sm tracking-wide font-semibold my-2">
          {t("request_order")}
        </h2>

        {/* Request Order Details */}
        <div className="grid md:grid-cols-2 print:grid-cols-2 gap-6 border-t border-gray-200 pt-2">
          <div className="space-y-2">
            <DetailRow
              label={t("deliver_to")}
              value={requestOrder.destination?.name}
              isStrong
            />
            {requestOrder.origin && (
              <DetailRow
                label={t("origin")}
                value={requestOrder.origin.name}
                isStrong
              />
            )}
            {requestOrder.supplier && (
              <DetailRow
                label={t("supplier")}
                value={requestOrder.supplier.name}
                isStrong
              />
            )}
          </div>
          <div className="space-y-2">
            <DetailRow
              label={t("date")}
              value={format(new Date(), "dd MMM yyyy, EEEE")}
              isStrong
            />
            <div className="flex">
              <span className="text-gray-600 w-32">{t("status")}</span>
              <span className="text-gray-600">: </span>
              <Badge
                className="rounded-sm ml-1"
                variant={REQUEST_ORDER_STATUS_COLORS[requestOrder.status]}
              >
                {t(requestOrder.status)}
              </Badge>
            </div>
          </div>
        </div>

        <RequestOrderContent
          requestOrder={requestOrder}
          supplyRequests={supplyRequests}
          dispatchedQuantities={dispatchedQuantities}
        />

        {/* Footer */}
        <PrintFooter leftContent={t("computer_generated_document")} />
      </div>
    </PrintPreview>
  );
};

interface PrintRequestOrderProps {
  facilityId: string;
  requestOrderId: string;
  locationId?: string;
  internal: boolean;
}

export const PrintRequestOrder = ({
  facilityId,
  requestOrderId,
  locationId,
  internal,
}: PrintRequestOrderProps) => {
  const { t } = useTranslation();

  const { data: requestOrder, isLoading: isLoadingOrder } = useQuery({
    queryKey: ["requestOrders", requestOrderId],
    queryFn: query(requestOrderApi.retrieveRequestOrder, {
      pathParams: {
        facilityId,
        requestOrderId,
      },
    }),
    enabled: !!requestOrderId,
  });

  const { data: supplyRequests, isLoading: isLoadingRequests } = useQuery({
    queryKey: ["supplyRequests", requestOrderId],
    queryFn: query.paginated(supplyRequestApi.listSupplyRequest, {
      queryParams: {
        order: requestOrderId,
      },
    }),
    enabled: !!requestOrderId,
  });

  const { data: allSupplyDeliveries, isLoading: isLoadingDeliveries } =
    useQuery({
      queryKey: ["allSupplyDeliveries", requestOrderId],
      queryFn: query.paginated(supplyDeliveryApi.listSupplyDelivery, {
        queryParams: {
          facility: facilityId,
          request_order: requestOrderId,
        },
      }),
      enabled: !!requestOrderId && !!locationId,
    });

  // Calculate dispatched quantities per product
  const dispatchedQuantities =
    allSupplyDeliveries?.results?.reduce(
      (acc, delivery) => {
        const productId = internal
          ? delivery.supplied_inventory_item?.product?.product_knowledge?.id
          : delivery.supplied_item?.product_knowledge?.id;
        if (productId) {
          acc[productId] = add(
            acc[productId] || 0,
            delivery.supplied_item_quantity,
          );
        }
        return acc;
      },
      {} as Record<string, Decimal>,
    ) || {};

  if (isLoadingOrder || isLoadingRequests || isLoadingDeliveries) {
    return <Loading />;
  }

  if (!requestOrder) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-lg border-2 border-dashed p-4 text-gray-500 border-gray-200">
        {t("request_order_not_found")}
      </div>
    );
  }

  if (!supplyRequests?.results?.length) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-lg border-2 border-dashed p-4 text-gray-500 border-gray-200">
        {t("no_supply_requests_found")}
      </div>
    );
  }

  return (
    <RequestOrderPreview
      requestOrder={requestOrder}
      supplyRequests={supplyRequests.results}
      dispatchedQuantities={dispatchedQuantities}
    />
  );
};
