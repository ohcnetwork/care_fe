import type { TFunction } from "i18next";

import {
  formatDosage,
  formatDuration,
  formatFrequency,
  formatSig,
} from "@/components/Medicine/utils";
import { entryIsAnswered } from "@/components/QuestionnaireV2/form/engine/inputs/answeredEntry";
import { initializeResponses } from "@/components/QuestionnaireV2/form/engine/store";

import type { Code } from "@/types/base/code/code";
import type { MedicationRequestDosageInstruction } from "@/types/emr/medicationRequest/medicationRequest";
import type {
  QuestionnaireResponse,
  ResponseValue,
} from "@/types/questionnaire/form";
import type { Question, QuestionType } from "@/types/questionnaire/question";
import type { QuestionnaireRead } from "@/types/questionnaire/questionnaire";
import type { QuestionnaireAnswer } from "@/types/questionnaire/questionnaireResponseTemplate";

import {
  isSupportedStructuredTemplateType,
  serializeStructuredTemplateResponse,
} from "./structuredTemplate";

interface TemplateResponse {
  question_id: string;
  link_id: string;
  structured_type: QuestionnaireResponse["structured_type"];
  values: Record<string, unknown>[];
  note?: string;
  sub_results?: TemplateResponse[][];
}

const valueTypes: Partial<Record<QuestionType, string>> = {
  boolean: "boolean",
  decimal: "number",
  integer: "number",
  date: "date",
  dateTime: "dateTime",
  time: "time",
  string: "string",
  text: "string",
  url: "string",
  choice: "string",
  quantity: "quantity",
};

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function safeCode(value: unknown): Code | undefined {
  if (
    !record(value) ||
    typeof value.code !== "string" ||
    typeof value.system !== "string" ||
    typeof value.display !== "string"
  )
    return;
  return { code: value.code, system: value.system, display: value.display };
}

/** The same notion of answered as validation: zero, false and code-only choices count. */
function hasContent(
  response: QuestionnaireResponse | TemplateResponse | undefined,
): boolean {
  return (
    !!response &&
    (!!response.note ||
      response.values.some((value) =>
        entryIsAnswered(value as ResponseValue),
      ) ||
      !!response.sub_results?.some((row) => row.some(hasContent)))
  );
}

/** This allowlist is used both before persistence and after reading untrusted template JSON. */
function safeValue(
  question: Question,
  raw: unknown,
): Record<string, unknown> | undefined {
  if (!record(raw) || raw.type !== valueTypes[question.type]) return;
  let value = raw.value;
  if (raw.type === "date" || raw.type === "dateTime") {
    if (!(value instanceof Date) && typeof value !== "string") return;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return;
    value = date.toISOString();
  } else if (raw.type === "number" || raw.type === "quantity") {
    if (
      value !== undefined &&
      value !== null &&
      value !== "" &&
      ((typeof value !== "number" && typeof value !== "string") ||
        !Number.isFinite(Number(value)))
    )
      return;
  } else if (raw.type === "boolean") {
    if (value !== undefined && typeof value !== "boolean") return;
  } else if (value !== undefined && typeof value !== "string") return;
  const coding = safeCode(raw.coding);
  const unit = safeCode(raw.unit);
  const safe = {
    type: raw.type,
    ...(value !== undefined ? { value } : {}),
    ...(coding ? { coding } : {}),
    ...(unit ? { unit } : {}),
  };
  return entryIsAnswered(safe as ResponseValue) ? safe : undefined;
}

function roots(questions: Question[]): Question[] {
  return questions.flatMap((question) =>
    question.type === "group" && !question.repeats && !question.read_only
      ? roots(question.questions ?? [])
      : [question],
  );
}

function excludedTitles(questions: Question[], insideRepeat = false): string[] {
  return questions.flatMap((question) => {
    if (
      question.read_only ||
      (question.type === "structured" &&
        (insideRepeat ||
          !isSupportedStructuredTemplateType(question.structured_type)))
    )
      return [question.text];
    return excludedTitles(
      question.questions ?? [],
      insideRepeat || !!question.repeats,
    );
  });
}

