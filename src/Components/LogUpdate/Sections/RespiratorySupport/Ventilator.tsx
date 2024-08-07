import { rangeValueDescription } from "../../../../Utils/utils";
import RangeFormField from "../../../Form/FormFields/RangeFormField";
import { LogUpdateSectionProps } from "../../utils";
import VentilatorModeSelector from "./VentilatorModeSelector";

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
      <RangeFormField
        label="PEEP"
        unit="cm/H2O"
        name="ventilator_peep"
        onChange={(c) => onChange({ ventilator_peep: c.value })}
        value={log.ventilator_peep}
        min={0}
        max={30}
        step={0.1}
        valueDescriptions={rangeValueDescription({ low: 10 })}
      />
      <RangeFormField
        label="Peak Inspiratory Pressure (PIP)"
        unit="cm H2O"
        name="ventilator_pip"
        onChange={(c) => onChange({ ventilator_pip: c.value })}
        value={log.ventilator_pip}
        min={0}
        max={100}
        valueDescriptions={rangeValueDescription({ low: 11, high: 30 })}
      />
      <RangeFormField
        label="Mean Airway Pressure (MAP)"
        unit="cm H2O"
        name="ventilator_mean_airway_pressure"
        onChange={(c) => onChange({ ventilator_mean_airway_pressure: c.value })}
        value={log.ventilator_mean_airway_pressure}
        min={0}
        max={40}
        valueDescriptions={rangeValueDescription({ low: 11, high: 25 })}
      />
      <RangeFormField
        label="Respiratory Rate Ventilator"
        unit="bpm"
        name="ventilator_resp_rate"
        onChange={(c) => onChange({ ventilator_resp_rate: c.value })}
        value={log.ventilator_resp_rate}
        min={0}
        max={100}
        valueDescriptions={rangeValueDescription({ low: 39, high: 60 })}
      />
      <RangeFormField
        label="Pressure Support"
        unit=""
        name="ventilator_pressure_support"
        onChange={(c) => onChange({ ventilator_pressure_support: c.value })}
        value={log.ventilator_pressure_support}
        min={0}
        max={40}
        valueDescriptions={rangeValueDescription({ low: 6, high: 15 })}
      />
      <RangeFormField
        label="Tidal Volume"
        unit="ml"
        name="ventilator_tidal_volume"
        onChange={(c) => onChange({ ventilator_tidal_volume: c.value })}
        value={log.ventilator_tidal_volume}
        min={0}
        max={1000}
        valueDescriptions={rangeValueDescription({})}
      />
      <RangeFormField
        label={
          <span>
            FiO<sub>2</sub>
          </span>
        }
        unit="%"
        name="ventilator_fi02"
        onChange={(c) => onChange({ ventilator_fi02: c.value })}
        value={log.ventilator_fi02}
        min={21}
        max={100}
        valueDescriptions={rangeValueDescription({ high: 60 })}
      />
      <RangeFormField
        label={
          <span>
            SpO<sub>2</sub>
          </span>
        }
        unit="%"
        name="ventilator_spo2"
        onChange={(c) => onChange({ ventilator_spo2: c.value })}
        value={log.ventilator_spo2}
        min={0}
        max={100}
        valueDescriptions={rangeValueDescription({ low: 89 })}
      />
    </div>
  );
};

export default VentilatorRespiratorySupport;
