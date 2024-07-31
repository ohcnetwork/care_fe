import CheckBoxFormField from "../../Form/FormFields/CheckBoxFormField";
import { getValueDescription } from "../../Form/FormFields/RangeFormField";
import TextAreaFormField from "../../Form/FormFields/TextAreaFormField";

export default function PupilSizeSelect(props: {
  pupilSize: number | null | "UNKNOWN";
  detail: string | null;
  onChange?: (val: number | "UNKNOWN" | null) => void;
  onDetailChange?: (val: string) => void;
  className?: string;
}) {
  const { pupilSize, detail, onChange, onDetailChange, className } = props;

  const min = 1;
  const max = 8;

  const valDes =
    typeof pupilSize === "number"
      ? getValueDescription(
          [
            {
              till: 2,
              text: "Constricted",
              color: "red",
            },
            {
              till: 6,
              text: "Normal",
              color: "green",
            },
            {
              till: 8,
              text: "Dilated",
              color: "red",
            },
          ],
          pupilSize,
        )
      : null;

  return (
    <div className={`flex flex-col ${className} gap-4`}>
      <div className="flex items-center justify-between">
        <h5>Size</h5>
        <span style={{ color: valDes?.color }}>{valDes?.text}</span>
      </div>
      <div
        className={`flex flex-wrap items-center gap-2 ${"" /*invertImage ? "justify-end" : "justify-start"*/}`}
      >
        {Array.from({ length: max - min + 1 }, (_, i) => i + min).map(
          (size) => (
            <button
              disabled={!onChange}
              key={size}
              //className={`h-10 flex items-center justify-center aspect-square rounded-full border border-black/20 ${size === pupilSize ? "bg-secondary-300" : "bg-white"}`}
              className={`flex aspect-square h-20 flex-col items-center justify-between rounded-lg border py-2 transition-all ${size === pupilSize ? "border-primary-500 bg-primary-500/10 bg-secondary-300" : "border-secondary-300 bg-white hover:bg-secondary-200"}`}
              onClick={() => onChange?.(size)}
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
      <div>
        <CheckBoxFormField
          label="Cannot be Assessed"
          name="pupil_reaction"
          value={pupilSize === "UNKNOWN"}
          onChange={({ value }) => onChange?.(value ? "UNKNOWN" : null)}
        />
      </div>
      {pupilSize === "UNKNOWN" && (
        <div>
          <TextAreaFormField
            label="Pupil Size Description"
            name="pupil_size_unknown_reason"
            value={detail || ""}
            onChange={(val) => onDetailChange?.(val.value)}
            disabled={!onDetailChange}
          />
        </div>
      )}
    </div>
  );
}
