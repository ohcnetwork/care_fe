import {
  SubstitutionReason,
  SubstitutionType,
} from "@/types/emr/medicationDispense/medicationDispense";
import {
  MedicationRequestDosageInstruction,
  MedicationRequestRead,
} from "@/types/emr/medicationRequest/medicationRequest";
import { PrescriptionRead } from "@/types/emr/prescription/prescription";
import { InventoryRead } from "@/types/inventory/product/inventory";
import { ProductKnowledgeBase } from "@/types/inventory/productKnowledge/productKnowledge";
import {
  add,
  decimal,
  isLessThanOrEqual,
  isPositive,
  zodDecimal,
} from "@/Utils/decimal";
import { z } from "zod";

const lotSelectionSchema = z
  .object({
    /*
     * The inventory item (lot) selected for dispensing.
     */
    item: z.custom<InventoryRead>(),
    /*
     * The quantity to dispense from the selected lot.
     * Should be less than or equal to the available stock (`item.net_content`).
     */
    quantity: zodDecimal({ min: 0 }),
    /*
     * Whether the lot was auto-selected by the system based on the dispense
     * quantity and available stock.
     */
    autoSelected: z.boolean().optional(),
    /**
     * The id of an existing MedicationDispense that this lot was hydrated
     * from in the edit-dispense-order flow. Used by the submit handler to
     * diff against the original snapshot.
     */
    existingDispenseId: z.string().optional(),
    /**
     * The original quantity of the existing dispense at the time it was
     * hydrated. Used together with `existingDispenseId` to determine whether
     * the lot was modified.
     */
    existingDispenseQuantity: z.string().optional(),
  })
  .refine(
    (data) =>
      data.quantity && isLessThanOrEqual(data.quantity, data.item.net_content),
    {
      path: ["quantity"],
      message: "Insufficient stock",
    },
  );

export type LotSelection = z.infer<typeof lotSelectionSchema>;

export const billMedicationLineItemSchema = z
  .object({
    /** The reference id for the dispense line item */
    reference_id: z.uuid(),

    /** Whether the item is selected for billing */
    isSelected: z.boolean(),

    /** The medication request */
    medication: z.custom<MedicationRequestRead>().nullable(),

    /**
     * Encounter override. Used by the edit-dispense-order flow where a
     * single page can carry items from multiple encounters. When set, takes
     * precedence over `medication?.encounter` and the page-level fallback.
     */
    encounterOverride: z.string().optional(),

    /** The dosage instructions for the product */
    dosageInstructions: z.custom<MedicationRequestDosageInstruction[]>(),

    /** The product knowledge (either from medication request or product knowledge select from add medication flow) */
    productKnowledge: z.custom<ProductKnowledgeBase>().nullable(),

    /** The substitution details, when the medication is substituted with another product. */
    substitution: z
      .object({
        substitutedProductKnowledge: z.custom<ProductKnowledgeBase>(),
        type: z.enum(SubstitutionType),
        reason: z.enum(SubstitutionReason),
      })
      .nullable(),

    /** The selected inventory items for the dispense line item */
    lots: z.array(lotSelectionSchema),

    /** Whether the medication is fully dispensed */
    allGiven: z.boolean(),
  })
  .refine(
    (data) => {
      return (
        data.isSelected === false ||
        data.substitution?.substitutedProductKnowledge ||
        data.productKnowledge
      );
    },
    {
      path: [""],
      message: "Select a product or substitute the medication",
    },
  )
  .refine((data) => data.isSelected === false || data.lots.length > 0, {
    path: [""],
    message: "At least one lot is required",
  })
  .refine(
    (data) =>
      data.isSelected === false ||
      isPositive(
        data.lots
          .map((lot) => lot.quantity || "0")
          .reduce((acc, quantity) => add(acc, quantity), decimal(0)),
      ),
    {
      path: [""],
      message: "Quantity must be greater than 0",
    },
  );

export type BillMedicationLineItemSchemaType = z.infer<
  typeof billMedicationLineItemSchema
>;

export const billMedicationsFormSchema = z
  .object({
    /** Medicines added from prescriptions */
    prescriptions: z.array(
      z.object({
        prescription: z.custom<PrescriptionRead>(),
        markComplete: z.boolean(),
        items: z.array(billMedicationLineItemSchema),
      }),
    ),

    /** The other items (medicines added without prescription) */
    otherItems: z.array(billMedicationLineItemSchema),
  })
  .refine(
    (data) => {
      const items = [
        ...data.prescriptions.flatMap(({ items }) => items),
        ...data.otherItems,
      ];
      return items.filter((item) => item.isSelected).length > 0;
    },
    {
      path: [""],
      message: "At least one medication must be selected",
    },
  );
