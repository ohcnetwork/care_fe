import { useEffect, useState } from "react";
import { IPainScale } from "../../Patient/models";
import RangeFormField from "../../Form/FormFields/RangeFormField";
import HumanBodyChart from "../../../CAREUI/interactive/HumanChart";
import PopupModal from "../../../CAREUI/display/PopupModal";
import TextAreaFormField from "../../Form/FormFields/TextAreaFormField";
import { classNames, getValueDescription } from "../../../Utils/utils";
import { HumanBodyRegion } from "../../../Common/constants";
import { Error } from "../../../Utils/Notifications";

type Props = {
  pain: IPainScale[];
  onChange?: (pain: IPainScale[]) => void;
};

export default function PainChart({ pain, onChange }: Props) {
  const [current, setCurrent] = useState<IPainScale>();

  const valueDescription = (region: IPainScale["region"]) => {
    const scale = pain.find((obj) => obj.region === region)?.scale;
    if (scale != null) {
      return getValueDescription(valueDescriptions, scale);
    }
  };

  return (
    <>
      <RegionEditor
        show={!!current}
        value={current ?? getInitialData("AnteriorAbdomen")}
        onCancel={() => setCurrent(undefined)}
        onSave={
          onChange
            ? (obj) => {
                const mutated = pain.filter((v) => v.region !== obj.region);
                mutated.push(obj);
                onChange(mutated);
              }
            : undefined
        }
      />
      <HumanBodyChart
        onPartSelect={(region) =>
          setCurrent(
            pain.find((o) => o.region === region) ?? getInitialData(region),
          )
        }
        regionColor={(r) => valueDescription(r)?.color || "#ECECEC"}
        regionLabelClassName={(r) =>
          classNames(
            "border transition-all duration-200 ease-in-out",
            valueDescription(r)?.className ||
              "border-secondary-400 bg-secondary-100",
            current?.region === r &&
              "font-bold shadow-lg ring-2 ring-primary-400",
          )
        }
        regionText={(region) =>
          pain.find((p) => p.region === region)?.scale.toString() ?? ""
        }
      />
    </>
  );
}

type RegionEditorProps = {
  show: boolean;
  value: IPainScale;
  onCancel: () => void;
  onSave?: (value: IPainScale) => void;
};

const RegionEditor = (props: RegionEditorProps) => {
  const [value, setValue] = useState(props.value);
  useEffect(() => setValue(props.value), [props.value]);

  const update = (diff: Partial<IPainScale>) => {
    setValue((base) => ({ ...base, ...diff }));
  };

  const valueDescription = getValueDescription(valueDescriptions, value.scale);

  return (
    <PopupModal
      show={props.show}
      onHide={props.onCancel}
      className="flex flex-col items-center gap-4"
      onSubmit={
        props.onSave
          ? () => {
              if (value.scale <= 0) {
                Error({ msg: "Scale must be greater than 0." });
              } else {
                props.onSave?.(value);
              }
            }
          : undefined
      }
    >
      <div className="p-4">
        <h1 className="text-center text-lg font-black">
          {value.region.split(/(?=[A-Z])/).join(" ")}
        </h1>
        <div
          className="text-center"
          style={{
            color: value.scale > 0 ? valueDescription?.color : undefined,
          }}
        >
          <div className="text-5xl font-black">{value.scale}</div>
          <div>{valueDescription?.text}</div>
        </div>
        {props.onSave && (
          <>
            <RangeFormField
              hideInput
              name="pain-scale"
              min={0}
              max={10}
              unit=""
              value={value.scale}
              className="block w-full"
              onChange={({ value }) => update({ scale: value })}
              valueDescriptions={valueDescriptions.map((d) => ({
                ...d,
                text: "",
              }))}
            />
            <TextAreaFormField
              name="description"
              placeholder="Pain Description"
              errorClassName="hidden"
              className="text-sm"
              value={value.description}
              onChange={({ value }) => update({ description: value })}
            />
          </>
        )}
      </div>
    </PopupModal>
  );
};

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

const getInitialData = (region: HumanBodyRegion): IPainScale => ({
  region,
  description: "",
  scale: 0,
});
