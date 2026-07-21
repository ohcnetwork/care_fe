import Decimal from "decimal.js";

import {
  computeTotalDoseQuantity,
  formatTimingBounds,
  getFrequencyDisplayLabel,
  getTimingBounds,
  MedicationRequestDosageInstruction,
} from "@/types/emr/medicationRequest/medicationRequest";
import { decimal, round, roundUp } from "@/Utils/decimal";

/**
 * Unit codes that can be dispensed as whole, billable items. Any other unit
 * (e.g. mL, mg) cannot be resolved to a dispensable count from inventory —
 * there is no way to know how many bottles/vials "520 mL" maps to — so such
 * doses are treated as unknown.
 */
const DISPENSABLE_UNIT_CODES = ["{tbl}", "{count}"];

// Helper function to format dosage in Rx style
export function formatDosage(instruction?: MedicationRequestDosageInstruction) {
  if (!instruction?.dose_and_rate) return "";

  const { dose_range, dose_quantity } = instruction.dose_and_rate;
  if (dose_range) {
    return `${round(dose_range.low.value)} ${dose_range.low.unit.display} -> ${round(dose_range.high.value)} ${dose_range.high.unit.display}`;
  } else if (dose_quantity) {
    return `${round(dose_quantity.value)} ${dose_quantity.unit.display}`;
  }
  return "";
}

/**
 * Whether a dosage should be highlighted — true for dose ranges and for
 * quantities whose rounded display value is not exactly 1.
 */
export function isNonUnitDose(
  instruction?: MedicationRequestDosageInstruction,
): boolean {
  const doseAndRate = instruction?.dose_and_rate;
  if (!doseAndRate) return false;

  const { dose_range, dose_quantity } = doseAndRate;
  if (dose_range) return true;
  if (dose_quantity?.value == null) return false;
  return round(dose_quantity.value) !== round(1);
}

// Helper function to format dosage instructions in Rx style
export function formatSig(instruction?: MedicationRequestDosageInstruction) {
  if (!instruction) return "";
  const parts: string[] = [];

  // Add route if present
  if (instruction.route?.display) {
    parts.push(`Via ${instruction.route.display}`);
  }

  // Add method if present
  if (instruction.method?.display) {
    parts.push(`by ${instruction.method.display}`);
  }

  // Add site if present
  if (instruction.site?.display) {
    parts.push(`to ${instruction.site.display}`);
  }

  return parts.join(" ");
}

/**
 * Standard frequency display for a dosage instruction.
 * Handles M-A-N text, FHIR timing codes, PRN/SOS, and as_needed_for.
 */
export function formatFrequency(
  instruction?: MedicationRequestDosageInstruction,
): string {
  if (!instruction) return "";
  if (instruction.as_needed_boolean) {
    const reason = instruction.as_needed_for?.display;
    return reason ? `SOS (${reason})` : "SOS";
  }
  return getFrequencyDisplayLabel(instruction) || "";
}

/**
 * Standard duration display for a dosage instruction. Handles all three
 * scheduling bounds — duration ("5 days"), range ("5–7 days"), and period
 * ("Jun 01, 2026 → Jun 08, 2026").
 */
export function formatDuration(
  instruction?: MedicationRequestDosageInstruction,
): string {
  const bounds = getTimingBounds(instruction?.timing?.repeat);
  return bounds ? formatTimingBounds(bounds) : "";
}

/**
 * Separator used between dosage instruction texts in print/preview contexts.
 */
export const DOSAGE_INSTRUCTION_SEPARATOR = "\n┄┄┄┄┄┄┄┄┄\n";

/**
 * Join formatted values from all dosage instructions into a single string.
 * Used in print/preview components where JSX rendering is not available.
 */
export function joinInstructionTexts(
  instructions: MedicationRequestDosageInstruction[],
  formatter: (di: MedicationRequestDosageInstruction) => string,
  separator = DOSAGE_INSTRUCTION_SEPARATOR,
  fallback = "-",
): string {
  const text = instructions.map(formatter).filter(Boolean).join(separator);
  return text || fallback;
}

