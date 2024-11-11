import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import PopupModal from "@/CAREUI/display/PopupModal";
import HumanBodyChart from "@/CAREUI/interactive/HumanChart";

import { SelectFormField } from "@/components/Form/FormFields/SelectFormField";
import TextAreaFormField from "@/components/Form/FormFields/TextAreaFormField";
import TextFormField from "@/components/Form/FormFields/TextFormField";
import { calculatePushScore } from "@/components/LogUpdate/Sections/PressureSore/utils";
import {
  LogUpdateSectionMeta,
  LogUpdateSectionProps,
} from "@/components/LogUpdate/utils";
import { IPressureSore } from "@/components/Patient/models";

import {
  HumanBodyRegion,
  PressureSoreExudateAmountOptions,
  PressureSoreTissueTypeOptions,
} from "@/common/constants";

import { Error } from "@/Utils/Notifications";
import { classNames, getValueDescription } from "@/Utils/utils";

const PressureSore = ({ log, onChange, readonly }: LogUpdateSectionProps) => {
  const value = log.pressure_sore ?? [];
  const containerRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState<IPressureSore>();

  const regionPushScore = (region: IPressureSore["region"]) => {
    const obj = value.find((obj) => obj.region === region);
    if (obj) {
      return calculatePushScore(obj);
    }
  };

  const valueDescription = (region: IPressureSore["region"]) => {
    const pushScore = regionPushScore(region);
    if (pushScore != null) {
      return getValueDescription(valueDescriptions, pushScore);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <RegionEditor
        show={!!current}
        anchorRef={containerRef}
        value={current ?? getRegionInitialData("AnteriorAbdomen")}
        onCancel={() => setCurrent(undefined)}
        onSave={
          readonly
            ? undefined
            : (obj) => {
                const pressure_sore = value.filter(
                  (v) => v.region !== obj.region,
                );
                pressure_sore.push(obj);
                onChange({ pressure_sore });
                setCurrent(undefined);
              }
        }
      />
      <h4>Braden Scale (Risk Severity)</h4>
      <br />
      <HumanBodyChart
        onPartSelect={(region) => {
          setCurrent(
            value.find((o) => o.region === region) ??
              getRegionInitialData(region),
          );
        }}
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
        regionText={(r) => regionPushScore(r)?.toString() ?? ""}
      />
    </div>
  );
};

PressureSore.meta = {
  title: "Pressure Sore",
  icon: "l-user-md",
} as const satisfies LogUpdateSectionMeta;

export default PressureSore;

type RegionEditorProps = {
  show: boolean;
  value: IPressureSore;
  anchorRef: React.RefObject<HTMLElement>;
  onCancel: () => void;
  onSave?: (value: IPressureSore) => void;
};

const RegionEditor = (props: RegionEditorProps) => {
  const [value, setValue] = useState(props.value);
  useEffect(() => setValue(props.value), [props.value]);

  const update = (diff: Partial<IPressureSore>) => {
    setValue((base) => ({ ...base, ...diff }));
  };

  const isReadOnly = !props.onSave;

  const { t } = useTranslation();

  return (
    <PopupModal
      show={props.show}
      onHide={props.onCancel}
      anchorRef={props.anchorRef}
      className="flex w-72 flex-col items-center gap-4"
      onSubmit={
        props.onSave
          ? () => {
              if (value.width <= 0 || value.length <= 0) {
                Error({ msg: "Width & Length must be greater than 0." });
              } else {
                props.onSave?.(value);
              }
            }
          : undefined
      }
    >
      <div className="px-4 pt-4">
        <h1 className="text-center text-lg font-black">
          {value.region.split(/(?=[A-Z])/).join(" ")}
        </h1>
        <br />
        <div className="grid grid-cols-2 gap-2">
          <TextFormField
            label={t("width", { unit: "cm" })}
            name="width"
            disabled={isReadOnly}
            labelClassName="text-xs"
            inputClassName="p-2"
            min={0}
            step={0.1}
            type="number"
            value={`${value.width}`}
            onChange={(e) => update({ width: parseFloat(e.value) })}
          />
          <TextFormField
            label={t("length", { unit: "cm" })}
            name="length"
            disabled={isReadOnly}
            labelClassName="text-xs"
            inputClassName="p-2"
            min={0}
            step={0.1}
            type="number"
            value={`${value.length}`}
            onChange={(e) => update({ length: parseFloat(e.value) })}
          />
          <SelectFormField
            options={PressureSoreExudateAmountOptions}
            optionLabel={(o) => o}
            optionValue={(o) => o}
            disabled={isReadOnly}
            labelClassName="text-xs"
            label="Exudate Amount"
            value={value.exudate_amount}
            onChange={({ value }) => update({ exudate_amount: value })}
            name="exudate_amount"
          />
          <SelectFormField
            options={PressureSoreTissueTypeOptions}
            optionLabel={(o) => o}
            optionValue={(o) => o}
            disabled={isReadOnly}
            labelClassName="text-xs"
            label="Tissue Type"
            value={value.tissue_type}
            onChange={({ value }) => update({ tissue_type: value })}
            name="tissue_type"
          />
        </div>
        <div className="mt-2 w-full">
          <TextAreaFormField
            name="description"
            disabled={isReadOnly}
            placeholder="Description"
            className="text-sm"
            value={value.description}
            onChange={(e) => update({ description: e.value })}
          />
        </div>

        <div
          className="flex items-center justify-between"
          style={{
            color: getValueDescription(valueDescriptions, value.scale)?.color,
          }}
        >
          <div className="font-bold">Push Score: </div>
          <div className="text-2xl font-black">{calculatePushScore(value)}</div>
        </div>
      </div>
    </PopupModal>
  );
};

const valueDescriptions = [
  {
    till: 0,
    color: "#ECECEC",
    text: "",
    className: "bg-secondary-300 border border-secondary-400",
  },
  {
    till: 3,
    color: "#f87171",
    text: "",
    className: "bg-red-400 text-white border border-secondary-400",
  },
  {
    till: 7,
    color: "#dc2626",
    text: "",
    className: "bg-red-600 text-white border border-secondary-400",
  },
  {
    till: 17,
    color: "#991b1b",
    text: "",
    className: "bg-red-800 text-white border border-secondary-400",
  },
];

const getRegionInitialData = (region: HumanBodyRegion): IPressureSore => ({
  region,
  width: 0,
  length: 0,
  exudate_amount: "None",
  tissue_type: "Closed",
  description: "",
  scale: 1,
});
