import { useTranslation } from "react-i18next";

import CheckBoxFormField from "@/components/Form/FormFields/CheckBoxFormField";
import RadioFormField from "@/components/Form/FormFields/RadioFormField";
import TextAreaFormField from "@/components/Form/FormFields/TextAreaFormField";
import PupilSizeSelect from "@/components/LogUpdate/components/PupilSizeSelect";
import {
  LogUpdateSectionMeta,
  LogUpdateSectionProps,
} from "@/components/LogUpdate/utils";

import {
  CONSCIOUSNESS_LEVEL,
  EYE_OPEN_SCALE,
  LIMB_RESPONSE_OPTIONS,
  MOTOR_RESPONSE_SCALE,
  PUPIL_REACTION_OPTIONS,
  VERBAL_RESPONSE_SCALE,
} from "@/common/constants";

const NeurologicalMonitoring = ({ log, onChange }: LogUpdateSectionProps) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-2">
      <div className="mt-4 rounded-lg bg-secondary-100 p-4">
        <CheckBoxFormField
          name="in_prone_position"
          label="The patient is in prone position"
          value={log.in_prone_position}
          onChange={(e) => onChange({ in_prone_position: e.value })}
          errorClassName="hidden"
        />
      </div>
      <br />
      <h4>Level of Consciousness</h4>
      <RadioFormField
        name="consciousness_level"
        options={CONSCIOUSNESS_LEVEL}
        optionLabel={(c) => t(`CONSCIOUSNESS_LEVEL__${c.value}`)}
        optionValue={(c) => c.value}
        value={log.consciousness_level}
        onChange={(c) =>
          onChange({
            consciousness_level:
              c.value as (typeof CONSCIOUSNESS_LEVEL)[number]["value"],
          })
        }
        layout="vertical"
      />
      <br />
      <hr />
      <br />
      {!log.in_prone_position && (
        <>
          <h3>Pupil</h3>
          <div className="flex flex-wrap gap-8">
            {(["left", "right"] as const).map((d, i) => (
              <div key={i}>
                <h4 className="mb-4 capitalize">{d} Pupil</h4>
                <PupilSizeSelect log={log} onChange={onChange} side={d} />
                <br />
                <h5>Reaction</h5>
                <RadioFormField
                  options={PUPIL_REACTION_OPTIONS.filter(
                    (o) => o.value !== "UNKNOWN",
                  )}
                  id={`${d}_reaction`}
                  optionLabel={(c) => t(`PUPIL_REACTION__${c.value}`)}
                  optionValue={(c) => c.value}
                  name={`${d}_pupil_light_reaction`}
                  value={log[`${d}_pupil_light_reaction`]}
                  onChange={(c) =>
                    onChange({ [`${d}_pupil_light_reaction`]: c.value })
                  }
                />
                {log[`${d}_pupil_light_reaction`] === "CANNOT_BE_ASSESSED" && (
                  <div className="ml-2">
                    <TextAreaFormField
                      label="Reaction Detail"
                      labelClassName="text-sm sm:font-medium"
                      name={`${d}_pupil_light_reaction_detail`}
                      value={log[`${d}_pupil_light_reaction_detail`]}
                      onChange={(c) =>
                        onChange({
                          [`${d}_pupil_light_reaction_detail`]: c.value,
                        })
                      }
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
          <br />
          <hr />
          <br />
        </>
      )}
      <div className="flex items-center justify-between">
        <h3>Glasgow Coma Scale</h3>
      </div>
      <div className="p-2">
        <RadioFormField
          label={<b>Eye Opening Response</b>}
          options={EYE_OPEN_SCALE}
          optionLabel={(c) => c.value + " - " + c.text}
          optionValue={(c) => `${c.value}`}
          name="eye_opening_response"
          value={`${log.glasgow_eye_open}`}
          onChange={(c) =>
            onChange({ glasgow_eye_open: parseInt(`${c.value}`) })
          }
          layout="vertical"
        />
        <RadioFormField
          label={<b>Verbal Response</b>}
          options={VERBAL_RESPONSE_SCALE}
          optionLabel={(c) => c.value + " - " + c.text}
          optionValue={(c) => `${c.value}`}
          name="verbal_response"
          value={`${log.glasgow_verbal_response}`}
          onChange={(c) =>
            onChange({
              glasgow_verbal_response: parseInt(`${c.value}`),
            })
          }
          layout="vertical"
        />
        <RadioFormField
          label={<b>Motor Response</b>}
          options={MOTOR_RESPONSE_SCALE}
          optionLabel={(c) => c.value + " - " + c.text}
          optionValue={(c) => `${c.value}`}
          name="motor_response"
          value={`${log.glasgow_motor_response}`}
          onChange={(c) =>
            onChange({
              glasgow_motor_response: parseInt(`${c.value}`),
            })
          }
          layout="vertical"
          errorClassName="hidden"
        />
      </div>
      <div className="text-end">
        <span className="text-xs text-secondary-700">Total&nbsp;</span>
        <span className="text-5xl font-bold text-primary-400">
          {(log.glasgow_eye_open || 0) +
            (log.glasgow_verbal_response || 0) +
            (log.glasgow_motor_response || 0)}
        </span>
      </div>
      <hr />
      <h3>Limb Response</h3>
      <div className="p-2">
        {(
          [
            "limb_response_upper_extremity_left",
            "limb_response_upper_extremity_right",
            "limb_response_lower_extremity_left",
            "limb_response_lower_extremity_right",
          ] as const
        ).map((key) => (
          <RadioFormField
            key={key}
            label={
              <span className="font-medium capitalize">
                {key.replaceAll("limb_response_", "").replaceAll("_", " ")}
              </span>
            }
            options={LIMB_RESPONSE_OPTIONS.filter((o) => o.value !== "UNKNOWN")}
            optionLabel={(c) => t(`LIMB_RESPONSE__${c.value}`)}
            optionValue={(c) => c.value}
            name={key}
            value={log[key]}
            onChange={(c) => onChange({ [key]: c.value })}
          />
        ))}
      </div>
    </div>
  );
};

NeurologicalMonitoring.meta = {
  title: "Neurological Monitoring",
  icon: "l-brain",
} as const satisfies LogUpdateSectionMeta;

export default NeurologicalMonitoring;
