import {
  celsiusToFahrenheit,
  fahrenheitToCelsius,
  rangeValueDescription,
} from "../../../Utils/utils";
import { meanArterialPressure } from "../../Common/BloodPressureFormField";

import RadioFormField from "../../Form/FormFields/RadioFormField";
import RangeFormField from "../../Form/FormFields/RangeFormField";
import TextAreaFormField from "../../Form/FormFields/TextAreaFormField";
import { DailyRoundsModel } from "../../Patient/models";
import PainChart from "../components/PainChart";
import { LogUpdateSectionMeta, LogUpdateSectionProps } from "../utils";

const Vitals = ({ log, onChange }: LogUpdateSectionProps) => {
  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <h2 className="text-lg">Blood Pressure</h2>
        <span>
          MAP:{" "}
          {log.bp && log.bp.diastolic && log.bp.systolic
            ? meanArterialPressure(log.bp)?.toFixed()
            : "--"}
        </span>
      </div>
      <RangeFormField
        label="Systolic"
        name="systolic"
        onChange={(c) => onChange({ bp: { ...log.bp, systolic: c.value } })}
        value={log.bp?.systolic}
        min={0}
        max={250}
        step={1}
        unit="mmHg"
        valueDescriptions={rangeValueDescription({ low: 99, high: 139 })}
      />
      <RangeFormField
        label="Diastolic"
        name="diastolic"
        onChange={(c) => onChange({ bp: { ...log.bp, diastolic: c.value } })}
        value={log.bp?.diastolic}
        min={30}
        max={180}
        step={1}
        unit="mmHg"
        valueDescriptions={rangeValueDescription({ low: 49, high: 89 })}
      />
      <hr />
      <RangeFormField
        label={
          <span>
            SpO<sub>2</sub>
          </span>
        }
        name="ventilator_spo2" //TODO: ensure whether this should be ventilator_spo2 itself or spo2
        onChange={(c) => onChange({ ventilator_spo2: c.value })}
        value={log.ventilator_spo2}
        min={0}
        max={100}
        step={1}
        unit="%"
        valueDescriptions={rangeValueDescription({ low: 89 })}
      />
      <RangeFormField
        label="Temperature"
        name="temperature"
        onChange={(c) => onChange({ temperature: c.value })}
        value={log.temperature}
        min={95}
        max={106}
        step={0.1}
        valueDescriptions={rangeValueDescription({ low: 97.4, high: 99.6 })}
        units={[
          { label: "°F" },
          {
            label: "°C",
            conversionFn: fahrenheitToCelsius,
            inversionFn: celsiusToFahrenheit,
          },
        ]}
      />
      <RangeFormField
        label="Respiratory Rate"
        name="resp"
        onChange={(c) => onChange({ resp: c.value })}
        value={log.resp}
        min={0}
        max={150}
        step={1}
        unit="bpm"
        valueDescriptions={rangeValueDescription({ low: 11, high: 16 })}
      />
      <hr />
      <div>
        <h2 className="text-lg">Pain</h2>
        <span className="text-secondary-800">
          Mark region and intensity of pain
        </span>
      </div>
      <PainChart
        pain={log.pain_scale_enhanced ?? []}
        onChange={(pain_scale_enhanced) => onChange({ pain_scale_enhanced })}
      />
      <hr />
      <RangeFormField
        label="Pulse"
        name="pulse"
        onChange={(c) => onChange({ pulse: c.value })}
        value={log.pulse}
        min={0}
        max={200}
        step={1}
        unit="bpm"
        valueDescriptions={rangeValueDescription({ low: 39, high: 100 })}
      />
      <RadioFormField
        label="Heartbeat Rhythm"
        name="heartbeat-rythm"
        options={[
          { label: "Regular", value: "REGULAR" },
          { label: "Irregular", value: "IRREGULAR" },
          { label: "Unknown", value: null },
        ]}
        optionDisplay={(c) => c.label}
        optionValue={(c) => c.value || ""}
        value={log.rhythm}
        onChange={(c) =>
          onChange({ rhythm: c.value as DailyRoundsModel["rhythm"] })
        }
      />
      <TextAreaFormField
        label="Heartbeat Description"
        name="rhythm_detail"
        value={log.rhythm_detail}
        onChange={(c) => onChange({ rhythm_detail: c.value })}
      />
    </div>
  );
};

Vitals.meta = {
  title: "Vitals",
  icon: "l-heartbeat",
} as const satisfies LogUpdateSectionMeta;

export default Vitals;
