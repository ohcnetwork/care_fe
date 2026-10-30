import { ResponseValue } from "@/types/questionnaire/form";

/** Empty placeholder entry appended by repeating inputs. */
export function emptyEntry(): ResponseValue {
  return { type: "string", value: "" };
}

/**
 * Positional write for repeating questions: a copy of `values` with `entry`
 * at `index`, padding any gap with empty placeholder entries so the array
 * never goes sparse. Sibling entries keep their positions and clearing a slot
 * writes an empty entry rather than splicing. Single-entry mode must not route
 * through here; it uses whole-array replace/clear behavior.
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

/**
 * The scalar inputs' shared write branch. No `valueIndex` uses single-entry
 * whole-array semantics. With a `valueIndex`, writes are positional via
 * {@link withEntryAt}; clearing keeps the slot as an empty entry.
 */
export function replaceEntryAt(
  values: ResponseValue[] | undefined,
  valueIndex: number | undefined,
  entry: ResponseValue,
  clearsSingle = false,
): ResponseValue[] {
  if (valueIndex === undefined) return clearsSingle ? [] : [entry];
  return withEntryAt(values, valueIndex, entry);
}
