import type {
  FillUpdate,
  FillableQuestionSnapshot,
} from "@/components/Questionnaire/AmbientScribe/types";

import type { Question } from "@/types/questionnaire/question";

export const FILLABLE_TYPES = new Set([
  "text",
  "string",
  "decimal",
  "integer",
  "boolean",
  "choice",
  "date",
  "time",
]);

const QUESTION_TYPE_TO_FILL_TYPE: Record<
  string,
  FillUpdate["type"] | undefined
> = {
  text: "string",
  string: "string",
  decimal: "number",
  integer: "number",
  boolean: "boolean",
  choice: "choice",
  date: "date",
  time: "time",
};

/**
 * Walks the question tree (respecting groups) and returns snapshots for every
 * question whose `type` is one of the fillable primitives. Structured,
 * quantity, url, display, group, and repeating/read-only questions are
 * excluded from autofill.
 */
export function collectFillable(
  questions: Question[],
  getCurrentValue: (questionId: string) => unknown,
): { question: Question; snapshot: FillableQuestionSnapshot }[] {
  const out: { question: Question; snapshot: FillableQuestionSnapshot }[] = [];
  const walk = (list: Question[]) => {
    for (const q of list) {
      if (q.type === "group" && q.questions) {
        walk(q.questions);
        continue;
      }
      if (q.read_only || q.repeats) continue;
      const fillType = QUESTION_TYPE_TO_FILL_TYPE[q.type];
      if (!fillType) continue;

      out.push({
        question: q,
        snapshot: {
          id: q.id,
          link_id: q.link_id,
          text: q.text,
          description: q.description,
          fillType,
          required: q.required,
          options:
            fillType === "choice" && q.answer_option
              ? q.answer_option.map((o) => ({
                  value: o.value,
                  display: o.display,
                }))
              : undefined,
          currentValue: getCurrentValue(q.id),
        },
      });
    }
  };
  walk(questions);
  return out;
}

interface AnswerItemSchema {
  type: "object";
  additionalProperties: false;
  properties: {
    question_id: { const: string };
    type: { const: FillUpdate["type"] };
    value: Record<string, unknown>;
    confidence: { type: "number"; minimum: 0; maximum: 1 };
  };
  required: ["question_id", "type", "value", "confidence"];
}

/**
 * Build a strict JSON schema describing the expected GPT-4o response for a
 * given set of fillable questions. Each question becomes one anyOf branch
 * with its literal id + type + a value schema appropriate to the fill type.
 *
 * The schema's top level is:
 *   { updates: [<per-question item>, ...] }
 */
export function buildAnswerSchema(
  snapshots: FillableQuestionSnapshot[],
): Record<string, unknown> {
  const valueSchemaFor = (
    s: FillableQuestionSnapshot,
  ): Record<string, unknown> => {
    switch (s.fillType) {
      case "string":
        return { type: "string" };
      case "number":
        return { type: "number" };
      case "boolean":
        return { type: "boolean" };
      case "choice":
        return {
          type: "string",
          enum: s.options?.map((o) => o.value) ?? [],
        };
      case "date":
        // ISO date (YYYY-MM-DD).
        return { type: "string", format: "date" };
      case "time":
        // 24h HH:MM or HH:MM:SS.
        return {
          type: "string",
          pattern: "^[0-2][0-9]:[0-5][0-9](:[0-5][0-9])?$",
        };
    }
  };

  const items: AnswerItemSchema[] = snapshots.map((s) => ({
    type: "object",
    additionalProperties: false,
    properties: {
      question_id: { const: s.id },
      type: { const: s.fillType },
      value: valueSchemaFor(s),
      confidence: { type: "number", minimum: 0, maximum: 1 },
    },
    required: ["question_id", "type", "value", "confidence"],
  }));

  if (items.length === 0) {
    return {
      name: "questionnaire_autofill",
      strict: true,
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          updates: { type: "array", maxItems: 0, items: {} },
        },
        required: ["updates"],
      },
    };
  }

  return {
    name: "questionnaire_autofill",
    strict: false, // anyOf is incompatible with strict mode
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        updates: {
          type: "array",
          items: {
            anyOf: items,
          },
        },
      },
      required: ["updates"],
    },
  };
}
