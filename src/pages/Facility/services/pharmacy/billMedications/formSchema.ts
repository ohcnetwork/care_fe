import { LotSelectionSchema } from "@/pages/Facility/services/inventory/InventoryItemsSelector";
import {
  SubstitutionReason,
  SubstitutionType,
} from "@/types/emr/medicationDispense/medicationDispense";
import { MedicationRequestRead } from "@/types/emr/medicationRequest/medicationRequest";
import { PrescriptionRead } from "@/types/emr/prescription/prescription";
import { ProductKnowledgeBase } from "@/types/inventory/productKnowledge/productKnowledge";
import { z } from "zod";

// export const billMedicationsFormSchema = z.object({
//   items: z.array(
//     z.object({
//       reference_id: z.string().uuid(),
//       prescriptionId: z.string().optional(),
//       isSelected: z.boolean(),
//       medication: z.custom<MedicationRequestRead>().optional(),
//       productKnowledge: z.custom<ProductKnowledgeBase>().optional(),
//       allGiven: z.boolean(),
//       lots: z.array(
//         z.object({
//           inventory: z.string(),
//           quantity: zodDecimal({ min: 0 }),
//         }),
//       ),
//       substitution: substitutionSchema.optional(),
//     }),
//   ),
// });

const billMedicationLineItemSchema = z.object({
  isSelected: z.boolean(),
  medication: z.custom<MedicationRequestRead>().nullable(),
  productKnowledge: z.custom<ProductKnowledgeBase>().nullable(),
  substitution: z
    .object({
      substitutedProductKnowledge: z.custom<ProductKnowledgeBase>(),
      type: z.nativeEnum(SubstitutionType),
      reason: z.nativeEnum(SubstitutionReason),
    })
    .nullable(),
  lots: z.array(LotSelectionSchema),
  allGiven: z.boolean(),
});

export type BillMedicationLineItemSchemaType = z.infer<
  typeof billMedicationLineItemSchema
>;

export const billMedicationsByPrescriptionsFormSchema = z.object({
  prescriptions: z.array(
    z.object({
      prescription: z.custom<PrescriptionRead>().optional(),
      markComplete: z.boolean(),
      items: z.array(billMedicationLineItemSchema),
    }),
  ),
});
