import { z } from "zod";

import {
  SubstitutionReason,
  SubstitutionType,
} from "@/types/emr/medicationDispense/medicationDispense";
import {
  MedicationRequestDosageInstruction,
  MedicationRequestRead,
} from "@/types/emr/medicationRequest/medicationRequest";
import { ProductKnowledgeBase } from "@/types/inventory/productKnowledge/productKnowledge";
import { zodDecimal } from "@/Utils/decimal";

/**
 * Represents a single lot selection with inventory and quantity
 */
export interface MedicationBillLotItem {
  selectedInventoryId: string;
  quantity: string;
}

/**
 * Represents substitution details when a medication is substituted with another product
 */
export interface MedicationBillSubstitution {
  substitutedProductKnowledge?: ProductKnowledgeBase;
  type: SubstitutionType;
  reason: SubstitutionReason;
}

/**
 * Represents a single item in the medication billing form
 */
export interface MedicationBillFormItem {
  reference_id: string;
  medication?: MedicationRequestRead;
  productKnowledge?: ProductKnowledgeBase;
  isSelected: boolean;
  fully_dispensed: boolean;
  dosageInstructions?: MedicationRequestDosageInstruction[];
  lots: MedicationBillLotItem[];
  substitution?: MedicationBillSubstitution;
  prescriptionId?: string;
}

/**
 * Form values for the medication billing form
 */
export interface MedicationBillFormValues {
  items: MedicationBillFormItem[];
}

/**
 * Form item with react-hook-form field array id
 */
export type MedicationBillField = MedicationBillFormItem & { id: string };

/**
 * Zod schema for form validation
 */
export const medicationBillFormSchema = z.object({
  items: z.array(
    z.object({
      reference_id: z.string().uuid(),
      medication: z.custom<MedicationRequestRead>().optional(),
      productKnowledge: z.custom<ProductKnowledgeBase>().optional(),
      isSelected: z.boolean(),
      fully_dispensed: z.boolean(),
      dosageInstructions: z
        .custom<MedicationRequestDosageInstruction[]>()
        .optional(),
      lots: z
        .array(
          z.object({
            selectedInventoryId: z.string(),
            quantity: zodDecimal({ min: 0 }),
          }),
        )
        .min(1),
      substitution: z
        .object({
          substitutedProductKnowledge: z
            .custom<ProductKnowledgeBase>()
            .optional(),
          type: z.nativeEnum(SubstitutionType),
          reason: z.nativeEnum(SubstitutionReason),
        })
        .optional(),
      prescriptionId: z.string().optional(),
    }),
  ),
});