function captureResponse(
  question: Question,
  raw: QuestionnaireResponse | undefined,
  excluded: Set<string>,
  insideRepeat = false,
): TemplateResponse | undefined {
  if (!raw || question.read_only || question.type === "display") return;
  if (question.type === "structured") {
    if (
      insideRepeat ||
      !isSupportedStructuredTemplateType(question.structured_type)
    )
      return;
    const serialized = serializeStructuredTemplateResponse(question, raw);
    if (!serialized) {
      if (hasContent(raw)) excluded.add(question.text);
      return;
    }
    return {
      question_id: question.id,
      link_id: question.link_id,
      structured_type: question.structured_type ?? null,
      values: serialized.values.map((value) => ({ ...value })),
      ...(serialized.note ? { note: serialized.note } : {}),
    };
  }
  const response: TemplateResponse = {
    question_id: question.id,
    link_id: question.link_id,
    structured_type: null,
    values: [],
    ...(raw.note ? { note: raw.note } : {}),
  };
  if (question.type === "group") {
    response.sub_results = (raw.sub_results ?? [])
      .map((row) => {
        const byId = new Map(row.map((item) => [item.question_id, item]));
        return roots(question.questions ?? []).flatMap((child) => {
          const captured = captureResponse(
            child,
            byId.get(child.id),
            excluded,
            true,
          );
          return captured ? [captured] : [];
        });
      })
      .filter((row) => row.some(hasContent));
  } else {
    response.values = raw.values.flatMap((value) => {
      const safe = safeValue(question, value);
      return safe ? [safe] : [];
    });
  }
  return hasContent(response) ? response : undefined;
}

function questionTypes(question: Question): Record<string, QuestionType> {
  return Object.assign(
    { [question.id]: question.type },
    ...(question.questions ?? []).map(questionTypes),
  );
}

function questionLabels(question: Question): Record<string, string> {
  return Object.assign(
    { [question.id]: question.text },
    ...(question.questions ?? []).map(questionLabels),
  );
}

/** Patient/encounter IDs, observation timestamps and draft baselines are never copied. */
export function captureFormTemplate(
  questionnaire: QuestionnaireRead,
  responses: Record<string, QuestionnaireResponse>,
): {
  entries: QuestionnaireAnswer[];
  excluded: string[];
  answerCount: number;
} {
  const excluded = new Set(excludedTitles(questionnaire.questions));
  const entries = roots(questionnaire.questions).flatMap((question) => {
    const captured = captureResponse(
      question,
      responses[question.id],
      excluded,
    );
    return captured
      ? [
          {
            question_id: question.id,
            answer: { ...captured },
            meta: {
              type: question.type,
              label: question.text,
              question_types: questionTypes(question),
              question_labels: questionLabels(question),
            },
          },
        ]
      : [];
  });
  return {
    entries,
    excluded: [...excluded],
    answerCount: entries.length,
  };
}

