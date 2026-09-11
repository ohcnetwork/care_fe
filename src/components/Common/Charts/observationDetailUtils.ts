import { Code } from "@/types/base/code/code";
import {
  ObservationListRead,
  ObservationStatus,
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
}

export function resolveObservationEntries(
  results: ObservationListRead[],
): Record<string, ResolvedObservationEntry[]> {
  const groupedObj: Record<string, ResolvedObservationEntry[]> = {};

  for (const obs of results) {
    if (
      !obs.effective_datetime ||
      obs.status === ObservationStatus.ENTERED_IN_ERROR
    )
      continue;

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

  for (const entries of Object.values(groupedObj)) {
    entries.sort((a, b) => a.time - b.time);
  }

  return groupedObj;
}

// Convert a stored observation value to a number, or null when blank/non-numeric.
export function toNumericValue(value?: string | null): number | null {
  if (!value || isNaN(Number(value))) return null;
  return toNumber(value);
}
