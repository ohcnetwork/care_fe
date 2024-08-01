import { ReactNode } from "react";
import { ValueDescription } from "../../../Utils/utils";
import RangeFormField from "../../Form/FormFields/RangeFormField";
import { LogUpdateSectionProps } from "../utils";
import { DailyRoundsModel } from "../../Patient/models";

const fields = [
  {
    key: "po2",
    label: (
      <span>
        PO<sub>2</sub>
      </span>
    ),
    unit: "mmHg",
    min: 10,
    max: 400,
    valueDescription: [
      { till: 49, text: "Low", className: "text-red-500" },
      { till: 200, text: "Normal", className: "text-green-500" },
      { text: "High", className: "text-red-500" },
    ],
  },
  {
    key: "pco2",
    label: (
      <span>
        PCO<sub>2</sub>
      </span>
    ),
    unit: "mmHg",
    min: 10,
    max: 200,
    valueDescription: [
      { till: 34, text: "Low", className: "text-red-500" },
      { till: 45, text: "Normal", className: "text-green-500" },
      { text: "High", className: "text-red-500" },
    ],
  },
  {
    key: "ph",
    label: "pH",
    unit: "",
    min: 0,
    max: 14,
    step: 0.1,
    valueDescription: [
      { till: 7.35, text: "Low", className: "text-red-500" },
      { till: 7.45, text: "Normal", className: "text-green-500" },
      { text: "High", className: "text-red-500" },
    ],
  },
  {
    key: "hco3",
    label: (
      <span>
        HCO<sub>3</sub>
      </span>
    ),
    unit: "mmol/L",
    min: 5,
    max: 80,
    step: 0.1,
    valueDescription: [
      { till: 21.9, text: "Low", className: "text-red-500" },
      { till: 26, text: "Normal", className: "text-green-500" },
      { text: "High", className: "text-red-500" },
    ],
  },
  {
    key: "base_excess",
    label: "Base Excess",
    unit: "mmol/L",
    min: -20,
    max: 20,
    valueDescription: [
      { till: -3, text: "Low", className: "text-red-500" },
      { till: 2, text: "Normal", className: "text-green-500" },
      { text: "High", className: "text-red-500" },
    ],
  },
  {
    key: "lactate",
    label: "Lactate",
    unit: "mmol/L",
    min: 0,
    max: 20,
    step: 0.1,
    valueDescription: [
      { till: 2, text: "Normal", className: "text-green-500" },
      { text: "High", className: "text-red-500" },
    ],
  },
  {
    key: "sodium",
    label: "Sodium",
    unit: "mmol/L",
    min: 100,
    max: 170,
    step: 0.1,
    valueDescription: [
      { till: 134.9, text: "Low", className: "text-red-500" },
      { till: 145, text: "Normal", className: "text-green-500" },
      { text: "High", className: "text-red-500" },
    ],
  },
  {
    key: "potassium",
    label: "Potassium",
    unit: "mmol/L",
    min: 0,
    max: 10,
    step: 0.1,
    valueDescription: [
      { till: 3.4, text: "Low", className: "text-red-500" },
      { till: 5.5, text: "Normal", className: "text-green-500" },
      { text: "High", className: "text-red-500" },
    ],
  },
] satisfies {
  key: keyof DailyRoundsModel;
  label: ReactNode;
  unit: string;
  min: number;
  max: number;
  step?: number;
  valueDescription: ValueDescription[];
}[];

const ABGAnalysis = ({ log, onChange }: LogUpdateSectionProps) => {
  return (
    <div className="flex flex-col gap-8">
      {fields.map((field, index) => (
        <RangeFormField
          key={index}
          label={field.label}
          unit={field.unit}
          name={field.key}
          onChange={(c) => onChange({ [field.key]: c.value })}
          value={log[field.key] as number}
          min={field.min}
          max={field.max}
          step={field.step || 1}
          valueDescriptions={field.valueDescription}
        />
      ))}
    </div>
  );
};

ABGAnalysis.meta = {
  title: "Arterial Blood Gas Analysis",
  icon: "l-tear",
} as const;

export default ABGAnalysis;