/** Parse one saved response against the CURRENT form, never trusting an answer blob's IDs or shape. */
function parseResponse(
  question: Question,
  raw: unknown,
  types: Record<string, unknown>,
  labels: Record<string, unknown>,
  unavailable: Set<string>,
): QuestionnaireResponse | undefined {
  const reject = () => {
    unavailable.add(question.text);
    return undefined;
  };
  if (
    question.read_only ||
    question.type === "structured" ||
    question.type === "display" ||
    !record(raw) ||
    raw.question_id !== question.id ||
    raw.structured_type !== null ||
    types[question.id] !== question.type ||
    !Array.isArray(raw.values)
  )
    return reject();
  const response: QuestionnaireResponse = {
    question_id: question.id,
    link_id: question.link_id,
    structured_type: null,
    values: [],
  };
  if (typeof raw.note === "string") response.note = raw.note;
  if (question.type === "group") {
    if (
      !question.repeats ||
      !Array.isArray(raw.sub_results) ||
      raw.sub_results.some((row) => !Array.isArray(row))
    )
      return reject();
    const children = new Map(
      roots(question.questions ?? []).map((child) => [child.id, child]),
    );
    response.sub_results = [];
    for (const row of raw.sub_results as unknown[][]) {
      // Every current child needs a response slot: input updates intentionally
      // ignore missing slots, including fields added since this template was saved.
      const parsed = initializeResponses(question.questions ?? []);
      let restored = false;
      const seen = new Set<string>();
      for (const item of row) {
        if (
          !record(item) ||
          typeof item.question_id !== "string" ||
          seen.has(item.question_id)
        )
          return reject();
        seen.add(item.question_id);
        const child = children.get(item.question_id);
        if (!child) {
          const savedLabel = labels[item.question_id];
          unavailable.add(
            typeof savedLabel === "string"
              ? savedLabel
              : typeof item.link_id === "string"
                ? item.link_id
                : question.text,
          );
          continue;
        }
        const value = parseResponse(child, item, types, labels, unavailable);
        if (value) {
          parsed[child.id] = value;
          restored = true;
        }
      }
      if (restored) response.sub_results.push(Object.values(parsed));
    }
  } else {
    if (raw.sub_results !== undefined) return reject();
    for (const rawValue of raw.values) {
      const value = safeValue(question, rawValue);
      if (!value) return reject();
      if (
        question.type === "choice" &&
        question.answer_option?.length &&
        !question.answer_option.some((option) => option.value === value.value)
      )
        return reject();
      if (
        question.type === "quantity" &&
        question.unit &&
        !question.answer_value_set
      ) {
        const unit = safeCode(value.coding) ?? safeCode(value.unit);
        if (
          unit &&
          (unit.code !== question.unit.code ||
            unit.system !== question.unit.system)
        )
          return reject();
      }
      if (value.type === "date" || value.type === "dateTime")
        value.value = new Date(value.value as string);
      response.values.push(value as ResponseValue);
    }
    if (!question.repeats && response.values.length > 1) return reject();
  }
  return hasContent(response) ? response : undefined;
}

export type FormTemplateApplyMode = "empty" | "replace";

/** Repeating groups are one unit. Other fields and every excluded current answer remain untouched. */
export function applyFormTemplate(
  questionnaire: QuestionnaireRead,
  current: Record<string, QuestionnaireResponse>,
  entries: QuestionnaireAnswer[],
  mode: FormTemplateApplyMode = "empty",
  hydrated: Record<string, QuestionnaireResponse> = {},
): {
  responses: Record<string, QuestionnaireResponse>;
  appliedCount: number;
  preservedCount: number;
  unavailable: string[];
} {
  const responses = { ...current };
  const questions = new Map(
    roots(questionnaire.questions).map((question) => [question.id, question]),
  );
  const unavailable = new Set<string>();
  const seen = new Set<string>();
  let appliedCount = 0;
  let preservedCount = 0;
  for (const entry of entries) {
    const label =
      typeof entry?.meta?.label === "string"
        ? entry.meta.label
        : entry?.question_id;
    const question = questions.get(entry?.question_id);
    if (!question || seen.has(question.id)) {
      unavailable.add(label || "");
      continue;
    }
    seen.add(question.id);
    const types = record(entry.meta?.question_types)
      ? entry.meta.question_types
      : { [question.id]: entry.meta?.type };
    const labels = record(entry.meta?.question_labels)
      ? entry.meta.question_labels
      : {};
    const hydratedResponse = hydrated[question.id];
    const parsed =
      question.type === "structured"
        ? !question.read_only &&
          entry.meta?.type === "structured" &&
          isSupportedStructuredTemplateType(question.structured_type) &&
          hydratedResponse?.question_id === question.id &&
          hydratedResponse.structured_type === question.structured_type
          ? structuredClone(hydratedResponse)
          : undefined
        : parseResponse(question, entry.answer, types, labels, unavailable);
    if (question.type === "structured" && !parsed)
      unavailable.add(question.text);
    if (!parsed) continue;
    if (mode === "empty" && hasContent(current[question.id])) {
      preservedCount++;
      continue;
    }
    // Do not discard structured or newly added children of a populated repeat
    // container. Row identities are positional and cannot be matched safely.
    if (
      question.type === "group" &&
      hasContent(current[question.id]) &&
      excludedTitles(question.questions ?? [], true).length > 0
    ) {
      unavailable.add(question.text);
      continue;
    }
    const existing = current[question.id];
    // The template replaces answers, not observation context collected for
    // this patient. Never restore these fields from the saved template.
    responses[question.id] =
      question.type !== "group" && question.type !== "structured" && existing
        ? {
            ...parsed,
            ...(existing.taken_at !== undefined
              ? { taken_at: existing.taken_at }
              : {}),
            ...(existing.body_site !== undefined
              ? { body_site: existing.body_site }
              : {}),
            ...(existing.method !== undefined
              ? { method: existing.method }
              : {}),
          }
        : parsed;
    appliedCount++;
  }
  return {
    responses,
    appliedCount,
    preservedCount,
    unavailable: [...unavailable],
  };
}

