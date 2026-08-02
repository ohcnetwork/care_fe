import { dateQueryString } from "@/Utils/utils";
import type { ResponseValue } from "@/types/questionnaire/form";

/** One serialized answer entry of the questionnaire submit payload. */
export interface SubmitValue {
  value?: string;
  unit?: ResponseValue["unit"];
  coding?: ResponseValue["coding"];
}

/**
 * Behavior-exact port of the legacy QuestionnaireForm value serialization
 * (QuestionnaireForm.tsx handleSubmit): dates collapse to yyyy-MM-dd
 * (invalid dates become "" rather than poisoning the payload), dateTimes
 * to ISO strings, unit-carrying entries keep value+unit+coding,
 * coding-only entries send just the coding, everything else stringifies.
 */
export function serializeResponseValues(
  values: ResponseValue[],
): SubmitValue[] {
  return values.map((entry) => {
    if (entry.type === "date" && entry.value) {
      const date = new Date(entry.value);
      if (isNaN(date.getTime())) {
        return { ...entry, value: "" };
      }
      return { ...entry, value: dateQueryString(date) };
    }
    if (entry.type === "dateTime" && entry.value) {
      return { ...entry, value: entry.value.toISOString() };
    }
    if (entry.unit) {
      return {
        value: entry.value?.toString(),
        unit: entry.unit,
        coding: entry.coding,
      };
    }
    if (entry.coding) {
      return { coding: entry.coding };
    }
    return { value: String(entry.value) };
  });
}
