import type { Code } from "@/types/base/code/code";
import type { ResponseValue } from "@/types/questionnaire/form";
import type { Question } from "@/types/questionnaire/question";

import type { GroupField } from "./registry";

/** Both response APIs store scalar values as strings and may omit empty fields. */
export interface StoredGroupAnswer {
  question_id: string;
  values?: readonly {
    value?: unknown;
    coding?: Code | null;
    unit?: Code | null;
  }[];
  note?: string | null;
  sub_results?: readonly (readonly StoredGroupAnswer[])[];
}

/** A bare calendar day parses as UTC midnight; pin it to local time. */
function localDate(text: string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? `${text}T00:00:00` : text;
}

function restoreValue(
  question: Question,
  entry: NonNullable<StoredGroupAnswer["values"]>[number],
): ResponseValue {
  const codes = {
    coding: entry.coding ?? undefined,
    unit: entry.unit ?? undefined,
  };
  const raw = entry.value;
  const text = typeof raw === "string" ? raw : undefined;
  const empty = raw == null || raw === "";
  switch (question.type) {
    case "boolean":
      return {
        ...codes,
        type: "boolean",
        value:
          raw === true || raw === "true" || raw === "1"
            ? true
            : raw === false || raw === "false" || raw === "0"
              ? false
              : undefined,
      };
    case "integer":
    case "decimal":
    case "quantity": {
      const number =
        !empty && (typeof raw === "string" || typeof raw === "number")
          ? Number(raw)
          : NaN;
      return {
        ...codes,
        type: question.type === "quantity" ? "quantity" : "number",
        value: Number.isFinite(number) ? number : undefined,
      };
    }
    case "date":
    case "dateTime": {
      const date =
        raw instanceof Date
          ? raw
          : text
            ? new Date(question.type === "date" ? localDate(text) : text)
            : undefined;
      return {
        ...codes,
        type: question.type,
        value: date && !isNaN(date.getTime()) ? date : undefined,
      };
    }
    case "time":
      return { ...codes, type: "time", value: text };
    default:
      return { ...codes, type: "string", value: text };
  }
}

/** Bind only the saved schema, with no defaults or fields from a newer plugin. */
export function storedGroupFields(
  questions: Readonly<Record<string, Question | null>>,
  answers: readonly StoredGroupAnswer[],
): Record<string, GroupField | null> {
  const byId = new Map(answers.map((answer) => [answer.question_id, answer]));
  return Object.fromEntries(
    Object.entries(questions).map(([key, question]) => {
      if (!question) return [key, null];
      const answer = byId.get(question.id);
      return [
        key,
        {
          question,
          response: {
            question_id: question.id,
            link_id: question.link_id,
            structured_type: null,
            values:
              answer?.values?.map((entry) => restoreValue(question, entry)) ??
              [],
            note: answer?.note ?? undefined,
          },
          disabled: true,
          hidden: false,
          errors: [],
        },
      ];
    }),
  );
}