/** Compact text preview; React renders these strings as text, never HTML. */
export function previewFormTemplate(
  entries: QuestionnaireAnswer[],
  t?: TFunction,
): { id: string; label: string; value: string }[] {
  const preview = (raw: unknown): string => {
    if (!record(raw)) return "";
    const rows = Array.isArray(raw.sub_results)
      ? raw.sub_results.flatMap((row) =>
          Array.isArray(row) ? row.map(preview) : [],
        )
      : [];
    const values = Array.isArray(raw.values)
      ? raw.values.flatMap((entry) => {
          if (!record(entry)) return [];
          const coding = safeCode(entry.coding);
          const unit = safeCode(entry.unit);
          if (entry.type === "boolean" && typeof entry.value === "boolean")
            return [t ? t(entry.value ? "yes" : "no") : String(entry.value)];
          if (
            isSupportedStructuredTemplateType(String(entry.type)) &&
            Array.isArray(entry.value)
          ) {
            return entry.value.flatMap((row) => {
              if (!record(row)) return [];
              const product = record(row.requested_product_internal)
                ? row.requested_product_internal
                : undefined;
              const medication = safeCode(row.medication);
              const service = record(row.service_request)
                ? row.service_request
                : undefined;
              const name =
                product?.name ??
                row.requested_product_name ??
                medication?.display ??
                service?.title ??
                row.requested_product ??
                row.slug;
              if (typeof name !== "string") return [];
              const instructions =
                entry.type === "medication_request" &&
                Array.isArray(row.dosage_instruction)
                  ? row.dosage_instruction.flatMap((instruction) => {
                      if (!record(instruction)) return [];
                      try {
                        const dosage =
                          instruction as unknown as MedicationRequestDosageInstruction;
                        return [
                          [
                            formatDosage(dosage),
                            formatFrequency(dosage),
                            formatDuration(dosage),
                            formatSig(dosage),
                          ]
                            .filter(Boolean)
                            .join(", "),
                        ];
                      } catch {
                        // Old or invalid saved instructions must not break the preview.
                        return [];
                      }
                    })
                  : [];
              return [[name, ...instructions].filter(Boolean).join(" — ")];
            });
          }
          if (entry.value === undefined && coding)
            return [coding.display || coding.code];
          if (
            typeof entry.value !== "string" &&
            typeof entry.value !== "number"
          )
            return [];
          if (entry.type === "quantity")
            return [
              `${entry.value}${unit || coding ? ` ${unit?.display || coding?.display || unit?.code || coding?.code}` : ""}`,
            ];
          return [coding?.display || String(entry.value)];
        })
      : [];
    return [
      ...values,
      ...rows,
      ...(typeof raw.note === "string" && raw.note ? [raw.note] : []),
    ].join(" · ");
  };
  return entries.map((entry) => ({
    id: entry.question_id,
    label:
      typeof entry.meta?.label === "string"
        ? entry.meta.label
        : entry.question_id,
    value: preview(entry.answer),
  }));
}
