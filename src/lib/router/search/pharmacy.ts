import { z } from "zod";

import {
  paginationSearch,
  searchBoolean,
  searchDate,
  searchEnum,
  searchString,
} from "@/lib/router/search/fields";
import { MedicationRequestDispenseStatus } from "@/types/emr/medicationRequest/medicationRequest";
import { PrescriptionStatus } from "@/types/emr/prescription/prescription";
import { DeliveryOrderStatus } from "@/types/inventory/deliveryOrder/deliveryOrder";

/** The prescription queue of a pharmacy (`PrescriptionQueue`). */
export const prescriptionQueueSearch = z.object({
  ...paginationSearch,
  status: searchEnum(PrescriptionStatus),
  patient_external_id: searchString(),
  patient_name: searchString(),
  /** One of `careConfig.encounterClasses`. */
  encounter_class: searchString(),
  /** Comma-separated tag ids. */
  tags: searchString(),
  tags_behavior: searchString(),
  created_date_after: searchDate(),
  created_date_before: searchDate(),
});

/** The preview of a patient's prescriptions (`PrescriptionsPreviewPage`). */
export const prescriptionsPreviewSearch = z.object({
  search: searchString(),
  status: searchEnum([
    "all",
    ...Object.values(MedicationRequestDispenseStatus),
  ]),
});

/** The dispense orders of a pharmacy (`MedicationDispenseHistory`). */
export const dispenseOrderListSearch = z.object({
  ...paginationSearch,
  exclude_status: searchEnum(["pending", "history"]),
  patientId: searchString(),
  patient_name: searchString(),
  created_by: searchString(),
  created_date_after: searchDate(),
  created_date_before: searchDate(),
});

/**
 * A dispense order (`DispenseOrderView`, with its payment banner). The page
 * removes each key once it acts on it.
 */
export const dispenseOrderShowSearch = z.object({
  /** Moves a draft order to in progress. Set by the bill medications page. */
  autoAdvanceStatus: searchBoolean(),
  /**
   * An issued invoice: the page opens its payment sheet. Set by the bill
   * medications page, and by the page when it issues an invoice.
   */
  collectPayment: searchString(),
});

/** The medication returns of a pharmacy (`MedicationReturnList`). */
export const medicationReturnListSearch = z.object({
  ...paginationSearch,
  status: searchEnum(["all", ...Object.values(DeliveryOrderStatus)]),
  patient_external_id: searchString(),
  patient_name: searchString(),
});

/** A medication return (`MedicationReturnShow`). */
export const medicationReturnShowSearch = z.object({
  /**
   * Comma-separated ids of the dispense orders that the medicines return
   * from. Set by the dispense order list and the dispense order page.
   */
  dispenseOrderIds: searchString(),
});

/** The dispensed items sheet of a prescribed medicine. */
export const dispensedItemsSearch = z.object({
  ...paginationSearch,
});
