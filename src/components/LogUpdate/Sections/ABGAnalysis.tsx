import { ReactNode } from "react";

import RangeFormField from "@/components/Form/FormFields/RangeFormField";
import {
  LogUpdateSectionMeta,
  LogUpdateSectionProps,
} from "@/components/LogUpdate/utils";
import { DailyRoundsModel } from "@/components/Patient/models";

import { ValueDescription, rangeValueDescription } from "@/Utils/utils";

export const ABGAnalysisFields = [
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
    valueDescription: rangeValueDescription({ low: 49, high: 200 }),
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
    valueDescription: rangeValueDescription({ low: 34, high: 45 }),
  },
  {
    key: "ph",
    label: "pH",
    unit: "",
    min: 0,
    max: 10,
    step: 0.1,
    valueDescription: rangeValueDescription({ low: 7.35, high: 7.45 }),
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
    valueDescription: rangeValueDescription({ low: 21.9, high: 26 }),
  },
  {
    key: "base_excess",
    label: "Base Excess",
    unit: "mmol/L",
    min: -20,
    max: 20,
    valueDescription: rangeValueDescription({ low: -3, high: 2 }),
  },
  {
    key: "lactate",
    label: "Lactate",
    unit: "mmol/L",
    min: 0,
    max: 20,
    step: 0.1,
    valueDescription: rangeValueDescription({ low: 3 }),
  },
  {
    key: "sodium",
    label: "Sodium",
    unit: "mmol/L",
    min: 100,
    max: 170,
    step: 0.1,
    valueDescription: rangeValueDescription({ low: 134, high: 145 }),
  },
  {
    key: "potassium",
    label: "Potassium",
    unit: "mmol/L",
    min: 0,
    max: 10,
    step: 0.1,
    valueDescription: rangeValueDescription({ low: 3.4, high: 5.5 }),
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
      {ABGAnalysisFields.map((field, index) => (
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
} as const satisfies LogUpdateSectionMeta;

export default ABGAnalysis;
