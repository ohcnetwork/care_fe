import React from "react";
import { DailyRoundsModel } from "../Patient/models";

export const REACTION_OPTIONS = [
  { id: 0, value: "UNKNOWN", text: "Unknown" },
  { id: 5, value: "BRISK", text: "Brisk" },
  { id: 10, value: "SLUGGISH", text: "Sluggish" },
  { id: 15, value: "FIXED", text: "Fixed" },
  { id: 20, value: "CANNOT_BE_ASSESSED", text: "Cannot Be Assessed" },
] as const;

export const LIMB_RESPONSE_OPTIONS = [
  { id: 0, value: "UNKNOWN", text: "Unknown" },
  { id: 5, value: "STRONG", text: "Strong" },
  { id: 10, value: "MODERATE", text: "Moderate" },
  { id: 15, value: "WEAK", text: "Weak" },
  { id: 20, value: "Flexion", text: "Flexion" },
  { id: 25, value: "Extension", text: "Extension" },
  { id: 30, value: "None", text: "None" },
] as const;

export const YES_NO_OPTIONS = [
  { id: 1, text: "Yes", value: true },
  { id: 0, text: "No", value: false },
] as const;

export const OXYGEN_MODALITY_OPTIONS = [
  { id: 1, label: "Nasal Prongs", value: "NASAL_PRONGS" },
  { id: 2, label: "Simple Face Mask", value: "SIMPLE_FACE_MASK" },
  { id: 3, label: "Non Rebreathing Mask", value: "NON_REBREATHING_MASK" },
  { id: 4, label: "High Flow Nasal Cannula", value: "HIGH_FLOW_NASAL_CANNULA" },
] as const;

export const RESPIRATORY_SUPPORT_OPTIONS = [
  { id: 0, text: "None", value: "UNKNOWN" },
  { id: 1, text: "Invasive ventilator (IV)", value: "INVASIVE" },
  { id: 2, text: "Non-Invasive ventilator (NIV)", value: "NON_INVASIVE" },
  { id: 3, text: "Oxygen Support", value: "OXYGEN_SUPPORT" },
] as const;

export const INSULIN_INTAKE_FREQUENCY_OPTIONS = [
  { id: 0, text: "Unknown", value: "UNKNOWN" },
  { id: 1, text: "Once a day (OD)", value: "OD" },
  { id: 2, text: "Twice a day (BD)", value: "BD" },
  { id: 3, text: "Thrice a day (TD)", value: "TD" },
] as const;

export const logUpdateSection = <
  TTitle extends string,
  TDescription extends string | undefined = undefined,
>(
  meta: { title: TTitle; description?: TDescription },
  component: React.FC<{
    log: DailyRoundsModel;
    onChange: (log: DailyRoundsModel) => void;
  }>,
) => ({ ...meta, component });
