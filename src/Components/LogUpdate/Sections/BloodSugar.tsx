import { rangeValueDescription } from "../../../Utils/utils";
import RadioFormField from "../../Form/FormFields/RadioFormField";
import RangeFormField from "../../Form/FormFields/RangeFormField";
import {
  INSULIN_INTAKE_FREQUENCY_OPTIONS,
  LogUpdateSectionMeta,
  LogUpdateSectionProps,
} from "../utils";

const BloodSugar = ({ log, onChange }: LogUpdateSectionProps) => {
  return (
    <div className="flex flex-col gap-4">
      <RangeFormField
        label="Blood Sugar Level"
        unit="mg/dL"
        name="blood_sugar_level"
        onChange={(c) => onChange({ blood_sugar_level: c.value })}
        value={log.blood_sugar_level}
        min={0}
        max={700}
        valueDescriptions={rangeValueDescription({ low: 69, high: 110 })}
      />
      <br />
      <hr />
      <br />
      <h5 className="pb-2">Insulin Intake</h5>
      <RangeFormField
        label="Dosage"
        name="insulin_intake_dose"
        unit="units"
        onChange={(c) => onChange({ insulin_intake_dose: c.value })}
        value={log.insulin_intake_dose}
        min={0}
        max={100}
        step={1}
      />
      <RadioFormField
        label="Frequency"
        name="insulin_intake_frequency"
        options={INSULIN_INTAKE_FREQUENCY_OPTIONS}
        optionDisplay={(c) => c.text}
        optionValue={(c) => c.value}
        value={log.insulin_intake_frequency}
        onChange={(c) =>
          onChange({ insulin_intake_frequency: c.value || undefined })
        }
      />
    </div>
  );
};

BloodSugar.meta = {
  title: "Blood Sugar",
  icon: "l-tear",
} as const satisfies LogUpdateSectionMeta;

export default BloodSugar;
