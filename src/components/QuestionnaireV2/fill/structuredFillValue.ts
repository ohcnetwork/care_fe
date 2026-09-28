import { z } from "zod";

import type { ResolvedStructuredType } from "@/components/QuestionnaireV2/structured/registry";

import { CodeSchema } from "@/types/base/code/code";
import {
  DIAGNOSIS_CATEGORY,
  DIAGNOSIS_CLINICAL_STATUS,
  DIAGNOSIS_SEVERITY,
  DIAGNOSIS_VERIFICATION_STATUS,
} from "@/types/emr/diagnosis/diagnosis";
import type {
  QuestionnaireResponse,
  ResponseValue,
} from "@/types/questionnaire/form";
import type { Question } from "@/types/questionnaire/question";

import { structuredRecordSchemas } from "./structuredRecordSchema";
import type { FillSubject } from "./subject";

const clinicalCodeSchema = CodeSchema.extend({
  code: z.string().trim().min(1),
  system: z.string().trim().min(1),
  display: z.string().trim().min(1),
});
const clinicalRecordSchema = z
  .object({
    id: z.string().min(1).optional(),
    code: clinicalCodeSchema,
    clinical_status: z.enum(DIAGNOSIS_CLINICAL_STATUS),
    verification_status: z.enum(DIAGNOSIS_VERIFICATION_STATUS),
    severity: z.enum(DIAGNOSIS_SEVERITY).nullable(),
    category: z.string().min(1),
    note: z
      .string()
      .nullish()
      .transform((note) => note ?? undefined),
    onset: z
      .looseObject({
        onset_datetime: z.string().optional(),
        onset_age: z.string().optional(),
        onset_string: z.string().optional(),
        note: z.string().optional(),
      })
      .optional(),
    recorded_date: z.string().optional(),
  })
  .loose();

