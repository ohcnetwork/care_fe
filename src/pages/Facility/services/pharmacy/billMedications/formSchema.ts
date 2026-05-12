import { lotSelectionSchema } from "@/pages/Facility/services/inventory/InventoryItemsSelector";
import {
  SubstitutionReason,
  SubstitutionType,
} from "@/types/emr/medicationDispense/medicationDispense";
import {
  MedicationRequestDosageInstruction,
  MedicationRequestRead,
} from "@/types/emr/medicationRequest/medicationRequest";
import { PrescriptionRead } from "@/types/emr/prescription/prescription";
import { ProductKnowledgeBase } from "@/types/inventory/productKnowledge/productKnowledge";
import { add, decimal, isPositive } from "@/Utils/decimal";
import { z } from "zod";

const billMedicationLineItemSchema = z
  .object({
    /** The reference id for the dispense line item */
    reference_id: z.string().uuid(),

    /** Whether the item is selected for billing */
    isSelected: z.boolean(),

    /** The medication request */
    medication: z.custom<MedicationRequestRead>().nullable(),

    /** The dosage instructions, when medicines are added without medication request / prescription. */
    dosageInstructions: z
      .custom<MedicationRequestDosageInstruction[]>()
      .nullable(),

    /** The product knowledge (either from medication request or product knowledge select from add medication flow) */
    productKnowledge: z.custom<ProductKnowledgeBase>().nullable(),

    /** The substitution details, when the medication is substituted with another product. */
    substitution: z
      .object({
        substitutedProductKnowledge: z.custom<ProductKnowledgeBase>(),
        type: z.nativeEnum(SubstitutionType),
        reason: z.nativeEnum(SubstitutionReason),
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
