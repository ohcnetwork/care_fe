import { MedicationRequestDosageInstruction } from "@/types/emr/medicationRequest";

// Helper function to format dosage in Rx style
export function formatDosage(instruction: MedicationRequestDosageInstruction) {
  if (!instruction.dose_and_rate) return "";

  if (instruction.dose_and_rate.type === "calculated") {
    const { dose_range } = instruction.dose_and_rate;
    if (!dose_range) return "";
    return `${dose_range.low.value}${dose_range.low.unit.display} - ${dose_range.high.value}${dose_range.high.unit.display}`;
  }

  const { dose_quantity } = instruction.dose_and_rate;
  if (!dose_quantity?.value || !dose_quantity.unit) return "";

  return `${dose_quantity.value} ${dose_quantity.unit.display}`;
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
