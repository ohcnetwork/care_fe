import CheckBoxFormField from "@/components/Form/FormFields/CheckBoxFormField";
import TextAreaFormField from "@/components/Form/FormFields/TextAreaFormField";
import { LogUpdateSectionProps } from "@/components/LogUpdate/utils";

import { classNames, getValueDescription } from "@/Utils/utils";

const PupilSizeValueDescriptions = [
  { till: 2, text: "Constricted", color: "red" },
  { till: 6, text: "Normal", color: "green" },
  { till: 8, text: "Dilated", color: "red" },
];

const min = 1;
const max = 8;

export default function PupilSizeSelect({
  log,
  onChange,
  side,
  readonly,
}: LogUpdateSectionProps & { side: "left" | "right" }) {
  const pupilSize = log[`${side}_pupil_size`];
  const detail = log[`${side}_pupil_size_detail`];

  const valueDescription =
    pupilSize != null && min <= pupilSize && pupilSize <= max
      ? getValueDescription(PupilSizeValueDescriptions, pupilSize)
      : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h5>Size</h5>
        <span style={{ color: valueDescription?.color }}>
          {valueDescription?.text}
        </span>
      </div>
      <div
        className={`flex flex-wrap items-center gap-2 ${"" /*invertImage ? "justify-end" : "justify-start"*/}`}
      >
        {Array.from({ length: max - min + 1 }, (_, i) => i + min).map(
          (size) => (
            <button
              disabled={readonly}
              key={size}
              className={classNames(
                "flex aspect-square h-20 flex-col items-center justify-between rounded-lg border py-2 transition-all duration-200 ease-in-out",
                size === pupilSize
                  ? "border-primary-500 bg-primary-100 shadow-md"
                  : "border-secondary-300 bg-white hover:bg-secondary-200",
              )}
              onClick={() => onChange({ [`${side}_pupil_size`]: size })}
            >
              <div
                className="aspect-square rounded-full bg-black transition-all"
                style={{
                  height: "30px",
                  transform: `scale(${0.1 + size / (max - min)})`,
                }}
              />
              {size}
            </button>
          ),
        )}
      </div>
      {/* Rejected, but kept for future reference
            <div className={`flex items-center ${invertImage ? "justify-end" : "justify-start"}`}>
                <div className="relative w-[330px]">
                    <img src="/images/eye2.png" alt="Eye" className={`w-full ${invertImage ? "scale-x-[-1]" : ""}`} />
                    <div
                        className="absolute aspect-square bg-black rounded-full transition-all"
                        style={{
                            height: "50px",
                            transform: `scale(${(pupilSize || 1) / 6})`,
                            bottom: "25%",
                            [invertImage ? "left" : "right"]: "48.5%",
                        }}
                    >
                        <div
                            className="absolute rounded-full bg-white aspect-square w-[10px]"
                            style={{
                                bottom: "10%",
                                right: "10%",
                            }}
                        />
                    </div>
                </div>
            </div>
            */}

      <div
        className={classNames(
          "space-y-2 p-2",
          pupilSize === 0 &&
            "rounded-lg border border-secondary-400 bg-secondary-100",
        )}
      >
        <CheckBoxFormField
          label="Cannot be Assessed"
          name={`${side}_pupil_size_detail_checked`}
          id={`${side}_pupil_size_detail_checked`}
          value={pupilSize === 0}
          onChange={({ value }) =>
            onChange({ [`${side}_pupil_size`]: value ? 0 : undefined })
          }
          errorClassName="hidden"
        />
        {pupilSize === 0 && (
          <TextAreaFormField
            label="Describe size of the Pupil"
            labelClassName="text-sm sm:font-medium"
            name="pupil_size_unknown_reason"
            value={detail || ""}
            onChange={({ value }) =>
              onChange({ [`${side}_pupil_size_detail`]: value })
            }
            disabled={readonly}
          />
        )}
      </div>
    </div>
  );
}
