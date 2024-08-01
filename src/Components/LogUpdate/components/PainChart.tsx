import { useState } from "react";
import { PainScaleLog } from "../../Patient/models";
import RangeFormField from "../../Form/FormFields/RangeFormField";
import HumanBodyChart, {
  HumanBody,
} from "../../../CAREUI/interactive/HumanChart";
import PopupModal from "../../../CAREUI/display/PopupModal";
import TextAreaFormField from "../../Form/FormFields/TextAreaFormField";
import { getValueDescription } from "../../../Utils/utils";

export default function PainChart(props: {
  pain: PainScaleLog[];
  onChange?: (pain: PainScaleLog[]) => void;
}) {
  const { pain, onChange } = props;
  const getTitle = (text: string) => text.split(/(?=[A-Z])/).join(" ");

  const valueDescriptions = [
    {
      till: 0,
      color: "#ECECEC",
      text: "No Pain",
      className: "bg-secondary-300 border border-secondary-400",
    },
    {
      till: 3,
      color: "#FF7000",
      text: "Low",
      className: "bg-red-400 text-white",
    },
    {
      till: 7,
      color: "#FF0000",
      text: "Mild",
      className: "bg-red-600 text-white",
    },
    {
      till: 10,
      color: "#CF0000",
      text: "High",
      className: "bg-red-800 text-white",
    },
  ];

  const [selectedRegion, setSelectedRegion] = useState<HumanBody | null>(null);
  const selectedPain = pain.find((p) => p.region === selectedRegion);
  const selectedValueDescription = getValueDescription(
    valueDescriptions,
    selectedPain?.scale || 0,
  );
  return (
    <>
      <PopupModal
        show={selectedRegion !== null}
        onHide={() => setSelectedRegion(null)}
        className={`flex w-[275px] flex-col items-center gap-4 ${onChange ? "pt-4" : "py-4"}`}
        onSubmit={onChange ? () => setSelectedRegion(null) : undefined}
      >
        <h1 className="text-center text-lg font-black">
          {getTitle(selectedRegion || "")}
        </h1>
        <div
          className="text-center"
          style={{
            color:
              (selectedPain?.scale || 0) > 0
                ? selectedValueDescription?.color
                : undefined,
          }}
        >
          <div className="text-5xl font-black">
            {selectedPain?.scale || "0"}
          </div>
          <div>{selectedValueDescription?.text}</div>
        </div>
        {onChange && (
          <>
            <div className="w-full p-4">
              <RangeFormField
                hideInput
                name="pain-scale"
                min={0}
                max={10}
                value={selectedPain?.scale || 0}
                className="block w-full"
                onChange={(value) => {
                  const newPain: PainScaleLog[] = pain.map((p) =>
                    p.region === selectedRegion
                      ? { ...p, scale: value.value }
                      : p,
                  );
                  onChange?.(newPain);
                }}
                valueDescriptions={valueDescriptions.map((d) => ({
                  ...d,
                  text: "",
                }))}
              />
            </div>
            <div className="w-full px-4">
              <TextAreaFormField
                name="description"
                placeholder="Pain Description"
                className="text-sm"
                value={selectedPain?.description}
                onChange={(e) => {
                  const newPain = pain.map((p) =>
                    p.region === selectedRegion
                      ? { ...p, description: e.value }
                      : p,
                  );
                  onChange?.(newPain);
                }}
              />
            </div>
          </>
        )}
      </PopupModal>
      <HumanBodyChart
        onPartSelect={(region) => setSelectedRegion(region)}
        regionColor={(region) =>
          getValueDescription(
            valueDescriptions,
            pain.find((p) => p.region === region)?.scale || 0,
          )?.color || "#ECECEC"
        }
        regionLabelClassName={(region) =>
          getValueDescription(
            valueDescriptions,
            pain.find((p) => p.region === region)?.scale || 0,
          )?.className || ""
        }
        regionText={(region) =>
          pain.find((p) => p.region === region)?.scale.toString() || ""
        }
      />
    </>
  );
}
