import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import PrintLoading from "@/CAREUI/misc/PrintLoading";
import TypstPrintPreview from "@/CAREUI/misc/TypstPrintPreview";

import { buildMedicationReturnPrintContent } from "@/pages/Facility/services/pharmacy/medicationReturnPrintData";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import { PatientRead } from "@/types/emr/patient/patient";
import { PrintTemplateType } from "@/types/facility/printTemplate";
import deliveryOrderApi from "@/types/inventory/deliveryOrder/deliveryOrderApi";
import {
  SupplyDeliveryRead,
  SupplyDeliveryStatus,
} from "@/types/inventory/supplyDelivery/supplyDelivery";
import supplyDeliveryApi from "@/types/inventory/supplyDelivery/supplyDeliveryApi";
import query from "@/Utils/request/query";
import { PaginatedResponse } from "@/Utils/request/types";

interface PrintMedicationReturnProps {
  facilityId: string;
  deliveryOrderId: string;
}

export const PrintMedicationReturn = ({
  facilityId,
  deliveryOrderId,
}: PrintMedicationReturnProps) => {
  const { t } = useTranslation();
  const { facility } = useCurrentFacility();

  const { data: deliveryOrder, isLoading: isLoadingOrder } = useQuery({
    queryKey: ["medicationReturns", deliveryOrderId],
    queryFn: query(deliveryOrderApi.retrieveDeliveryOrder, {
      pathParams: { facilityId, deliveryOrderId },
    }),
    enabled: !!deliveryOrderId,
  });

  const { data: supplyDeliveries, isLoading: isLoadingDeliveries } = useQuery<
    PaginatedResponse<SupplyDeliveryRead>
  >({
    queryKey: ["supplyDeliveries", deliveryOrderId, "print"],
    queryFn: query(supplyDeliveryApi.listSupplyDelivery, {
      queryParams: {
        order: deliveryOrderId,
        status: SupplyDeliveryStatus.completed,
      },
    }),
    enabled: !!deliveryOrderId,
  });

  if (isLoadingOrder || isLoadingDeliveries) {
    return <PrintLoading />;
  }

  if (!deliveryOrder) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-lg border-2 border-dashed p-4 text-gray-500 border-gray-200">
        {t("medication_return_not_found")}
      </div>
    );
  }

  if (!deliveryOrder.patient) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-lg border-2 border-dashed p-4 text-gray-500 border-gray-200">
        {t("patient_not_found")}
      </div>
    );
  }

  if (!supplyDeliveries?.results?.length) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-lg border-2 border-dashed p-4 text-gray-500 border-gray-200">
        {t("no_items_to_print")}
      </div>
    );
  }

  const patient = deliveryOrder.patient as PatientRead;

  return (
    <TypstPrintPreview
      template="details-table"
      title={`${t("medication_return")} - ${patient.name}`}
      content={buildMedicationReturnPrintContent({
        deliveryOrder,
        supplyDeliveries: supplyDeliveries.results,
        patient,
        t,
      })}
      facility={facility}
      templateSlug={PrintTemplateType.medication_return}
    />
  );
};
