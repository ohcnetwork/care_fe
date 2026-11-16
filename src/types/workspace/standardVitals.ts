import type { Code } from "@/types/base/code/code";
import type { ObservationPlotConfig } from "@/types/emr/observation/observation";

/** A vitals matrix row; alias codes for the same vital share it. */
export interface VitalRowSpec {
  code: Code;
  codes: Code[];
}

const LOINC = "http://loinc.org";

/**
 * The standard vital signs, in display order. Primary parameters also chart
 * measurements that are not vitals (glucose, height, weight, girth, FiO2), so
 * the default matrix lists only these. SpO2 is recorded under several LOINC
 * codes, which are merged into one row.
 */
export const STANDARD_VITAL_LOINC_CODES: readonly (readonly string[])[] = [
  ["8480-6"], // Systolic blood pressure
  ["8462-4"], // Diastolic blood pressure
  ["8867-4"], // Heart rate
  ["8310-5"], // Body temperature
  ["9279-1"], // Respiratory rate
  ["2708-6", "59408-5", "20564-1"], // Oxygen saturation
];

export function vitalCodeKey(code: Pick<Code, "system" | "code">) {
  return `${code.system}|${code.code}`;
}

export function vitalRowsFromCodes(codes: Code[]): VitalRowSpec[] {
  return codes.map((code) => ({ code, codes: [code] }));
}

/**
 * Builds the default rows from the deployment's primary parameters, so row
 * names follow its configuration. Vitals it does not chart are left out.
 */
export function standardVitalRows(plots: ObservationPlotConfig) {
  const configured = new Map<string, Code>();
  for (const code of (
    plots.find((plot) => plot.id === "primary-parameters")?.groups ?? []
  ).flatMap((group) => group.codes)) {
    const key = vitalCodeKey(code);
    if (code.display && !configured.has(key)) configured.set(key, code);
  }
  return STANDARD_VITAL_LOINC_CODES.flatMap((aliases): VitalRowSpec[] => {
    const codes = aliases.flatMap((code) => {
      const match = configured.get(vitalCodeKey({ system: LOINC, code }));
      return match ? [match] : [];
    });
    return codes.length ? [{ code: codes[0], codes }] : [];
  });
}
