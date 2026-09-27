import { z } from "zod";

import type { RendererSubject } from "@/components/QuestionnaireV2/form/types";

import { CodeSchema } from "@/types/base/code/code";
import { Classification } from "@/types/emr/activityDefinition/activityDefinition";
import activityDefinitionApi from "@/types/emr/activityDefinition/activityDefinitionApi";
import {
  ACTIVE_MEDICATION_STATUSES,
  MEDICATION_REQUEST_INTENT,
  MedicationCategory,
  UCUM_TIME_UNITS,
} from "@/types/emr/medicationRequest/medicationRequest";
import { PrescriptionStatus } from "@/types/emr/prescription/prescription";
import {
  Intent,
  Priority,
  Status,
} from "@/types/emr/serviceRequest/serviceRequest";
import productKnowledgeApi from "@/types/inventory/productKnowledge/productKnowledgeApi";
import type {
  QuestionnaireResponse,
  ResponseValue,
} from "@/types/questionnaire/form";
import type { Question } from "@/types/questionnaire/question";
import type { QuestionnaireRead } from "@/types/questionnaire/questionnaire";
import type { QuestionnaireAnswer } from "@/types/questionnaire/questionnaireResponseTemplate";
import type { UserReadMinimal } from "@/types/user/user";

export type StructuredTemplateType = "medication_request" | "service_request";

export interface StructuredTemplateContext {
  subject: RendererSubject;
  currentUser: UserReadMinimal;
  signal?: AbortSignal;
}

const code = CodeSchema.extend({ code: z.string().min(1) });
const quantity = z.object({ value: z.string(), unit: code });
const doseRange = z.object({ low: quantity, high: quantity });
const duration = z.object({ value: z.string(), unit: z.enum(UCUM_TIME_UNITS) });

// Schemas are allowlists at both save and apply. Clinical instance fields and
// unknown nested fields must never travel from one patient's form to another.
const dosage = z.object({
  sequence: z.number().optional(),
  text: z.string().optional(),
  additional_instruction: z.array(code).optional(),
  patient_instruction: z.string().optional(),
  timing: z
    .object({
      repeat: z.object({
        frequency: z.number(),
        period: z.string(),
        period_unit: z.enum(UCUM_TIME_UNITS),
        bounds_duration: duration.optional(),
        bounds_range: z.object({ low: duration, high: duration }).optional(),
        // Absolute course dates are patient-specific. Reject the field instead
        // of dropping a bound and changing a finite course into an ongoing one.
        bounds_period: z.never().optional(),
      }),
      code: code.optional(),
    })
    .optional(),
  as_needed_boolean: z.boolean(),
  as_needed_for: code.optional(),
  site: code.optional(),
  route: code.optional(),
  method: code.optional(),
  dose_and_rate: z
    .object({
      type: z.enum(["ordered", "calculated"]),
      dose_quantity: quantity.optional(),
      dose_range: doseRange.optional(),
    })
    .optional(),
  max_dose_per_period: doseRange.optional(),
});

const medication = z
  .object({
    status: z.enum(ACTIVE_MEDICATION_STATUSES).optional(),
    intent: z.enum(MEDICATION_REQUEST_INTENT).optional(),
    category: z.enum(MedicationCategory).optional(),
    priority: z.enum(["stat", "urgent", "asap", "routine"]).optional(),
    do_not_perform: z.boolean(),
    medication: code.optional(),
    requested_product: z.string().min(1).optional(),
    requested_product_name: z.string().optional(),
    dosage_instruction: z.array(dosage),
    note: z.string().optional(),
    create_prescription: z.object({ note: z.string().optional() }).optional(),
  })
  .refine((row) => !!row.medication || !!row.requested_product);

const service = z.object({
  slug: z.string().min(1),
  service_request: z.object({
    title: z.string(),
    status: z.enum([Status.active, Status.draft]),
    intent: z.enum(Intent),
    priority: z.enum(Priority),
    category: z.enum(Classification),
    do_not_perform: z.boolean(),
    note: z.string().nullable(),
    code,
    body_site: code.nullable(),
    patient_instruction: z.string().nullable(),
    // Scheduled orders cannot be safely reused with their dates removed.
    occurance: z.null().optional(),
  }),
});

export function isSupportedStructuredTemplateType(
  type: string | null | undefined,
): type is StructuredTemplateType {
  return type === "medication_request" || type === "service_request";
}

/** null means the field cannot be saved safely; the caller shows it among
 * excluded fields. An empty list means it has no reusable active entries. */
function serializeStructuredTemplateValue(
  value: ResponseValue,
): Record<string, unknown>[] | null {
  if (value.type === "medication_request") {
    const rows = (value.value ?? [])
      .filter(
        (row) =>
          !row.status ||
          ACTIVE_MEDICATION_STATUSES.includes(
            row.status as (typeof ACTIVE_MEDICATION_STATUSES)[number],
          ),
      )
      .map((row) => ({
        ...row,
        requested_product: row.requested_product_internal?.slug,
        requested_product_name: row.requested_product_internal?.name,
        medication: row.requested_product ? undefined : row.medication,
      }));
    const parsed = z.array(medication).safeParse(rows);
    return parsed.success ? parsed.data : null;
  }
  if (value.type === "service_request") {
    const rows = (value.value ?? []).map((row) => ({
      slug: row.activity_definition,
      service_request: row.service_request,
    }));
    const parsed = z.array(service).safeParse(rows);
    return parsed.success ? parsed.data : null;
  }
  return null;
}

/** Resolves current catalog references before the caller changes the form.
 * Only GETs occur here. A missing definition rejects the entire field so an
 * order set is never partly applied without the clinician being informed. */
