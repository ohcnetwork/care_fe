import RadioFormField from "../../Form/FormFields/RadioFormField";
import RangeFormField from "../../Form/FormFields/RangeFormField";
import {
  logUpdateSection,
  OXYGEN_MODALITY_OPTIONS,
  YES_NO_OPTIONS,
} from "../utils";

export default logUpdateSection(
  { title: "Respiratory Support" },
  ({ log, onChange }) => {
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
                  start={0}
                  end={70}
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
                  start={21}
                  end={100}
                  valueDescriptions={[
                    { till: 60, text: "Normal", className: "text-green-500" },
                    { text: "High", className: "text-red-500" },
                  ]}
                />
              </>
            ) : (
              <RangeFormField
                label={<b>Oxygen Flow Rate</b>}
                name="oxygen_flow_rate"
                onChange={(c) =>
                  onChange({
                    ventilator_oxygen_modality_oxygen_rate: c.value,
                  })
                }
                value={log.ventilator_oxygen_modality_oxygen_rate}
                start={0}
                end={50}
                valueDescriptions={[
                  { till: 4, text: "Low", className: "text-red-500" },
                  { till: 10, text: "Normal", className: "text-green-500" },
                  { text: "High", className: "text-red-500" },
                ]}
              />
            )}
          </>
        ),
      },
    ];

    return (
      <div>
        <h4>Bilateral Air Entry</h4>
        <RadioFormField
          options={YES_NO_OPTIONS}
          optionDisplay={(c) => c.text}
          optionValue={(c) => c.text}
          name="ventilator"
          value={
            YES_NO_OPTIONS.find((o) => o.value === log.bilateral_air_entry)
              ?.text
          }
          onChange={(c) =>
            onChange({
              bilateral_air_entry: YES_NO_OPTIONS.find(
                (o) => o.text === c.value,
              )?.value,
            })
          }
        />
        <RangeFormField
          label={<h4>EtCO2 (mm Hg)</h4>}
          name="etco2"
          onChange={(c) => onChange({ etco2: c.value })}
          value={log.etco2}
          start={0}
          end={200}
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
        <div className="border-l-2 border-l-gray-400 pl-4">
          {
            RESPIRATORY_SUPPORT_OPTIONS.find(
              (o) => o.value === log.ventilator_interface,
            )?.content
          }
        </div>
        <hr />
        <RangeFormField
          label={<h4>SPO2 (%)</h4>}
          name="ventilator_spo2"
          onChange={(c) => onChange({ ventilator_spo2: c.value })}
          value={log.ventilator_spo2}
          start={0}
          end={100}
          valueDescriptions={[
            { till: 89, text: "Low", className: "text-red-500" },
            { text: "Normal", className: "text-green-500" },
          ]}
        />
      </div>
    );
  },
);
