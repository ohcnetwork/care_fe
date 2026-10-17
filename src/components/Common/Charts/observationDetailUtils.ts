import { Code } from "@/types/base/code/code";
import { ObservationListRead } from "@/types/emr/observation/observation";
import { toNumber } from "@/Utils/decimal";
import { formatName } from "@/Utils/utils";

export interface ResolvedObservationEntry {
  code: Code;
  time: number;
  value?: string | null;
  unit?: Code;
  enteredBy: string;
  note?: string | null;
  /** Position of this reading among readings of the same code sharing the same time. */
  occurrence: number;
  /** Unique identifier of a reading, stable across renders. */
  key: string;
}

type UnkeyedObservationEntry = Omit<
  ResolvedObservationEntry,
  "occurrence" | "key"
>;

export function resolveObservationEntries(
  results: ObservationListRead[],
): Record<string, ResolvedObservationEntry[]> {
  const groupedObj: Record<string, UnkeyedObservationEntry[]> = {};

  for (const obs of results) {
    if (!obs.effective_datetime) continue;

    const time = new Date(obs.effective_datetime).getTime();
    const enteredBy = formatName(obs.data_entered_by);

    const entries = obs.component?.length
      ? obs.component
          .filter((component) => component.code?.code)
          .map((component) => ({
            code: component.code!,
            value: component.value?.value,
            unit: component.value?.unit,
            time,
            enteredBy,
            note: component.note ?? obs.note,
          }))
      : obs.main_code?.code
        ? [
            {
              code: obs.main_code,
              value: obs.value?.value,
              unit: obs.value?.unit,
              time,
              enteredBy,
              note: obs.note,
            },
          ]
        : [];

    for (const entry of entries) {
      const key = entry.code.code;
      (groupedObj[key] ??= []).push(entry);
    }
  }

  const resolved: Record<string, ResolvedObservationEntry[]> = {};

  for (const [code, entries] of Object.entries(groupedObj)) {
    // A service request can record several results for one component, so readings
    // can share an effective time; number them in API order to keep them distinct.
    const occurrenceByTime = new Map<number, number>();
    resolved[code] = entries
      .map((entry) => {
        const occurrence = occurrenceByTime.get(entry.time) ?? 0;
        occurrenceByTime.set(entry.time, occurrence + 1);
        return { ...entry, occurrence, key: `${entry.time}#${occurrence}` };
      })
      // The API returns readings newest first; charts read oldest to newest.
      .reverse();
  }

  return resolved;
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