/**
 * Format frequency along with any additional instructions for a single
 * dosage instruction (e.g. "Twice a day, Take with food").
 */
export function formatFrequencyWithInstructions(
  di: MedicationRequestDosageInstruction,
): string {
  const freq = formatFrequency(di);
  const additional = di.additional_instruction
    ?.map((item) => item.display)
    .filter(Boolean)
    .join(", ");
  return [freq, additional].filter(Boolean).join(", ");
}

export function formatTotalUnits(
  dosageInstructions: MedicationRequestDosageInstruction[] | undefined,
  unitText: string,
) {
  if (!dosageInstructions?.length) {
    return "";
  }

  // Check if any instruction is PRN
  const prnInstruction = dosageInstructions.find((di) => di.as_needed_boolean);
  if (prnInstruction) {
    const dose = prnInstruction.dose_and_rate?.dose_quantity?.value;
    const doseUnit =
      prnInstruction.dose_and_rate?.dose_quantity?.unit?.display || unitText;
    return dose ? `${round(dose)} ${doseUnit} (PRN)` : "PRN";
  }

  // Sum total dose across all instructions
  let totalValue = 0;
  let doseUnit = unitText;
  let hasTapered = false;
  let hasAnyDose = false;

  for (const instruction of dosageInstructions) {
    const doseValue = instruction.dose_and_rate?.dose_quantity?.value;
    if (!doseValue) continue;
    hasAnyDose = true;

    doseUnit =
      instruction.dose_and_rate?.dose_quantity?.unit?.display || unitText;
    if (instruction.dose_and_rate?.dose_range) hasTapered = true;

    const total = computeTotalDoseQuantity(instruction);
    if (total) {
      totalValue += parseFloat(String(total));
    } else {
      totalValue += parseFloat(doseValue);
    }
  }

  if (!hasAnyDose) return "";

  return `${round(String(totalValue))} ${doseUnit}${hasTapered ? " (tapered)" : ""}`;
}

/**
 * Dispense quantity for a set of dosage instructions — i.e. how many whole,
 * billable units to hand out. Returns `null` when the quantity cannot be
 * determined ("unknown").
 *
 * A single instruction is unknown when:
 *  - it is titrated / tapered (has a `dose_range`), or
 *  - it has no dose quantity value, or
 *  - its unit is not a dispensable whole-item unit (only `{tbl}` and
 *    `{count}` can be counted for dispensing).
 *
 * If any instruction is unknown, the whole dispense quantity is unknown.
 * Otherwise the per-instruction totals (each accounting for its own course
 * duration / day range) are summed and rounded up.
 */
export function computeMedicationDispenseQuantity(
  instructions: MedicationRequestDosageInstruction[] | undefined,
): string | null {
  if (!instructions?.length) return null;

  const quantities = instructions.map((instruction): Decimal | null => {
    const doseAndRate = instruction.dose_and_rate;

    // Titrated / tapered doses have no determinate dispense quantity.
    if (doseAndRate?.dose_range) return null;

    const doseValue = doseAndRate?.dose_quantity?.value;
    if (!doseValue) return null;

    // Only whole, countable units can be dispensed.
    const unitCode = doseAndRate?.dose_quantity?.unit?.code;
    if (!unitCode || !DISPENSABLE_UNIT_CODES.includes(unitCode)) return null;

    // PRN / as-needed: dispense a single dose worth.
    if (instruction.as_needed_boolean) return decimal(doseValue);

    // Scheduled: total across the course duration (handles day ranges).
    return computeTotalDoseQuantity(instruction) ?? decimal(doseValue);
  });

  // If any instruction is unknown, the total is unknown.
  if (quantities.some((quantity) => quantity === null)) return null;

  const total = (quantities as Decimal[]).reduce(
    (sum, quantity) => sum.plus(quantity),
    decimal(0),
  );

  return total.greaterThan(0) ? roundUp(total) : null;
}
