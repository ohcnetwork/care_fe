import { format } from "date-fns";
import type { TFunction } from "i18next";

import type { DetailsTablePrintContent } from "@/print/detailsTable";
import {
  buildDateRow,
  buildGeneratedFooter,
  buildMobileRow,
  buildPatientDetailRows,
  buildPatientHeader,
} from "@/print/patientDetails";
import type { PatientRead } from "@/types/emr/patient/patient";
import type { DeliveryOrderRetrieve } from "@/types/inventory/deliveryOrder/deliveryOrder";
import type { SupplyDeliveryRead } from "@/types/inventory/supplyDelivery/supplyDelivery";
import { round } from "@/Utils/decimal";

export function buildMedicationReturnPrintContent({
  deliveryOrder,
  supplyDeliveries,
  patient,
  t,
}: {
  deliveryOrder: DeliveryOrderRetrieve;
  supplyDeliveries: SupplyDeliveryRead[];
  patient: PatientRead;
  t: TFunction;
}): DetailsTablePrintContent {
  return {
    heading: t("medication_return"),
    patient: buildPatientHeader(patient),
    patient_label: t("patient"),
    details: {
      left: buildPatientDetailRows(patient, t),
      right: [
        buildDateRow(t),
        buildMobileRow(patient, t),
        { label: t("return_to"), value: deliveryOrder.destination.name },
        { label: t("status"), value: t(deliveryOrder.status) },
      ],
    },
    title: null,
    note: deliveryOrder.note ? `${t("note")}: ${deliveryOrder.note}` : null,
    table_title: t("items_returned"),
    table: {
      header: [
        t("item"),
        t("batch"),
        t("quantity"),
        t("expiry_date"),
        t("condition"),
        t("return_date"),
      ],
      rows: supplyDeliveries.map((delivery) => {
        const inventory = delivery.supplied_inventory_item;
        return [
          delivery.supplied_item?.product_knowledge?.name || "-",
          inventory?.product?.batch?.lot_number || "-",
          String(round(delivery.supplied_item_quantity) || "-"),
          inventory?.product?.expiration_date
            ? format(new Date(inventory.product.expiration_date), "dd/MM/yyyy")
            : "-",
          delivery.supplied_item_condition
            ? t(delivery.supplied_item_condition)
            : t("normal"),
          delivery.created_date
            ? format(new Date(delivery.created_date), "dd/MM/yyyy")
            : "-",
        ];
      }),
    },
    footer: buildGeneratedFooter(t),
  };
}
