import { entryHasContent } from "@/components/QuestionnaireV2/form/engine/store";

import type { ResponseValue } from "@/types/questionnaire/form";

/**
 * Whether one recorded entry counts as an answer. Defined once, beside the
 * helpers that decide what an entry LOOKS like when written, and shared by
 * the required check (`form/validation.ts`) and the submit serializer
 * (`fill/submit/serializeValues.ts`): a question that passes the required
 * check must serialize something, or the submit posts an empty answer set
 * for a field the clinician was told was complete.
 *
 * A bare `coding` is an answer — a valueset selection records the code and
 * may have no display string to store alongside it.
 *
 * A quantity is the exception. Its unit — the authored default or one the
 * clinician picked — rides along with every write, including the write that
 * clears the number, because the entry outlives the mount that recorded it
 * (enable_when re-shows, reloads, resumed drafts) and nothing may depend on
 * component state to tell a pick from a default. So a quantity answers only
 * when it carries a number.
 */
export function entryIsAnswered(entry: ResponseValue): boolean {
  if (entry.type === "quantity") return entryHasContent(entry);
  return entryHasContent(entry) || entry.coding != null || entry.unit != null;
}
