import { rangeValueDescription } from "../../../../Utils/utils";
import RadioFormField from "../../../Form/FormFields/RadioFormField";
import RangeFormField from "../../../Form/FormFields/RangeFormField";
import {
  LogUpdateSectionMeta,
  LogUpdateSectionProps,
  RESPIRATORY_SUPPORT_OPTIONS,
  YES_NO_OPTIONS,
} from "../../utils";
import OxygenRespiratorySupport from "./OxygenSupport";
import VentilatorRespiratorySupport from "./Ventilator";

const RespiratorySupport = ({ log, onChange }: LogUpdateSectionProps) => {
  return (
    <div className="flex flex-col gap-8">
      <RadioFormField
        label="Bilateral Air Entry"
        labelClassName="text-lg sm:font-bold"
        options={YES_NO_OPTIONS}
        optionDisplay={(c) => c.text}
        optionValue={(c) => c.text}
        name="bilateral_air_entry"
        value={
          YES_NO_OPTIONS.find((o) => o.value === log.bilateral_air_entry)?.text
        }
        onChange={(c) =>
          onChange({
            bilateral_air_entry: YES_NO_OPTIONS.find((o) => o.text === c.value)
              ?.value,
          })
        }
      />
      <RangeFormField
        label={
          <span>
            EtCO<sub>2</sub>
          </span>
        }
        unit="mmHg"
        name="etco2"
        onChange={(c) => onChange({ etco2: c.value })}
        value={log.etco2}
        min={0}
        max={200}
        step={1}
        valueDescriptions={rangeValueDescription({ low: 34, high: 45 })}
      />
      <hr />
      <RadioFormField
        label={<h4>Respiratory Support</h4>}
        options={RESPIRATORY_SUPPORT_OPTIONS}
        optionDisplay={(c) => c.text}
        optionValue={(c) => c.value}
        name="respiratory_support"
        value={log.ventilator_interface}
        onChange={(c) =>
          onChange({
            ventilator_interface: (c.value ||
              "UNKNOWN") as typeof log.ventilator_interface,
          })
        }
      />
      {log.ventilator_interface && log.ventilator_interface !== "UNKNOWN" && (
        <div className="ml-2 space-y-4 border-l-4 border-l-secondary-300 pl-6">
          {log.ventilator_interface === "OXYGEN_SUPPORT" && (
            <OxygenRespiratorySupport log={log} onChange={onChange} />
          )}
          {(log.ventilator_interface === "INVASIVE" ||
            log.ventilator_interface === "NON_INVASIVE") && (
            <VentilatorRespiratorySupport log={log} onChange={onChange} />
          )}
        </div>
      )}
    </div>
  );
};

RespiratorySupport.meta = {
  title: "Respiratory Support",
  icon: "l-lungs",
} as const satisfies LogUpdateSectionMeta;

export default RespiratorySupport;
