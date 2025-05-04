import { MedicationRequestDosageInstruction } from "@/types/emr/medicationRequest";

// Helper function to format dosage in Rx style
export function formatDosage(instruction: MedicationRequestDosageInstruction) {
  if (!instruction.dose_and_rate) return "";

  const { dose_range, dose_quantity } = instruction.dose_and_rate;
  if (dose_range) {
    return `${dose_range.low.value} ${dose_range.low.unit.display} -> ${dose_range.high.value} ${dose_range.high.unit.display}`;
  } else if (dose_quantity) {
    return `${dose_quantity.value} ${dose_quantity.unit.display}`;
  }
  return "";
}

// Helper function to format dosage instructions in Rx style
export function formatSig(instruction: MedicationRequestDosageInstruction) {
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
