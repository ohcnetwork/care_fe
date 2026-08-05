import { entryHasContent } from "@/components/QuestionnaireV2/form/engine/store";

import { dateQueryString } from "@/Utils/utils";
import type { ResponseValue } from "@/types/questionnaire/form";
import type { SubmitResultValue } from "@/types/questionnaire/questionnaireApi";

/** `<input type="time">` emits bare "HH:mm" — no seconds, and no `step`
 *  attribute would change that for whole minutes. */
const BARE_HH_MM = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Serializes questionnaire values for submit: dates collapse to yyyy-MM-dd,
 * dateTimes to ISO strings, times to HH:mm:ss, unit-carrying entries keep
 * value+unit+coding, coding-only entries send just the coding, and all
 * other answered entries stringify.
 *
 * Content-free entries are dropped rather than stringified; submitting the
 * literal "undefined" would make the backend reject the atomic batch.
 */
export function serializeResponseValues(
  values: ResponseValue[],
): SubmitResultValue[] {
  const answered = values.filter(
    (entry) =>
      entryHasContent(entry) || entry.coding != null || entry.unit != null,
  );
  return answered.map((entry) => {
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
    if (entry.type === "time" && entry.value) {
      // The backend parses time answers with strptime("%H:%M:%S") and
      // raises on a seconds-less string, failing the submit sub-request and
      // rolling back the whole batch. Browser time inputs round-trip bare
      // HH:mm, so the normalization belongs here.
      return {
        ...entry,
        value: BARE_HH_MM.test(entry.value) ? `${entry.value}:00` : entry.value,
      };
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
