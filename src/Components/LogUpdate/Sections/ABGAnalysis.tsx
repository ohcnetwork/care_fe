import RangeFormField, {
  ValueDescription,
} from "../../Form/FormFields/RangeFormField";
import { logUpdateSection } from "../utils";

export default logUpdateSection(
  {
    title: "ABG Analysis",
    icon: "l-tear",
  },
  ({ log, onChange }) => {
    const fields = [
      {
        key: "po2",
        label: "PO2 (mm Hg)",
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
        label: "PCO2 (mm Hg)",
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
        label: "PH",
        min: 0,
        max: 10,
        step: 0.1,
        valueDescription: [
          { till: 7.35, text: "Low", className: "text-red-500" },
          { till: 7.45, text: "Normal", className: "text-green-500" },
          { text: "High", className: "text-red-500" },
        ],
      },
      {
        key: "hco3",
        label: "HCO3 (mmol/L)",
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
        label: "Base Excess (mmol/L)",
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
        label: "Lactate (mmol/L)",
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
        label: "Sodium (mmol/L)",
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
        label: "Potassium (mmol/L)",
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
      key: keyof typeof log;
      label: string;
      min: number;
      max: number;
      step?: number;
      valueDescription: ValueDescription[];
    }[];

    return (
      <div className="flex flex-col gap-4">
        {fields.map((field, index) => (
          <RangeFormField
            key={index}
            label={<b>{field.label}</b>}
            name={field.key}
            onChange={(c) => onChange({ [field.key]: c.value })}
            value={log[field.key] as number}
            start={field.min}
            end={field.max}
            step={field.step || 1}
            valueDescriptions={field.valueDescription}
          />
        ))}
      </div>
    );
  },
);
