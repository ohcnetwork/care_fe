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

export function formatTotalUnits(
  dosageInstructions: MedicationRequestDosageInstruction[] | undefined,
  unitText: string,
) {
  if (!dosageInstructions?.length) {
    return "";
  }

  const instruction = dosageInstructions[0];
  if (!instruction) {
    return "";
  }

  if (instruction.as_needed_boolean) {
    const dose = instruction.dose_and_rate?.dose_quantity?.value;
    const doseUnit =
      instruction.dose_and_rate?.dose_quantity?.unit?.display || unitText;
    return dose ? `${round(dose)} ${doseUnit} (PRN)` : "PRN";
  }

  const doseValue = instruction.dose_and_rate?.dose_quantity?.value;
  if (!doseValue) {
    return "";
  }

  const doseUnit =
    instruction.dose_and_rate?.dose_quantity?.unit?.display || unitText;

  const total = computeTotalDoseQuantity(instruction);
  if (total) {
    const isTapered = !!instruction.dose_and_rate?.dose_range;
    return `${round(total)} ${doseUnit}${isTapered ? " (tapered)" : ""}`;
  }

  return `${round(doseValue)} ${doseUnit}`;
}
