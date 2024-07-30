import { HumanBodyPaths } from "../../../CAREUI/interactive/HumanChart";
import RadioFormField from "../../Form/FormFields/RadioFormField";
import RangeFormField from "../../Form/FormFields/RangeFormField";
import TextAreaFormField from "../../Form/FormFields/TextAreaFormField";
import { DailyRoundsModel } from "../../Patient/models";
import PainChart from "../components/PainChart";
import { logUpdateSection } from "../utils";

export default logUpdateSection({ title: "Vitals" }, ({ log, onChange }) => {
  const heartbeatRhythmChoices = [
    {
      label: "Regular",
      value: "REGULAR",
    },
    {
      label: "Irregular",
      value: "IRREGULAR",
    },
    {
      label: "Unknown",
      value: null,
    },
  ];

  return (
    <div>
      <RangeFormField
        label="Systolic"
        name="systolic"
        onChange={(c) =>
          onChange({ ...log, bp: { ...log.bp, systolic: c.value } })
        }
        value={log.bp?.systolic}
        start={0}
        end={11}
        step={1}
        valueDescriptions={[
          { till: 99, text: "Low", className: "text-red-500" },
          { till: 139, text: "Normal", className: "text-green-500" },
          { text: "High", className: "text-red-500" },
        ]}
      />
      <RangeFormField
        label="Diastolic"
        name="diastolic"
        onChange={(c) =>
          onChange({ ...log, bp: { ...log.bp, diastolic: c.value } })
        }
        value={log.bp?.diastolic}
        start={30}
        end={180}
        step={1}
        valueDescriptions={[
          { till: 49, text: "Low", className: "text-red-500" },
          { till: 89, text: "Normal", className: "text-green-500" },
          { text: "High", className: "text-red-500" },
        ]}
      />
      <RangeFormField
        label="Spo2"
        name="spo2"
        onChange={(c) => onChange({ ...log, ventilator_spo2: c.value })}
        value={log.ventilator_spo2}
        start={0}
        end={100}
        step={1}
        valueDescriptions={[
          { till: 89, text: "Low", className: "text-red-500" },
          { text: "Normal", className: "text-green-500" },
        ]}
      />
      <hr className="my-8 border border-gray-400" />
      <RangeFormField
        label="Temperature"
        name="temperature"
        onChange={(c) => onChange({ ...log, temperature: `${c.value}` })}
        value={Number(log.temperature)}
        start={95}
        end={106}
        step={0.1}
        valueDescriptions={[
          { till: 97.4, text: "Low", className: "text-red-500" },
          { till: 99.6, text: "Normal", className: "text-green-500" },
          { text: "High", className: "text-red-500" },
        ]}
        units={[
          { label: "°F" },
          {
            label: "°C",
            conversionFn: (val) => ((val - 32) * 5) / 9,
            inversionFn: (val) => (val * 9) / 5 + 32,
          },
        ]}
      />
      <RangeFormField
        label="Respiratory Rate (bpm)"
        name="resp"
        onChange={(c) => onChange({ ...log, resp: c.value })}
        value={log.resp}
        start={0}
        end={150}
        step={1}
        valueDescriptions={[
          { till: 11, text: "Low", className: "text-red-500" },
          { till: 16, text: "Normal", className: "text-green-500" },
          { text: "High", className: "text-red-500" },
        ]}
      />
      <PainChart
        pain={
          log.pain_scale_enhanced ||
          [HumanBodyPaths.anterior, HumanBodyPaths.posterior].flatMap((p) =>
            p.map((r) => ({
              region: r.region,
              scale: 0,
              description: "",
            })),
          )
        }
        onChange={(pain) => onChange({ ...log, pain_scale_enhanced: pain })}
      />
      <hr className="my-8 border border-gray-400" />
      <RangeFormField
        label="Spo2"
        name="spo2"
        onChange={(c) => onChange({ ...log, ventilator_spo2: c.value })}
        value={log.ventilator_spo2}
        start={0}
        end={100}
        step={1}
        valueDescriptions={[
          { till: 39, text: "Bradycardia", className: "text-red-500" },
          { till: 100, text: "Normal", className: "text-green-500" },
          { text: "Tachycardia", className: "text-red-500" },
        ]}
      />
      <RadioFormField
        label="Heartbeat Rhythm"
        name="heartbeat-rythm"
        options={heartbeatRhythmChoices}
        optionDisplay={(c) => c.label}
        optionValue={(c) => c.value || ""}
        value={log.rhythm}
        onChange={(c) =>
          onChange({ ...log, rhythm: c.value as DailyRoundsModel["rhythm"] })
        }
      />
      <br />
      <TextAreaFormField
        label="Heartbeat Description"
        name="heartbeat-description"
        value={log.rhythm_detail}
        onChange={(c) => onChange({ ...log, rhythm_detail: c.value })}
      />
    </div>
  );
});
