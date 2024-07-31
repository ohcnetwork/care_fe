import RadioFormField from "../../Form/FormFields/RadioFormField";
import RangeFormField from "../../Form/FormFields/RangeFormField";
import { INSULIN_INTAKE_FREQUENCY_OPTIONS, logUpdateSection } from "../utils";

export default logUpdateSection(
  { title: "Blood Sugar" },
  ({ log, onChange }) => {
    return (
      <div>
        <RangeFormField
          label={<h4>Blood Sugar Level(mg/dL)</h4>}
          name="blood_sugar"
          onChange={(c) => onChange({ blood_sugar_level: c.value })}
          value={log.blood_sugar_level}
          start={0}
          end={700}
          valueDescriptions={[
            { till: 69, text: "Low", className: "text-red-500" },
            { till: 110, text: "Normal", className: "text-green-500" },
            { text: "High", className: "text-red-500" },
          ]}
        />
        <br />
        <h4>Insulin Intake</h4>
        <br />
        <RangeFormField
          label={<b>Dosage(units)</b>}
          name="insulin_intake"
          onChange={(c) => onChange({ insulin_intake_dose: c.value })}
          value={log.insulin_intake_dose}
          start={0}
          end={100}
          step={0.1}
        />
        <br />
        <RadioFormField
          label={<b>Frequency(units/day)</b>}
          name="insulin_frequency"
          options={INSULIN_INTAKE_FREQUENCY_OPTIONS}
          optionDisplay={(c) => c.text}
          optionValue={(c) => c.value}
          value={log.insulin_intake_frequency}
          onChange={(c) =>
            onChange({ insulin_intake_frequency: c.value || "" })
          }
        />
      </div>
    );
  },
);
