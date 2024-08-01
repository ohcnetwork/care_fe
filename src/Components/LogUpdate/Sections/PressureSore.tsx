import { useState } from "react";
import PopupModal from "../../../CAREUI/display/PopupModal";
import HumanBodyChart, {
  HumanBody,
} from "../../../CAREUI/interactive/HumanChart";
import { SelectFormField } from "../../Form/FormFields/SelectFormField";
import TextFormField from "../../Form/FormFields/TextFormField";
import TextAreaFormField from "../../Form/FormFields/TextAreaFormField";
import { LogUpdateSectionProps } from "../utils";
import { getValueDescription } from "../../../Utils/utils";

type PressureSore = {
  description: string;
  exudate_amount: string;
  length: number;
  region: HumanBody;
  scale: number;
  tissue_type: string;
  width: number;
};

const PressureSore = ({ log, onChange }: LogUpdateSectionProps) => {
  const getTitle = (text: string) => text.split(/(?=[A-Z])/).join(" ");
  const pressureSore = log.pressure_sore;

  const valueDescriptions = [
    {
      till: 0,
      color: "#ECECEC",
      text: "",
      className: "bg-secondary-300 border border-secondary-400",
    },
    {
      till: 3,
      color: "#FF7000",
      text: "",
      className: "bg-red-400 text-white",
    },
    {
      till: 7,
      color: "#FF0000",
      text: "",
      className: "bg-red-600 text-white",
    },
    {
      till: 10,
      color: "#CF0000",
      text: "",
      className: "bg-red-800 text-white",
    },
  ];

  const [selectedRegion, setSelectedRegion] = useState<HumanBody>();
  const selectedPressureSore = pressureSore?.find(
    (p) => p.region === selectedRegion,
  );
  const selectedValueDescription = getValueDescription(
    valueDescriptions,
    selectedPressureSore?.scale || 0,
  );
  const exudateAmounts = ["None", "Light", "Moderate", "Heavy"];
  const tissueTypes = [
    "Closed",
    "Epithelial",
    "Granulation",
    "Slough",
    "Necrotic",
  ];

  const calculatePushScore = (pressureSore: PressureSore): number => {
    const areaIntervalPoints = [
      0.0, 0.3, 0.6, 1.0, 2.2, 3.0, 4.0, 8.0, 12.0, 24.0,
    ];
    const { length, width, exudate_amount, tissue_type } = pressureSore;

    const area = length * width;

    const getAreaScore = (area: number): number => {
      for (let i = 0; i < areaIntervalPoints.length; i++) {
        if (area <= areaIntervalPoints[i]) {
          return i;
        }
      }
      return 10; // Default value if no interval is found
    };

    const getExudateScore = (amount: typeof exudate_amount): number => {
      const index = exudateAmounts.indexOf(amount);
      return index === -1 ? 0 : index;
    };

    const getTissueScore = (tissue: typeof tissue_type): number => {
      const index = tissueTypes.indexOf(tissue);
      return index === -1 ? 0 : index;
    };

    const areaScore = getAreaScore(area);
    const exudateScore = getExudateScore(exudate_amount);
    const tissueScore = getTissueScore(tissue_type);

    return areaScore + exudateScore + tissueScore;
  };

  const changePressureSore = (value: Partial<PressureSore>) => {
    if (!selectedRegion) return;
    if (!pressureSore?.find((p) => p.region === selectedRegion)) {
      onChange({
        pressure_sore: [
          ...(log.pressure_sore || []),
          {
            region: selectedRegion,
            width: 0,
            length: 0,
            exudate_amount: "None",
            tissue_type: "Closed",
            scale: 1,
            description: "",
            ...value,
          },
        ],
      });
    } else {
      const newPressureSore = pressureSore?.map((p) =>
        p.region === selectedRegion ? { ...p, ...value } : p,
      );
      onChange({ pressure_sore: newPressureSore });
    }
  };

  return (
    <>
      <PopupModal
        show={!!selectedRegion}
        onHide={() => setSelectedRegion(undefined)}
        className={"flex w-[275px] flex-col items-center gap-4"}
        onSubmit={() => setSelectedRegion(undefined)}
      >
        <div className="px-4 pt-4">
          <h1 className="text-center text-lg font-black">
            {getTitle(selectedRegion || "")}
          </h1>
          <br />
          <div className="grid grid-cols-2 gap-2">
            <TextFormField
              label="Width"
              name="width"
              labelClassName="text-xs"
              inputClassName="p-2"
              value={(selectedPressureSore?.width || 0).toString()}
              compact
              onChange={(e) => changePressureSore({ width: parseInt(e.value) })}
            />
            <TextFormField
              label="Length"
              name="length"
              labelClassName="text-xs"
              inputClassName="p-2"
              value={(selectedPressureSore?.length || 0).toString()}
              compact
              onChange={(e) =>
                changePressureSore({ length: parseInt(e.value) })
              }
            />
            <SelectFormField
              options={exudateAmounts}
              optionLabel={(option) => option}
              optionValue={(option) => option}
              labelClassName="text-xs"
              label="Exudate Amount"
              value={selectedPressureSore?.exudate_amount || ""}
              onChange={(value) =>
                changePressureSore({ exudate_amount: value.value })
              }
              compact
              name="exudate-amount"
            />
            <SelectFormField
              options={tissueTypes}
              optionLabel={(option) => option}
              optionValue={(option) => option}
              labelClassName="text-xs"
              label="Tissue Type"
              value={selectedPressureSore?.tissue_type || ""}
              onChange={(value) =>
                changePressureSore({ tissue_type: value.value })
              }
              compact
              name="tissue-type"
            />
          </div>
          <div className="mt-2 w-full">
            <TextAreaFormField
              name="description"
              placeholder="Description"
              className="text-sm"
              value={selectedPressureSore?.description || ""}
              onChange={(e) => changePressureSore({ description: e.value })}
            />
          </div>
          {selectedPressureSore && (
            <div
              className="flex items-center justify-between"
              style={{
                color:
                  (selectedPressureSore?.scale || 0) > 0
                    ? selectedValueDescription?.color
                    : undefined,
              }}
            >
              <div className="font-bold">Push Score</div>
              <div className="text-2xl font-black">
                {calculatePushScore(selectedPressureSore)}
              </div>
            </div>
          )}
        </div>
      </PopupModal>
      <h4>Braden Scale (Risk Severity)</h4>
      <br />
      <HumanBodyChart
        onPartSelect={(region) => setSelectedRegion(region)}
        regionColor={(region) =>
          getValueDescription(
            valueDescriptions,
            pressureSore?.find((p) => p.region === region)?.scale || 0,
          )?.color || "#ECECEC"
        }
        regionLabelClassName={(region) =>
          getValueDescription(
            valueDescriptions,
            pressureSore?.find((p) => p.region === region)?.scale || 0,
          )?.className || ""
        }
        regionText={(region) =>
          pressureSore?.find((p) => p.region === region)?.scale.toString() || ""
        }
      />
    </>
  );
};

PressureSore.meta = {
  title: "Pressure Sore",
  icon: "l-user-md",
} as const;

export default PressureSore;
