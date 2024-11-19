import { useTranslation } from "react-i18next";

import RadioFormField from "@/components/Form/FormFields/RadioFormField";
import RangeFormField from "@/components/Form/FormFields/RangeFormField";
import {
  LogUpdateSectionMeta,
  LogUpdateSectionProps,
} from "@/components/LogUpdate/utils";

import { INSULIN_INTAKE_FREQUENCY_OPTIONS } from "@/common/constants";

import { rangeValueDescription } from "@/Utils/utils";

const BloodSugar = ({ log, onChange }: LogUpdateSectionProps) => {
  const { t } = useTranslation();

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
        step={0.1}
      />
      <RadioFormField
        label="Frequency"
        name="insulin_intake_frequency"
        options={INSULIN_INTAKE_FREQUENCY_OPTIONS}
        optionLabel={(c) => t(`INSULIN_INTAKE_FREQUENCY__${c}`)}
        optionValue={(c) => c}
        value={log.insulin_intake_frequency}
        onChange={(c) =>
          onChange({
            insulin_intake_frequency: c.value || undefined,
          })
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