async function hydrateStructuredTemplateValue(
  type: StructuredTemplateType,
  rows: unknown[],
  { subject, currentUser, signal }: StructuredTemplateContext,
): Promise<ResponseValue> {
  if (!subject.encounterId || !subject.patientId || !subject.facilityId) {
    throw new Error("Order templates require an encounter");
  }
  const { encounterId, facilityId } = subject;
  const { default: query } = await import("@/Utils/request/query");
  const requestSignal = signal ?? new AbortController().signal;
  if (type === "medication_request") {
    const entries = z.array(medication).parse(rows);
    const medications = await Promise.all(
      entries.map(async (entry) => {
        const product = entry.requested_product
          ? await query(productKnowledgeApi.retrieveProductKnowledge, {
              pathParams: { slug: entry.requested_product },
            })({ signal: requestSignal })
          : undefined;
        if (product && (!product.id || product.status !== "active")) {
          throw new Error("The medication is no longer available");
        }
        const { requested_product_name: _productName, ...request } = entry;
        return {
          ...request,
          requested_product: product?.id,
          requested_product_internal: product,
          medication: product ? undefined : entry.medication,
          encounter: encounterId,
          requester: currentUser,
          authored_on: new Date().toISOString(),
          dirty: true,
          create_prescription: {
            ...entry.create_prescription,
            status: PrescriptionStatus.active,
            alternate_identifier: "",
          },
        };
      }),
    );
    return { type, value: medications };
  }
  const entries = z.array(service).parse(rows);
  const requests = await Promise.all(
    entries.map(async (entry) => {
      const definition = await query(
        activityDefinitionApi.retrieveActivityDefinition,
        {
          pathParams: {
            facilityId,
            activityDefinitionSlug: entry.slug,
          },
        },
      )({ signal: requestSignal });
      if (!definition.slug || definition.status !== "active") {
        throw new Error("The service is no longer available");
      }
      return {
        activity_definition: definition.slug,
        encounter: encounterId,
        service_request: {
          ...entry.service_request,
          title: definition.title,
          category: definition.classification,
          code: definition.code,
          occurance: null,
          requester: currentUser,
          locations: definition.locations?.map((location) => location.id) ?? [],
        },
      };
    }),
  );
  return { type, value: requests };
}

interface StoredStructuredResponse {
  question_id: string;
  link_id: string;
  structured_type: StructuredTemplateType;
  values: { type: StructuredTemplateType; value: Record<string, unknown>[] }[];
  note?: string;
}

export function serializeStructuredTemplateResponse(
  question: Question,
  response: QuestionnaireResponse,
): StoredStructuredResponse | null {
  if (
    question.type !== "structured" ||
    question.read_only ||
    !isSupportedStructuredTemplateType(question.structured_type) ||
    question.structured_type !== response.structured_type ||
    response.sub_results ||
    response.values.length !== 1 ||
    response.values[0].type !== question.structured_type
  )
    return null;
  const rows = serializeStructuredTemplateValue(response.values[0]);
  if (!rows?.length) return null;
  return {
    question_id: question.id,
    link_id: question.link_id,
    structured_type: question.structured_type,
    // Stored configurations intentionally omit fields required by live inputs.
    // Only hydration below may turn these back into live response values.
    values: [{ type: question.structured_type, value: rows }],
    ...(response.note ? { note: response.note } : {}),
  };
}

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/** Structured children inside repeating groups need path-based hydration;
 * those remain excluded. Non-repeating groups are flattened by the engine. */
function orderQuestions(questions: Question[]): Question[] {
  return questions.flatMap((question) =>
    question.type === "group" && !question.repeats
      ? orderQuestions(question.questions ?? [])
      : question.type === "structured"
        ? [question]
        : [],
  );
}

export async function hydrateStructuredTemplateEntries(
  questionnaire: QuestionnaireRead,
  entries: QuestionnaireAnswer[],
  context: StructuredTemplateContext,
): Promise<{
  responses: Record<string, QuestionnaireResponse>;
  unavailable: string[];
}> {
  const questions = new Map(
    orderQuestions(questionnaire.questions).map((question) => [
      question.id,
      question,
    ]),
  );
  const responses: Record<string, QuestionnaireResponse> = {};
  const unavailable = new Set<string>();
  const seen = new Set<string>();
  await Promise.all(
    entries.map(async (entry) => {
      const question = questions.get(entry.question_id);
      if (!question) return;
      if (seen.has(question.id)) {
        unavailable.add(question.text);
        return;
      }
      seen.add(question.id);
      const answer = entry.answer;
      const type = question.structured_type;
      const value = Array.isArray(answer?.values)
        ? answer.values[0]
        : undefined;
      if (
        question.read_only ||
        !isSupportedStructuredTemplateType(type) ||
        !record(answer) ||
        entry.meta?.type !== "structured" ||
        answer.question_id !== question.id ||
        answer.structured_type !== type ||
        !Array.isArray(answer.values) ||
        answer.values.length !== 1 ||
        answer.sub_results !== undefined ||
        !record(value) ||
        value.type !== type ||
        !Array.isArray(value.value) ||
        !value.value.length
      ) {
        unavailable.add(question.text);
        return;
      }
      try {
        const hydrated = await hydrateStructuredTemplateValue(
          type,
          value.value,
          context,
        );
        responses[question.id] = {
          question_id: question.id,
          link_id: question.link_id,
          structured_type: type,
          values: [hydrated],
          ...(typeof answer.note === "string" ? { note: answer.note } : {}),
        };
      } catch (error) {
        if (context.signal?.aborted) throw error;
        unavailable.add(question.text);
      }
    }),
  );
  return { responses, unavailable: [...unavailable] };
}