type StructuredFillResult =
  { ok: true; value: ResponseValue } | { ok: false; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/** These clinical lists accept complete changed rows, preserving every row
 *  omitted by the caller. Other structured inputs keep replacement semantics. */
function mergeClinicalRows(
  incoming: Record<string, unknown>[],
  existing: unknown[],
  type: string,
): { ok: true; rows: unknown[] } | { ok: false; error: string } {
  const codeOf = (row: Record<string, unknown>) =>
    isRecord(row.code) ? row.code.code : undefined;
  const active = (row: Record<string, unknown>) =>
    row.verification_status !== "entered_in_error";
  const updatedIds = new Set(incoming.map((row) => row.id).filter(Boolean));
  const replacements = new Map<number, Record<string, unknown>>();
  const additions: Record<string, unknown>[] = [];
  const ids = new Set<unknown>();

  for (const row of incoming) {
    if (row.id && ids.has(row.id)) {
      return { ok: false, error: `Duplicate ${type} record id "${row.id}"` };
    }
    if (row.id) ids.add(row.id);
    let matches = existing.flatMap((entry, index) => {
      if (!isRecord(entry)) return [];
      // Explicit ids take precedence. Code-only updates retain saved ids;
      // records entered in error do not prevent adding that code again.
      const matches = row.id
        ? entry.id === row.id
        : !updatedIds.has(entry.id) &&
          (active(entry) || !active(row)) &&
          codeOf(entry) === codeOf(row);
      return matches ? [index] : [];
    });
    if (!row.id && !active(row)) {
      // Invalidate the active record first. On a retry, match the record
      // already marked in error instead of appending another error row.
      const activeMatches = matches.filter((index) =>
        active(existing[index] as Record<string, unknown>),
      );
      if (activeMatches.length) matches = activeMatches;
    }
    if (matches.length > 1) {
      return {
        ok: false,
        error: `Multiple ${type} records match; provide a unique record id`,
      };
    }
    const index = matches[0];
    if (index === undefined) {
      additions.push(row);
    } else {
      if (replacements.has(index)) {
        return { ok: false, error: `Duplicate ${type} code "${codeOf(row)}"` };
      }
      const previous = existing[index] as Record<string, unknown>;
      replacements.set(index, {
        ...row,
        ...(typeof previous.id === "string" && previous.id
          ? { id: previous.id }
          : {}),
      });
    }
  }

  // Check changed rows against the proposed state, without validating or
  // normalizing untouched rows (which may predate the current schema).
  const seen = existing.filter(
    (row, index): row is Record<string, unknown> =>
      !replacements.has(index) && isRecord(row),
  );
  for (const row of [...replacements.values(), ...additions]) {
    if (
      active(row) &&
      seen.some((entry) => active(entry) && codeOf(entry) === codeOf(row))
    ) {
      return { ok: false, error: `Duplicate ${type} code "${codeOf(row)}"` };
    }
    seen.push(row);
  }
  return {
    ok: true,
    rows: [
      ...existing.map((row, index) => replacements.get(index) ?? row),
      ...additions,
    ],
  };
}

/** Structured answers carry one array of domain records, regardless of
 *  the questionnaire's primitive-answer repeats setting. */
export function coerceStructuredFillValue(
  question: Question,
  rawValues: unknown[],
  current: QuestionnaireResponse,
  definition: ResolvedStructuredType,
  subject: FillSubject,
): StructuredFillResult {
  const type = question.structured_type;
  const fail = (error: string): StructuredFillResult => ({ ok: false, error });
  if (!type || type === "files" || definition.draftPolicy === "exclude") {
    return fail(
      `Question "${question.link_id}" cannot be filled with JSON records`,
    );
  }
  const mergeRows = ["diagnosis", "symptom", "allergy_intolerance"].includes(
    type,
  );
  if (
    ["encounter", "appointment", "time_of_death"].includes(type) &&
    rawValues.length > 1
  ) {
    return fail(
      `Question "${question.link_id}" accepts at most one ${type} record`,
    );
  }

  let data: unknown[] = [];
  if (type === "time_of_death") {
    const parsed = z
      .array(z.iso.datetime({ offset: true }))
      .safeParse(rawValues);
    if (!parsed.success)
      return fail("Time of death must be an ISO datetime with a timezone");
    data = parsed.data;
  } else {
    if (!rawValues.every(isRecord))
      return fail(`${type} values must be JSON objects`);
    data = rawValues.map((raw) => {
      const row = { ...raw };
      if (
        "patientId" in subject &&
        ("patient" in row || type === "charge_item")
      ) {
        row.patient = subject.patientId;
      }
      if (
        subject.type === "encounter" &&
        ("encounter" in row ||
          [
            "diagnosis",
            "symptom",
            "medication_request",
            "service_request",
            "charge_item",
          ].includes(type))
      ) {
        row.encounter = subject.encounterId;
      }
      if (type === "service_request" && isRecord(row.service_request)) {
        const nested = { ...row.service_request };
        if ("patient" in nested && "patientId" in subject)
          nested.patient = subject.patientId;
        if ("encounter" in nested && subject.type === "encounter")
          nested.encounter = subject.encounterId;
        row.service_request = nested;
      }
      if (type === "diagnosis" || type === "medication_request")
        row.dirty = true;
      return row;
    });
  }

  if (type === "diagnosis" || type === "symptom") {
    const schema = clinicalRecordSchema.extend({
      category:
        type === "diagnosis" ? z.enum(DIAGNOSIS_CATEGORY) : z.string().min(1),
      severity:
        type === "diagnosis"
          ? z.enum(DIAGNOSIS_SEVERITY).nullable()
          : z.enum(DIAGNOSIS_SEVERITY),
    });
    const parsed = z.array(schema).safeParse(data);
    if (!parsed.success) {
      return fail(
        `Invalid ${type} record: ${parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ")}`,
      );
    }
    data = parsed.data;
  }

  const recordSchema = structuredRecordSchemas[type];
  if (recordSchema) {
    const parsed = z.array(recordSchema).safeParse(data);
    if (!parsed.success) {
      return fail(
        `Invalid ${type} record: ${parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ")}`,
      );
    }
    data = parsed.data;
  }

  try {
    const errors =
      mergeRows && data.length === 0
        ? []
        : (definition.validate?.(data, question.id, !!question.required) ?? []);
    if (errors.length) {
      return fail(
        errors
          .map(
            (error) =>
              error.error ??
              error.msg ??
              error.field_key ??
              "Invalid structured value",
          )
          .join("; "),
      );
    }
  } catch {
    return fail(
      `Malformed ${type} records; provide the complete structured request fields`,
    );
  }
  if (mergeRows && data.every(isRecord)) {
    const currentRows: unknown = current.values[0]?.value;
    const merged = mergeClinicalRows(
      data,
      Array.isArray(currentRows) ? currentRows : [],
      type,
    );
    if (!merged.ok) return merged;
    data = merged.rows;
  }
  // Core definitions and plugin validators own their payload shapes; the
  // response union only enumerates compile-time core types.
  return { ok: true, value: { type, value: data } as ResponseValue };
}
