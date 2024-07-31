import {
  CONSCIOUSNESS_LEVEL,
  EYE_OPEN_SCALE,
  MOTOR_RESPONSE_SCALE,
  VERBAL_RESPONSE_SCALE,
} from "../../../Common/constants";
import CheckBoxFormField from "../../Form/FormFields/CheckBoxFormField";
import RadioFormField from "../../Form/FormFields/RadioFormField";
import TextAreaFormField from "../../Form/FormFields/TextAreaFormField";
import { DailyRoundsModel } from "../../Patient/models";
import PupilSizeSelect from "../components/PupilSizeSelect";
import {
  LIMB_RESPONSE_OPTIONS,
  logUpdateSection,
  REACTION_OPTIONS,
} from "../utils";

export default logUpdateSection(
  {
    title: "Neurological Monitoring",
    icon: "l-brain",
  },
  ({ log, onChange }) => {
    const limbResponses: (keyof DailyRoundsModel)[] = [
      "limb_response_upper_extremity_left",
      "limb_response_upper_extremity_right",
      "limb_response_lower_extremity_left",
      "limb_response_lower_extremity_right",
    ];

    return (
      <div>
        <div className="mt-4 flex items-center justify-between rounded-lg bg-gray-200 p-4">
          <CheckBoxFormField
            name="in_prone_position"
            label="The patient is in prone position"
            value={log.in_prone_position}
            onChange={(e) => onChange({ in_prone_position: e.value })}
          />
        </div>
        <br />
        <h4>Levels of Consciousness</h4>
        <RadioFormField
          name="consciousness"
          options={CONSCIOUSNESS_LEVEL}
          optionDisplay={(c) => c.text}
          optionValue={(c) => c.id || ""}
          value={log.consciousness_level}
          onChange={(c) =>
            onChange({
              consciousness_level:
                c.value as (typeof CONSCIOUSNESS_LEVEL)[number]["id"],
            })
          }
          containerClassName="grid grid-cols-2 mt-5"
        />
        <hr />
        <div className="flex flex-wrap gap-8">
          {["left", "right"].map((d, i) => (
            <div key={i}>
              <h4 className="capitalize">{d} Pupil</h4>
              <PupilSizeSelect
                pupilSize={
                  log[`${d}_pupil_size` as keyof typeof log.left_pupil_size] ||
                  null
                }
                detail={
                  log[
                    `${d}_pupil_size_detail` as keyof typeof log.left_pupil_size_detail
                  ] || ""
                }
                onChange={(val) =>
                  onChange({
                    [`${d}_pupil_size` as keyof typeof log.left_pupil_size]:
                      val,
                  })
                }
                onDetailChange={(val) =>
                  onChange({
                    [`${d}_pupil_size_detail` as keyof typeof log.left_pupil_size_detail]:
                      val,
                  })
                }
                className="mt-4"
              />
              <br />
              <h5 className="">Reaction</h5>
              <RadioFormField
                options={REACTION_OPTIONS.filter((o) => o.value !== "UNKNOWN")}
                optionDisplay={(c) => c.text}
                optionValue={(c) => c.value}
                name={`${d}_pupil_light_reaction`}
                value={
                  log[
                    `${d}_pupil_light_reaction` as keyof typeof log.left_pupil_light_reaction
                  ]
                }
                onChange={(c) =>
                  onChange({
                    [`${d}_pupil_light_reaction` as keyof typeof log.left_pupil_light_reaction]:
                      c.value,
                  })
                }
                containerClassName=""
              />
              {log[
                `${d}_pupil_light_reaction` as keyof typeof log.left_pupil_light_reaction
              ] === "CANNOT_BE_ASSESSED" && (
                <TextAreaFormField
                  label="Reaction Detail"
                  name={`${d}_pupil_light_reaction_detail`}
                  value={
                    log[
                      `${d}_pupil_light_reaction_detail` as keyof typeof log.left_pupil_light_reaction_detail
                    ]
                  }
                  onChange={(c) =>
                    onChange({
                      [`${d}_pupil_light_reaction_detail` as keyof typeof log.left_pupil_light_reaction_detail]:
                        c.value,
                    })
                  }
                />
              )}
            </div>
          ))}
        </div>
        <hr />
        <div className="flex items-center justify-between">
          <h3>Glasgow Coma Scale</h3>
          <div>
            <span className="text-xs text-gray-700">Total&nbsp;</span>
            <span className="text-5xl font-bold text-primary-400">
              {(log.glasgow_eye_open || 0) +
                (log.glasgow_verbal_response || 0) +
                (log.glasgow_motor_response || 0)}
            </span>
          </div>
        </div>
        <br />
        <div className="flex flex-wrap gap-x-16">
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
            containerClassName="flex flex-col"
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
            containerClassName="flex flex-col"
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
            containerClassName="flex flex-col"
          />
        </div>
        <hr />
        <h3>Limb Response</h3>
        <br />
        <div className="md:grid md:grid-cols-2 md:gap-x-4">
          {limbResponses.map((d, i) => (
            <RadioFormField
              key={i}
              label={
                <b className="capitalize">
                  {d.replaceAll("limb_response_", "").replaceAll("_", " ")}
                </b>
              }
              options={LIMB_RESPONSE_OPTIONS.filter(
                (o) => o.value !== "UNKNOWN",
              )}
              optionDisplay={(c) => c.text}
              optionValue={(c) => c.value}
              name={"limb_response_" + d}
              value={`${log[d]}`}
              onChange={(c) => onChange({ [d]: c.value })}
              containerClassName="flex flex-wrap gap-x-8"
            />
          ))}
        </div>
      </div>
    );
  },
);
