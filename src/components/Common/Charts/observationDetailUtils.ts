import { Code } from "@/types/base/code/code";
import {
  ObservationListRead,
  QuestionnaireSubmitResultValue,
} from "@/types/emr/observation/observation";
import { toNumber } from "@/Utils/decimal";
import { formatName } from "@/Utils/utils";

export interface ResolvedObservationEntry {
  code: Code;
  time: number;
  value?: string | null;
  unit?: Code;
  enteredBy: string;
  note?: string | null;
  /** Reading slot at this effective time; components of one observation share a slot. */
  occurrence: number;
  /** Unique identifier of a reading slot, stable across renders. */
  key: string;
}

type UnkeyedObservationEntry = Omit<
  ResolvedObservationEntry,
  "occurrence" | "key"
>;

// Coded answers have no free-text value, so show the chosen coding instead.
function readingValue(value?: QuestionnaireSubmitResultValue) {
  return value?.value || value?.coding?.display || value?.coding?.code;
}

export function unitLabel(unit?: Code) {
  return unit?.display || unit?.code || "";
}

export function resolveObservationEntries(
  results: ObservationListRead[],
): Record<string, ResolvedObservationEntry[]> {
  const grouped: Record<string, ResolvedObservationEntry[]> = {};
  // Codes already placed in each slot, per effective time. Readings recorded at
  // the same time share a slot unless their codes collide, which keeps each
  // observation's components together without splitting separately filed vitals.
  const slotsByTime = new Map<number, Set<string>[]>();

  for (const obs of results) {
    if (!obs.effective_datetime) continue;

    const time = new Date(obs.effective_datetime).getTime();
    const enteredBy = formatName(obs.data_entered_by);

    const entries: UnkeyedObservationEntry[] = obs.component?.length
      ? obs.component
          .filter((component) => component.code?.code)
          .map((component) => ({
            code: component.code!,
            value: readingValue(component.value),
            unit: component.value?.unit,
            time,
            enteredBy,
            note: component.note ?? obs.note,
          }))
      : obs.main_code?.code
        ? [
            {
              code: obs.main_code,
              value: readingValue(obs.value),
              unit: obs.value?.unit,
              time,
              enteredBy,
              note: obs.note,
            },
          ]
        : [];
    if (!entries.length) continue;

    const slots = slotsByTime.get(time) ?? [];
    slotsByTime.set(time, slots);
    const codes = new Set(entries.map((entry) => entry.code.code));
    let slot = slots.findIndex((used) => [...codes].every((c) => !used.has(c)));
    if (slot === -1) slot = slots.push(new Set()) - 1;

    for (const entry of entries) {
      // A code repeated within one observation moves to the next free slot.
      let occurrence = slot;
      while (slots[occurrence]?.has(entry.code.code)) occurrence++;
      (slots[occurrence] ??= new Set()).add(entry.code.code);
      (grouped[entry.code.code] ??= []).push({
        ...entry,
        occurrence,
        key: `${time}#${occurrence}`,
      });
    }
  }

  // The API returns readings newest first; charts read oldest to newest.
  for (const entries of Object.values(grouped)) entries.reverse();

  return grouped;
}

// Readings in different units cannot share one axis, so plot each unit separately.
export function groupEntriesByUnit(entries: ResolvedObservationEntry[]) {
  const groups = new Map<
    string,
    { key: string; unit: string; entries: ResolvedObservationEntry[] }
  >();
  for (const entry of entries) {
    const key = entry.unit?.code || entry.unit?.display || "";
    const group = groups.get(key) ?? {
      key,
      unit: unitLabel(entry.unit),
      entries: [],
    };
    group.entries.push(entry);
    groups.set(key, group);
  }
  return [...groups.values()];
}

// Convert a stored observation value to a number, or null when blank/non-numeric.
export function toNumericValue(value?: string | null): number | null {
  if (!value) return null;

  const trimmedValue = value.trim();

  if (!trimmedValue || isNaN(Number(trimmedValue))) {
    return null;
  }

  return toNumber(trimmedValue);
}
