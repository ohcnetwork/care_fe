import { IconName } from "../../CAREUI/icons/CareIcon";
import { DailyRoundsModel } from "../Patient/models";

export const REACTION_OPTIONS = [
  { value: "UNKNOWN", text: "Unknown" },
  { value: "BRISK", text: "Brisk" },
  { value: "SLUGGISH", text: "Sluggish" },
  { value: "FIXED", text: "Fixed" },
  { value: "CANNOT_BE_ASSESSED", text: "Cannot Be Assessed" },
] as const;

export const LIMB_RESPONSE_OPTIONS = [
  { value: "UNKNOWN", text: "Unknown" },
  { value: "STRONG", text: "Strong" },
  { value: "MODERATE", text: "Moderate" },
  { value: "WEAK", text: "Weak" },
  { value: "FLEXION", text: "Flexion" },
  { value: "EXTENSION", text: "Extension" },
  { value: "NONE", text: "None" },
] as const;

export const YES_NO_OPTIONS = [
  { text: "Yes", value: true },
  { text: "No", value: false },
] as const;

export const VENTILATOR_MODE_OPTIONS = [
  "VCV",
  "PCV",
  "PRVC",
  "APRV",
  "VC_SIMV",
  "PC_SIMV",
  "PRVC_SIMV",
  "ASV",
  "PSV",
] as const;

export const OXYGEN_MODALITY_OPTIONS = [
  { label: "Nasal Prongs", value: "NASAL_PRONGS" },
  { label: "Simple Face Mask", value: "SIMPLE_FACE_MASK" },
  { label: "Non Rebreathing Mask", value: "NON_REBREATHING_MASK" },
  { label: "High Flow Nasal Cannula", value: "HIGH_FLOW_NASAL_CANNULA" },
] as const;

export const RESPIRATORY_SUPPORT_OPTIONS = [
  { text: "None", value: "UNKNOWN" },
  { text: "Invasive ventilator (IV)", value: "INVASIVE" },
  { text: "Non-Invasive ventilator (NIV)", value: "NON_INVASIVE" },
  { text: "Oxygen Support", value: "OXYGEN_SUPPORT" },
] as const;

export const INSULIN_INTAKE_FREQUENCY_OPTIONS = [
  { text: "Unknown", value: "UNKNOWN" },
  { text: "Once a day (OD)", value: "OD" },
  { text: "Twice a day (BD)", value: "BD" },
  { text: "Thrice a day (TD)", value: "TD" },
] as const;

export type LogUpdateSectionProps = {
  log: DailyRoundsModel;
  onChange: (log: DailyRoundsModel) => void;
  readonly?: boolean;
};

export type LogUpdateSectionMeta = {
  title: string;
  description?: string;
  icon?: IconName;
};
