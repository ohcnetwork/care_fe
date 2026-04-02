import {
  computeTotalDoseQuantity,
  DoseRange,
  formatDurationLabel,
  getFrequencyDisplayLabel,
  MedicationRequestDosageInstruction,
} from "@/types/emr/medicationRequest/medicationRequest";
import { round } from "@/Utils/decimal";

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

export function formatDoseRange(range?: DoseRange): string {
  if (!range?.high?.value) return "";
  return `${round(range.low.value)} → ${round(range.high?.value)} ${range.high?.unit?.display}`;
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
 * Standard duration display for a dosage instruction.
 * Returns human-readable label like "5 days", "2 weeks".
 */
export function formatDuration(
  instruction?: MedicationRequestDosageInstruction,
): string {
  const duration = instruction?.timing?.repeat?.bounds_duration;
  if (!duration?.value || duration.value === "0") return "";
  return formatDurationLabel(duration);
}

/**
 * Compact one-line medication summary:
 *   "1 tablet × 1-0-1 (Twice a day) × 5 days = 10 tablets"
 */
export function formatMedicationLine(
  instruction?: MedicationRequestDosageInstruction,
  unitLabel = "units",
): string {
  if (!instruction) return "";
  const parts: string[] = [];

  // Dosage
  const dosage = formatDosage(instruction);
  if (dosage) parts.push(dosage);

  // Frequency
  const freq = formatFrequency(instruction);
  if (freq) parts.push(freq);

  // Duration
  const dur = formatDuration(instruction);
  if (dur) parts.push(dur);

  if (parts.length === 0) return "";

  // Total
  const total = formatTotalUnits([instruction], unitLabel);
  if (total) {
    return `${parts.join(" × ")} = ${total}`;
  }
  return parts.join(" × ");
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
