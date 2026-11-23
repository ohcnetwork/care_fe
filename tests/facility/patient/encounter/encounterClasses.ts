export const ENCOUNTER_CLASSES = [
  "Inpatient",
  "Ambulatory",
  "Observation",
  "Emergency",
  "Virtual",
  "Home Health",
] as const;

/** The API `encounter_class` code behind each class label. */
export const ENCOUNTER_CLASS_CODES: Record<
  (typeof ENCOUNTER_CLASSES)[number],
  string
> = {
  Inpatient: "imp",
  Ambulatory: "amb",
  Observation: "obsenc",
  Emergency: "emer",
  Virtual: "vr",
  "Home Health": "hh",
};
