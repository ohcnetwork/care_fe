import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import PrintLoading from "@/CAREUI/misc/PrintLoading";
import TypstPrintPreview from "@/CAREUI/misc/TypstPrintPreview";

import {
  getExtensionFieldsWithName,
  getExtensionValue,
  NamespacedExtensionData,
} from "@/hooks/useExtensions";
import useExtensionSchemas from "@/hooks/useExtensionSchemas";
import { buildDeliveryOrderPrintContent } from "@/pages/Facility/services/inventory/externalSupply/orderPrintData";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import { ExtensionEntityType } from "@/types/extensions/extensions";
import { PrintTemplateType } from "@/types/facility/printTemplate";
import deliveryOrderApi from "@/types/inventory/deliveryOrder/deliveryOrderApi";
import supplyDeliveryApi from "@/types/inventory/supplyDelivery/supplyDeliveryApi";
import query from "@/Utils/request/query";
import { ExtensionContexts } from "@/Utils/schema/types";
import { formatDateTime } from "@/Utils/utils";

function formatExtensionValue(value: unknown, fieldFormat?: string) {
  if (typeof value === "number") return value.toFixed(2);
  if (fieldFormat === "date" || fieldFormat === "date-time") {
    return formatDateTime(value as string);
  }
  return String(value);
}

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
  const { facility } = useCurrentFacility();
  const { getExtensions } = useExtensionSchemas();
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
    return <PrintLoading />;
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

  const extensionRows = getExtensionFieldsWithName(
    getExtensions(ExtensionEntityType.supply_delivery_order, "retrieve"),
    ExtensionContexts.supply_delivery_order_summary,
  ).flatMap((field) => {
    const value = getExtensionValue(
      deliveryOrder.extensions as NamespacedExtensionData,
      field,
    );
    if (value === undefined || value === null) return [];
    return [
      { label: field.label, value: formatExtensionValue(value, field.format) },
    ];
  });

  return (
    <TypstPrintPreview
      template="details-table"
      title={`${t("delivery_order")} - ${deliveryOrder.name}`}
      content={buildDeliveryOrderPrintContent({
        deliveryOrder,
        supplyDeliveries: supplyDeliveries.results,
        internal,
        extensionRows,
        t,
      })}
      facility={facility}
      templateSlug={PrintTemplateType.delivery_order}
    />
  );
};
