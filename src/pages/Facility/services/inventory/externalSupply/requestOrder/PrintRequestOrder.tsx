import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import PrintLoading from "@/CAREUI/misc/PrintLoading";
import TypstPrintPreview from "@/CAREUI/misc/TypstPrintPreview";

import { buildRequestOrderPrintContent } from "@/pages/Facility/services/inventory/externalSupply/orderPrintData";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import { PrintTemplateType } from "@/types/facility/printTemplate";
import requestOrderApi from "@/types/inventory/requestOrder/requestOrderApi";
import supplyRequestApi from "@/types/inventory/supplyRequest/supplyRequestApi";
import query from "@/Utils/request/query";

interface PrintRequestOrderProps {
  facilityId: string;
  requestOrderId: string;
  locationId?: string;
  internal: boolean;
}

export const PrintRequestOrder = ({
  facilityId,
  requestOrderId,
}: PrintRequestOrderProps) => {
  const { t } = useTranslation();
  const { facility } = useCurrentFacility();

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

  if (isLoadingOrder || isLoadingRequests) {
    return <PrintLoading />;
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
    <TypstPrintPreview
      template="details-table"
      title={`${t("request_order")} - ${requestOrder.name}`}
      content={buildRequestOrderPrintContent({
        requestOrder,
        supplyRequests: supplyRequests.results,
        t,
      })}
      facility={facility}
      templateSlug={PrintTemplateType.request_order}
    />
  );
};
