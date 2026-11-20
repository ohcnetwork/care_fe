import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import PrintLoading from "@/CAREUI/misc/PrintLoading";
import TypstPrintPreview from "@/CAREUI/misc/TypstPrintPreview";

import { buildDeliveryOrderPrintContent } from "@/pages/Facility/services/inventory/externalSupply/orderPrintData";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import { PrintTemplateType } from "@/types/facility/printTemplate";
import deliveryOrderApi from "@/types/inventory/deliveryOrder/deliveryOrderApi";
import supplyDeliveryApi from "@/types/inventory/supplyDelivery/supplyDeliveryApi";
import query from "@/Utils/request/query";

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

  return (
    <TypstPrintPreview
      template="details-table"
      title={`${t("delivery_order")} - ${deliveryOrder.name}`}
      content={buildDeliveryOrderPrintContent({
        deliveryOrder,
        supplyDeliveries: supplyDeliveries.results,
        internal,
        t,
      })}
      facility={facility}
      templateSlug={PrintTemplateType.delivery_order}
    />
  );
};
