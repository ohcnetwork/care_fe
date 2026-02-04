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
  DELIVERY_ORDER_STATUS_COLORS,
  DeliveryOrderRetrieve,
} from "@/types/inventory/deliveryOrder/deliveryOrder";
import deliveryOrderApi from "@/types/inventory/deliveryOrder/deliveryOrderApi";
import { SupplyDeliveryRead } from "@/types/inventory/supplyDelivery/supplyDelivery";
import supplyDeliveryApi from "@/types/inventory/supplyDelivery/supplyDeliveryApi";
import query from "@/Utils/request/query";

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

interface DeliveryOrderContentProps {
  deliveryOrder: DeliveryOrderRetrieve;
  supplyDeliveries: SupplyDeliveryRead[];
  internal: boolean;
}

const DeliveryOrderContent = ({
  deliveryOrder,
  supplyDeliveries,
  internal,
}: DeliveryOrderContentProps) => {
  const { t } = useTranslation();

  return (
    <div>
      {/* Delivery Order Header */}
      <div className="mb-4">
        <div className="text-2xl font-semibold mb-2 flex items-end gap-4">
          <p>{deliveryOrder.name}</p>
        </div>
        {deliveryOrder.note && (
          <p className="text-sm text-gray-600">{deliveryOrder.note}</p>
        )}
      </div>

      {/* Supply Deliveries Table */}
      {supplyDeliveries && supplyDeliveries.length > 0 && (
        <div className="mt-4">
          <p className="text-base font-semibold mb-2">
            {t("supply_deliveries")}
          </p>
          <PrintTable
            headers={[
              { key: "product" },
              { key: "quantity" },
              { key: "status" },
              { key: "condition" },
              ...(internal
                ? [{ key: "lot_batch_number" }, { key: "expiry_date" }]
                : []),
            ]}
            rows={supplyDeliveries.map((delivery) => {
              const productName = internal
                ? delivery.supplied_inventory_item?.product?.product_knowledge
                    ?.name
                : delivery.supplied_item?.product_knowledge?.name;

              const batchNumber = internal
                ? delivery.supplied_inventory_item?.product?.batch?.lot_number
                : undefined;

              const expiryDate = internal
                ? delivery.supplied_inventory_item?.product?.expiration_date
                : undefined;

              return {
                product: productName || "-",
                quantity: String(delivery.supplied_item_quantity || "-"),
                status: t(delivery.status),
                condition: t(delivery.supplied_item_condition || "normal"),
                lot_batch_number: batchNumber || "-",
                expiry_date: expiryDate
                  ? format(new Date(expiryDate), "dd/MM/yyyy")
                  : "-",
              };
            })}
          />
        </div>
      )}
    </div>
  );
};

interface DeliveryOrderPreviewProps {
  deliveryOrder: DeliveryOrderRetrieve;
  supplyDeliveries: SupplyDeliveryRead[];
  internal: boolean;
}

const DeliveryOrderPreview = ({
  deliveryOrder,
  supplyDeliveries,
  internal,
}: DeliveryOrderPreviewProps) => {
  const { t } = useTranslation();
  const { facility } = useCurrentFacility();

  return (
    <PrintPreview
      title={`${t("delivery_order")} - ${deliveryOrder.name}`}
      disabled={!supplyDeliveries?.length}
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
          {t("delivery_order")}
        </h2>

        {/* Delivery Order Details */}
        <div className="grid md:grid-cols-2 print:grid-cols-2 gap-6 border-t border-gray-200 pt-2">
          <div className="space-y-2">
            <DetailRow
              label={t("deliver_to")}
              value={deliveryOrder.destination?.name}
              isStrong
            />
            {deliveryOrder.origin && (
              <DetailRow
                label={t("origin")}
                value={deliveryOrder.origin.name}
                isStrong
              />
            )}
            {deliveryOrder.supplier && (
              <DetailRow
                label={t("supplier")}
                value={deliveryOrder.supplier.name}
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
                variant={DELIVERY_ORDER_STATUS_COLORS[deliveryOrder.status]}
              >
                {t(deliveryOrder.status)}
              </Badge>
            </div>
          </div>
        </div>

        <DeliveryOrderContent
          deliveryOrder={deliveryOrder}
          supplyDeliveries={supplyDeliveries}
          internal={internal}
        />

        {/* Footer */}
        <PrintFooter leftContent={t("computer_generated_document")} />
      </div>
    </PrintPreview>
  );
};

interface PrintDeliveryOrderProps {
  facilityId: string;
  deliveryOrderId: string;
  locationId: string;
  internal: boolean;
}

export const PrintDeliveryOrder = ({
  facilityId,
  deliveryOrderId,
  locationId,
  internal,
}: PrintDeliveryOrderProps) => {
  const { t } = useTranslation();

  const { data: deliveryOrder, isLoading: isLoadingOrder } = useQuery({
    queryKey: ["deliveryOrders", deliveryOrderId],
    queryFn: query(deliveryOrderApi.retrieveDeliveryOrder, {
      pathParams: {
        facilityId,
        deliveryOrderId,
      },
    }),
    enabled: !!deliveryOrderId,
  });

  const { data: supplyDeliveries, isLoading: isLoadingDeliveries } = useQuery({
    queryKey: ["supplyDeliveries", deliveryOrderId],
    queryFn: query.paginated(supplyDeliveryApi.listSupplyDelivery, {
      queryParams: {
        order: deliveryOrderId,
        facility: facilityId,
      },
    }),
    enabled: !!deliveryOrderId && !!locationId,
  });

  if (isLoadingOrder || isLoadingDeliveries) {
    return <Loading />;
  }

  if (!deliveryOrder) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-lg border-2 border-dashed p-4 text-gray-500 border-gray-200">
        {t("delivery_order_not_found")}
      </div>
    );
  }

  if (!supplyDeliveries?.results?.length) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-lg border-2 border-dashed p-4 text-gray-500 border-gray-200">
        {t("no_supply_deliveries_found")}
      </div>
    );
  }

  return (
    <DeliveryOrderPreview
      deliveryOrder={deliveryOrder}
      supplyDeliveries={supplyDeliveries.results}
      internal={internal}
    />
  );
};
