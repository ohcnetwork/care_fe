import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import PrintLoading from "@/CAREUI/misc/PrintLoading";
import TypstPrintPreview from "@/CAREUI/misc/TypstPrintPreview";

import { buildDispenseOrderPrintContent } from "@/pages/Facility/services/pharmacy/dispenseOrderPrintData";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import dispenseOrderApi from "@/types/emr/dispenseOrder/dispenseOrderApi";
import { MedicationDispenseRead } from "@/types/emr/medicationDispense/medicationDispense";
import medicationDispenseApi from "@/types/emr/medicationDispense/medicationDispenseApi";
import { PrintTemplateType } from "@/types/facility/printTemplate";
import query from "@/Utils/request/query";
import { PaginatedResponse } from "@/Utils/request/types";

interface PrintDispenseOrderProps {
  facilityId: string;
  dispenseOrderId: string;
  locationId: string;
}

export const PrintDispenseOrder = ({
  facilityId,
  dispenseOrderId,
  locationId,
}: PrintDispenseOrderProps) => {
  const { t } = useTranslation();
  const { facility } = useCurrentFacility();

  const { data: dispenseOrder, isLoading: isLoadingOrder } = useQuery({
    queryKey: ["dispenseOrder", facilityId, dispenseOrderId],
    queryFn: query(dispenseOrderApi.get, {
      pathParams: { facilityId, id: dispenseOrderId },
    }),
    enabled: !!dispenseOrderId,
  });

  const { data: medicationDispenses, isLoading: isLoadingDispenses } = useQuery<
    PaginatedResponse<MedicationDispenseRead>
  >({
    queryKey: ["medicationDispenses", dispenseOrderId, locationId],
    queryFn: query(medicationDispenseApi.list, {
      queryParams: {
        order: dispenseOrderId,
        location: locationId,
      },
    }),
    enabled: !!dispenseOrderId && !!locationId,
  });

  if (isLoadingOrder || isLoadingDispenses) {
    return <PrintLoading />;
  }

  if (!dispenseOrder) {
    return (
      <div className="flex h-50 items-center justify-center rounded-lg border-2 border-dashed p-4 text-gray-500 border-gray-200">
        {t("dispense_order_not_found")}
      </div>
    );
  }

  if (!medicationDispenses?.results?.length) {
    return (
      <div className="flex h-50 items-center justify-center rounded-lg border-2 border-dashed p-4 text-gray-500 border-gray-200">
        {t("no_medication_dispenses_found")}
      </div>
    );
  }

  return (
    <TypstPrintPreview
      template="details-table"
      title={`${t("dispense_order")} - ${dispenseOrder.patient.name}`}
      content={buildDispenseOrderPrintContent({
        dispenseOrder,
        dispenses: medicationDispenses.results,
        patient: dispenseOrder.patient,
        t,
      })}
      facility={facility}
      templateSlug={PrintTemplateType.dispense_order}
    />
  );
};
