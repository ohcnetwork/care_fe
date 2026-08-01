import { ResponseValue } from "@/types/questionnaire/form";

/** The empty placeholder entry repeats appends — same shape the legacy
 *  QuestionInput's handleAddValue pushes (`{ type: "string", value: "" }`). */
export function emptyEntry(): ResponseValue {
  return { type: "string", value: "" };
}

/**
 * Positional write for repeating questions: a copy of `values` with `entry`
 * at `index`, padding any gap with empty placeholder entries so the array
 * never goes sparse. Mirrors the legacy per-index inputs
 * (`newValues[index] = …` in TextQuestion/NumberQuestion): sibling entries
 * keep their positions and clearing a slot writes an empty entry rather
 * than splicing. Single-entry mode (no `valueIndex`) must NOT route through
 * here — each input keeps its legacy whole-array replace/clear behavior.
 */
export function withEntryAt(
  values: ResponseValue[] | undefined,
  index: number,
  entry: ResponseValue,
): ResponseValue[] {
  const next = [...(values ?? [])];
  while (next.length < index) next.push(emptyEntry());
  next[index] = entry;
  return next;
}
