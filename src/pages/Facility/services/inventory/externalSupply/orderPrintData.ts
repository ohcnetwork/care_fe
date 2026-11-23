import { format } from "date-fns";
import type { TFunction } from "i18next";

import type { DetailsTablePrintContent } from "@/print/detailsTable";
import {
  buildDateRow,
  buildGeneratedFooter,
  type PrintDetailRow,
} from "@/print/patientDetails";
import type { DeliveryOrderRetrieve } from "@/types/inventory/deliveryOrder/deliveryOrder";
import type { RequestOrderRetrieve } from "@/types/inventory/requestOrder/requestOrder";
import type { SupplyDeliveryRead } from "@/types/inventory/supplyDelivery/supplyDelivery";
import type { SupplyRequestRead } from "@/types/inventory/supplyRequest/supplyRequest";
import { round } from "@/Utils/decimal";

type Order = RequestOrderRetrieve | DeliveryOrderRetrieve;

function buildOrderContent({
  order,
  heading,
  tableTitle,
  header,
  rows,
  extensionRows = [],
  t,
}: {
  order: Order;
  heading: string;
  tableTitle: string;
  header: string[];
  rows: string[][];
  extensionRows?: PrintDetailRow[];
  t: TFunction;
}): DetailsTablePrintContent {
  return {
    heading,
    patient: null,
    patient_label: "",
    details: {
      left: [
        { label: t("deliver_to"), value: order.destination?.name ?? null },
        ...(order.origin
          ? [{ label: t("origin"), value: order.origin.name }]
          : []),
        ...(order.supplier
          ? [{ label: t("supplier"), value: order.supplier.name }]
          : []),
        ...extensionRows.filter((_, index) => index % 2 === 0),
      ],
      right: [
        buildDateRow(t),
        { label: t("status"), value: t(String(order.status)) },
        ...extensionRows.filter((_, index) => index % 2 === 1),
      ],
    },
    title: order.name ?? null,
    note: order.note || null,
    table_title: tableTitle,
    table: { header, rows },
    footer: buildGeneratedFooter(t),
  };
}

export function buildRequestOrderPrintContent({
  requestOrder,
  supplyRequests,
  t,
}: {
  requestOrder: RequestOrderRetrieve;
  supplyRequests: SupplyRequestRead[];
  t: TFunction;
}) {
  return buildOrderContent({
    order: requestOrder,
    heading: t("request_order"),
    tableTitle: t("requested_items"),
    header: [t("product"), t("quantity"), t("status")],
    rows: supplyRequests.map((request) => [
      request.item.name || "-",
      String(round(request.quantity)),
      t(request.status),
    ]),
    t,
  });
}

export function buildDeliveryOrderPrintContent({
  deliveryOrder,
  supplyDeliveries,
  internal,
  extensionRows,
  t,
}: {
  deliveryOrder: DeliveryOrderRetrieve;
  supplyDeliveries: SupplyDeliveryRead[];
  internal: boolean;
  extensionRows: PrintDetailRow[];
  t: TFunction;
}) {
  return buildOrderContent({
    order: deliveryOrder,
    heading: t("delivery_order"),
    tableTitle: t("supply_deliveries"),
    extensionRows,
    header: [
      t("product"),
      t("quantity"),
      t("status"),
      t("condition"),
      ...(internal ? [t("lot_batch_number"), t("expiry_date")] : []),
    ],
    rows: supplyDeliveries.map((delivery) => {
      const inventoryProduct = delivery.supplied_inventory_item?.product;
      const productName = internal
        ? inventoryProduct?.product_knowledge?.name
        : delivery.supplied_item?.product_knowledge?.name;
      const expiryDate = internal ? inventoryProduct?.expiration_date : null;

      return [
        productName || "-",
        String(round(delivery.supplied_item_quantity)),
        t(delivery.status),
        t(String(delivery.supplied_item_condition || "normal")),
        ...(internal
          ? [
              inventoryProduct?.batch?.lot_number || "-",
              expiryDate ? format(new Date(expiryDate), "dd/MM/yyyy") : "-",
            ]
          : []),
      ];
    }),
    t,
  });
}
