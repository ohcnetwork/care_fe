import { z } from "zod";

import { CodeSchema } from "@/types/base/code/code";

const text = z.string().min(1);
const record = z.object({ note: z.string().nullish() }).loose();
const code = CodeSchema.extend({ code: text, system: text, display: text });
const requester = record.extend({ id: text });

/** Shape checks for records that bypass the pickers. Domain validation
 * remains in each structured definition; display/context fields survive. */
export const structuredRecordSchemas: Partial<Record<string, z.ZodType>> = {
  allergy_intolerance: record.extend({
    code,
    clinical_status: text,
    verification_status: text,
    category: text,
    criticality: text,
  }),
  medication_statement: record.extend({
    medication: code,
    status: text,
    information_source: text,
    dosage_text: z.string(),
  }),
  medication_request: record
    .extend({
      medication: code.optional(),
      requested_product: text.optional(),
      dosage_instruction: z.array(record),
      authored_on: text,
      do_not_perform: z.boolean(),
      requester,
    })
    .refine((value) => !!value.medication || !!value.requested_product, {
      message: "A medication code or requested product is required",
    }),
  encounter: record.extend({
    status: text,
    priority: text,
    period: record.extend({ start: text, end: z.string().nullish() }),
    hospitalization: record.nullish(),
  }),
  appointment: record.extend({
    slot_id: text,
    note: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }),
  charge_item: record.extend({
    charge_item_definition: text,
    quantity: text,
  }),
  service_request: record.extend({
    activity_definition: text,
    service_request: record.extend({
      title: text,
      code,
      status: text,
      intent: text,
      priority: text,
      category: text,
      do_not_perform: z.boolean(),
      locations: z.array(z.string()),
      requester,
    }),
  }),
};
