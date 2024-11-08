import RangeFormField from "@/components/Form/FormFields/RangeFormField";
import VentilatorModeSelector from "@/components/LogUpdate/Sections/RespiratorySupport/VentilatorModeSelector";
import { LogUpdateSectionProps } from "@/components/LogUpdate/utils";
import { DailyRoundsModel } from "@/components/Patient/models";

import { ValueDescription, rangeValueDescription } from "@/Utils/utils";

export const VentilatorFields = [
  {
    key: "ventilator_peep",
    label: "PEEP",
    unit: "cm/H2O",
    min: 0,
    max: 30,
    step: 0.1,
    valueDescription: rangeValueDescription({ low: 10 }),
  },
  {
    key: "ventilator_pip",
    label: "Peak Inspiratory Pressure (PIP)",
    unit: "cm H2O",
    min: 0,
    max: 100,
    valueDescription: rangeValueDescription({ low: 11, high: 30 }),
  },
  {
    key: "ventilator_mean_airway_pressure",
    label: "Mean Airway Pressure (MAP)",
    unit: "cm H2O",
    min: 0,
    max: 40,
    valueDescription: rangeValueDescription({ low: 11, high: 25 }),
  },
  {
    key: "ventilator_resp_rate",
    label: "Respiratory Rate Ventilator",
    unit: "bpm",
    min: 0,
    max: 100,
    valueDescription: rangeValueDescription({ low: 39, high: 60 }),
  },
  {
    key: "ventilator_pressure_support",
    label: "Pressure Support",
    unit: "",
    min: 0,
    max: 40,
    valueDescription: rangeValueDescription({ low: 6, high: 15 }),
  },
  {
    key: "ventilator_tidal_volume",
    label: "Tidal Volume",
    unit: "ml",
    min: 0,
    max: 1000,
    valueDescription: rangeValueDescription({}),
  },
  {
    key: "ventilator_fio2",
    label: (
      <span>
        FiO<sub>2</sub>
      </span>
    ),
    unit: "%",
    min: 21,
    max: 100,
    valueDescription: rangeValueDescription({ high: 60 }),
  },
  {
    key: "ventilator_spo2",
    label: (
      <span>
        SpO<sub>2</sub>
      </span>
    ),
    unit: "%",
    min: 0,
    max: 100,
    valueDescription: rangeValueDescription({ low: 89 }),
  },
] satisfies {
  key: keyof DailyRoundsModel;
  label: React.ReactNode;
  unit: string;
  min: number;
  max: number;
  step?: number;
  valueDescription: ValueDescription[];
}[];

const VentilatorRespiratorySupport = ({
  log,
  onChange,
}: LogUpdateSectionProps) => {
  return (
    <div className="space-y-8">
      <div>
        <h4>Ventilator Mode</h4>
        <VentilatorModeSelector
          value={log.ventilator_mode}
          onChange={(ventilator_mode) => onChange({ ventilator_mode })}
        />
      </div>
      {VentilatorFields.map((field, index) => (
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

export default VentilatorRespiratorySupport;
