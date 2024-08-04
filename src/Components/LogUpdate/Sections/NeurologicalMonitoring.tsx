import {
  CONSCIOUSNESS_LEVEL,
  EYE_OPEN_SCALE,
  MOTOR_RESPONSE_SCALE,
  VERBAL_RESPONSE_SCALE,
} from "../../../Common/constants";
import CheckBoxFormField from "../../Form/FormFields/CheckBoxFormField";
import RadioFormField from "../../Form/FormFields/RadioFormField";
import TextAreaFormField from "../../Form/FormFields/TextAreaFormField";
import PupilSizeSelect from "../components/PupilSizeSelect";
import {
  LIMB_RESPONSE_OPTIONS,
  LogUpdateSectionMeta,
  LogUpdateSectionProps,
  REACTION_OPTIONS,
} from "../utils";

const NeurologicalMonitoring = ({ log, onChange }: LogUpdateSectionProps) => {
  return (
    <div className="flex flex-col gap-2">
      <div className="mt-4 rounded-lg bg-secondary-100 p-4">
        <CheckBoxFormField
          name="in_prone_position"
          label="The patient is in prone position"
          value={log.in_prone_position}
          onChange={(e) => onChange({ in_prone_position: e.value })}
        />
      </div>
      <br />
      <h4>Level of Consciousness</h4>
      <RadioFormField
        name="consciousness_level"
        options={CONSCIOUSNESS_LEVEL}
        optionDisplay={(c) => c.text}
        optionValue={(c) => c.id}
        value={log.consciousness_level}
        onChange={(c) =>
          onChange({
            consciousness_level:
              c.value as (typeof CONSCIOUSNESS_LEVEL)[number]["id"],
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
                <h4 className="capitalize">{d} Pupil</h4>
                <PupilSizeSelect
                  pupilSize={log[`${d}_pupil_size`]}
                  detail={log[`${d}_pupil_size_detail`]}
                  onChange={(val) => onChange({ [`${d}_pupil_size`]: val })}
                  onDetailChange={(val) =>
                    onChange({ [`${d}_pupil_size_detail`]: val })
                  }
                  className="mt-4"
                />
                <br />
                <h5>Reaction</h5>
                <RadioFormField
                  options={REACTION_OPTIONS.filter(
                    (o) => o.value !== "UNKNOWN",
                  )}
                  optionDisplay={(c) => c.text}
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
        <div>
          <span className="text-xs text-secondary-700">Total&nbsp;</span>
          <span className="text-5xl font-bold text-primary-400">
            {(log.glasgow_eye_open || 0) +
              (log.glasgow_verbal_response || 0) +
              (log.glasgow_motor_response || 0)}
          </span>
        </div>
      </div>
      <div className="space-y-6 pl-2">
        <RadioFormField
          label={<b>Eye Opening Response</b>}
          options={EYE_OPEN_SCALE.toReversed()}
          optionDisplay={(c) => c.value + " - " + c.text}
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
          options={VERBAL_RESPONSE_SCALE.toReversed()}
          optionDisplay={(c) => c.value + " - " + c.text}
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
          options={MOTOR_RESPONSE_SCALE.toReversed()}
          optionDisplay={(c) => c.value + " - " + c.text}
          optionValue={(c) => `${c.value}`}
          name="motor_response"
          value={`${log.glasgow_motor_response}`}
          onChange={(c) =>
            onChange({
              glasgow_motor_response: parseInt(`${c.value}`),
            })
          }
          layout="vertical"
        />
      </div>
      <hr />
      <h3>Limb Response</h3>
      <div className="space-y-4 pl-1">
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
            optionDisplay={(c) => c.text}
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