import RadioFormField from "../../Form/FormFields/RadioFormField";
import RangeFormField from "../../Form/FormFields/RangeFormField";
import {
  LogUpdateSectionMeta,
  LogUpdateSectionProps,
  OXYGEN_MODALITY_OPTIONS,
  YES_NO_OPTIONS,
} from "../utils";

const RespiratorySupport = ({ log, onChange }: LogUpdateSectionProps) => {
  const RESPIRATORY_SUPPORT_OPTIONS = [
    {
      id: 0,
      text: "None",
      value: "UNKNOWN",
    },
    {
      id: 1,
      text: "Invasive ventilator (IV)",
      value: "INVASIVE",
      content: <>Invasive</>,
    },
    {
      id: 2,
      text: "Non-Invasive ventilator (NIV)",
      value: "NON_INVASIVE",
      content: <></>,
    },
    {
      id: 3,
      text: "Oxygen Support",
      value: "OXYGEN_SUPPORT",
      content: (
        <>
          <RadioFormField
            label={<b>Oxygen Modality</b>}
            options={OXYGEN_MODALITY_OPTIONS}
            optionDisplay={(c) => c.label}
            optionValue={(c) => c.value}
            name="oxygen_modality"
            value={log.ventilator_oxygen_modality}
            onChange={(c) =>
              onChange({
                ventilator_oxygen_modality:
                  c.value as typeof log.ventilator_oxygen_modality,
              })
            }
          />
          {log.ventilator_oxygen_modality === "HIGH_FLOW_NASAL_CANNULA" ? (
            <>
              <RangeFormField
                label={<b>Flow Rate</b>}
                name="oxygen_flow_rate"
                onChange={(c) =>
                  onChange({
                    ventilator_oxygen_modality_flow_rate: c.value,
                  })
                }
                value={log.ventilator_oxygen_modality_flow_rate}
                min={0}
                max={70}
                valueDescriptions={[
                  { till: 34, text: "Low", className: "text-red-500" },
                  { till: 60, text: "Normal", className: "text-green-500" },
                  { text: "High", className: "text-red-500" },
                ]}
              />
              <br />
              <RangeFormField
                label={<b>FiO2 (%)</b>}
                name="oxygen_flow_rate"
                onChange={(c) => onChange({ ventilator_fi02: c.value })}
                value={log.ventilator_fi02}
                min={21}
                max={100}
                valueDescriptions={[
                  { till: 60, text: "Normal", className: "text-green-500" },
                  { text: "High", className: "text-red-500" },
                ]}
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
              valueDescriptions={[
                { till: 4, text: "Low", className: "text-red-500" },
                { till: 10, text: "Normal", className: "text-green-500" },
                { text: "High", className: "text-red-500" },
              ]}
            />
          )}
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
            valueDescriptions={[
              { till: 89, text: "Low", className: "text-red-500" },
              { text: "Normal", className: "text-green-500" },
            ]}
          />
        </>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
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
        valueDescriptions={[
          { till: 34, text: "Low", className: "text-red-500" },
          { till: 45, text: "Normal", className: "text-green-500" },
          { text: "High", className: "text-red-500" },
        ]}
      />
      <br />
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
      <div className="ml-5 space-y-4 border-l-4 border-l-secondary-300 pl-6">
        {
          RESPIRATORY_SUPPORT_OPTIONS.find(
            (o) => o.value === log.ventilator_interface,
          )?.content
        }
      </div>
    </div>
  );
};

RespiratorySupport.meta = {
  title: "Respiratory Support",
  icon: "l-lungs",
} as const satisfies LogUpdateSectionMeta;

export default RespiratorySupport;
