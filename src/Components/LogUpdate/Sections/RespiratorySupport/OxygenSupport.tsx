import { useTranslation } from "react-i18next";
import { rangeValueDescription } from "../../../../Utils/utils";
import RadioFormField from "../../../Form/FormFields/RadioFormField";
import RangeFormField from "../../../Form/FormFields/RangeFormField";
import { LogUpdateSectionProps } from "../../utils";
import { OXYGEN_MODALITY_OPTIONS } from "@/common/constants";

const OxygenRespiratorySupport = ({ log, onChange }: LogUpdateSectionProps) => {
  const { t } = useTranslation();

  return (
    <>
      <RadioFormField
        label={<h4>Oxygen Modality</h4>}
        options={OXYGEN_MODALITY_OPTIONS}
        optionLabel={(c) => t(`OXYGEN_MODALITY__${c.value}`)}
        optionValue={(c) => c.value}
        name="ventilator_oxygen_modality"
        value={log.ventilator_oxygen_modality}
        onChange={(c) =>
          onChange({
            ventilator_oxygen_modality:
              c.value as typeof log.ventilator_oxygen_modality,
          })
        }
        layout="vertical"
      />
      <br />
      {log.ventilator_oxygen_modality === "HIGH_FLOW_NASAL_CANNULA" ? (
        <>
          <RangeFormField
            label="Flow Rate"
            unit=""
            name="ventilator_oxygen_modality_flow_rate"
            onChange={(c) =>
              onChange({
                ventilator_oxygen_modality_flow_rate: c.value,
              })
            }
            value={log.ventilator_oxygen_modality_flow_rate}
            min={0}
            max={70}
            valueDescriptions={rangeValueDescription({ low: 34, high: 60 })}
          />
          <br />
          <RangeFormField
            label={
              <span>
                FiO<sub>2</sub>
              </span>
            }
            unit="%"
            name="ventilator_fio2"
            onChange={(c) => onChange({ ventilator_fio2: c.value })}
            value={log.ventilator_fio2}
            min={21}
            max={100}
            valueDescriptions={rangeValueDescription({ high: 60 })}
          />
        </>
      ) : (
        <RangeFormField
          label="Oxygen Flow Rate"
          name="oxygen_flow_rate"
          unit=""
          onChange={(c) =>
            onChange({
              ventilator_oxygen_modality_oxygen_rate: c.value,
            })
          }
          value={log.ventilator_oxygen_modality_oxygen_rate}
          min={0}
          max={50}
          valueDescriptions={rangeValueDescription({ low: 4, high: 10 })}
        />
      )}
      <br />
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
    </>
  );
};

export default OxygenRespiratorySupport;
