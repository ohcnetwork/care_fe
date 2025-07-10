import {
  DoseRange,
  MedicationRequestDosageInstruction,
} from "@/types/emr/medicationRequest/medicationRequest";

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

export function formatDoseRange(range?: DoseRange): string {
  if (!range?.high?.value) return "";

  const formatValue = (value?: number | null) =>
    value != null
      ? value.toString().includes(".")
        ? value.toFixed(2)
        : value.toString()
      : "";

  return `${formatValue(range.low?.value)} → ${formatValue(range.high?.value)} ${range.high?.unit?.display}`;
}

const convertToHours = (value: number, unit: string) => {
  switch (unit) {
    case "h":
      return value;
    case "d":
      return value * 24;
    case "wk":
      return value * 24 * 7;
    case "mo":
      return value * 24 * 30;
    case "a":
      return value * 24 * 365;
    default:
      return 0;
  }
};

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
    return dose ? `${dose} ${doseUnit} (PRN)` : "PRN";
  }

  const doseValue = instruction.dose_and_rate?.dose_quantity?.value;
  if (!doseValue) {
    return "";
  }

  const repeat = instruction.timing?.repeat;
  if (!repeat?.bounds_duration || !repeat.period_unit) {
    return `${doseValue} ${unitText}`;
  }

  const { frequency = 1, period = 1, period_unit, bounds_duration } = repeat;

  const totalDurationInHours = convertToHours(
    bounds_duration.value,
    bounds_duration.unit,
  );
  const periodInHours = convertToHours(period, period_unit);

  if (periodInHours === 0) {
    return `${doseValue} ${unitText}`;
  }

  const doseIntervalInHours = periodInHours / frequency;

  if (doseIntervalInHours === 0) {
    return `${doseValue} ${unitText}`;
  }

  const numberOfDoses = Math.ceil(totalDurationInHours / doseIntervalInHours);

  if (instruction.dose_and_rate?.dose_range) {
    const lowDose = instruction.dose_and_rate.dose_range.low.value || 0;
    const highDose = instruction.dose_and_rate.dose_range.high.value || 0;
    const avgDose = (lowDose + highDose) / 2;
    const totalQuantity = avgDose * numberOfDoses;
    return `${Number(totalQuantity.toFixed(2))} ${unitText} (tapered)`;
  }

  const totalQuantity = doseValue * numberOfDoses;

  const doseUnit =
    instruction.dose_and_rate?.dose_quantity?.unit?.display || unitText;

  return `${Number(totalQuantity.toFixed(2))} ${doseUnit}`;
}
