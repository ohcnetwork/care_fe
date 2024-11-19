import { Fragment } from "react/jsx-runtime";

import CareIcon from "@/CAREUI/icons/CareIcon";

import ButtonV2 from "@/components/Common/ButtonV2";
import { SelectFormField } from "@/components/Form/FormFields/SelectFormField";
import TextFormField from "@/components/Form/FormFields/TextFormField";
import {
  LogUpdateSectionMeta,
  LogUpdateSectionProps,
} from "@/components/LogUpdate/utils";
import { DailyRoundsModel } from "@/components/Patient/models";

export const IOBalanceSections = [
  {
    name: "Intake",
    fields: [
      {
        name: "Infusions",
        options: [
          "Adrenalin",
          "Noradrenalin",
          "Vasopressin",
          "Dopamine",
          "Dobutamine",
        ],
        key: "infusions",
      },
      {
        name: "IV Fluids",
        options: ["RL", "NS", "DNS"],
        key: "iv_fluids",
      },
      {
        name: "Feed",
        options: ["Ryles Tube", "Normal Feed"],
        key: "feeds",
      },
    ],
  },
  {
    name: "Outturn",
    fields: [
      {
        name: "Output",
        options: ["Urine", "Ryles Tube Aspiration", "ICD", "Abdominal Drain"],
        key: "output",
      },
    ],
  },
] satisfies {
  name: string;
  fields: {
    name: string;
    options: string[];
    key: keyof DailyRoundsModel;
  }[];
}[];

const IOBalance = ({ log, onChange }: LogUpdateSectionProps) => {
  return (
    <div className="flex flex-col gap-8">
      {IOBalanceSections.map(({ name, fields }, k) => (
        <Fragment key={k}>
          <h3 className="font-black">{name}</h3>
          {fields.map((field, i) => (
            <div key={i} className="flex flex-col gap-4">
              <h4>{field.name}</h4>
              {log[field.key]?.map(({ name, quantity }, j) => (
                <div key={j} className="flex items-end gap-4">
                  <div className="flex-1">
                    {j == 0 && (
                      <div className="mb-2 text-sm text-secondary-800">
                        Type
                      </div>
                    )}
                    <SelectFormField
                      name="name"
                      options={field.options
                        .filter(
                          (option) =>
                            !log[field.key]
                              ?.map((f) => f.name)
                              .includes(option),
                        )
                        .concat(field.options.includes(name) ? [name] : [])}
                      optionLabel={(f) => f}
                      value={name}
                      onChange={({ value }) =>
                        onChange({
                          [field.key]: log[field.key]?.map((f, fi) =>
                            j === fi ? { ...f, name: value } : f,
                          ),
                        })
                      }
                      className="w-full"
                      errorClassName="hidden"
                    />
                  </div>
                  <TextFormField
                    type="number"
                    min={0}
                    errorClassName="hidden"
                    name={name + " Quantity"}
                    value={quantity.toString()}
                    onChange={(val) =>
                      onChange({
                        [field.key]: log[field.key]?.map((f, fi) =>
                          j === fi
                            ? { ...f, quantity: parseInt(val.value) }
                            : f,
                        ),
                      })
                    }
                    label={
                      j == 0 && (
                        <div className="text-sm text-secondary-800">
                          Quantity (ml)
                        </div>
                      )
                    }
                  />
                  <ButtonV2
                    variant="secondary"
                    className="text-lg text-red-500"
                    onClick={() =>
                      onChange({
                        [field.key]: log[field.key]?.filter(
                          (f, fi) => j !== fi,
                        ),
                      })
                    }
                  >
                    <CareIcon icon="l-trash" />
                  </ButtonV2>
                </div>
              ))}
              <ButtonV2
                variant="secondary"
                className="bg-secondary-200"
                onClick={() =>
                  onChange({
                    [field.key]: [
                      ...(log[field.key] || []),
                      { name: null, quantity: 0 },
                    ],
                  })
                }
                disabled={field.options.length === log[field.key]?.length}
              >
                <CareIcon icon="l-plus" />
                Add {field.name}
              </ButtonV2>
            </div>
          ))}
          <div className="flex items-center justify-between border-b-2 border-b-secondary-400 pb-2">
            <h4>Total</h4>
            <div>
              {fields
                .flatMap((f) => (log[f.key] || []).map((f) => f.quantity))
                .join("+")}
              =
              <span className="text-3xl font-black text-primary-500">
                {fields
                  .flatMap((f) => (log[f.key] || []).map((f) => f.quantity))
                  .reduce((a, b) => a + b, 0)}{" "}
                ml
              </span>
            </div>
          </div>
        </Fragment>
      ))}
      <div className="flex items-center justify-between">
        <h4>I/O Balance</h4>
        <div>
          {IOBalanceSections.map((s) =>
            s.fields
              .flatMap((f) => (log[f.key] || []).map((f) => f.quantity))
              .reduce((a, b) => a + b, 0),
          ).join("-")}
          =
          <span className="text-3xl font-black text-primary-500">
            {IOBalanceSections.map((s) =>
              s.fields
                .flatMap((f) => (log[f.key] || []).map((f) => f.quantity))
                .reduce((a, b) => a + b, 0),
            ).reduce((a, b) => a - b)}{" "}
            ml
          </span>
        </div>
      </div>
    </div>
  );
};

IOBalance.meta = {
  title: "I/O Balance",
  icon: "l-balance-scale",
} as const satisfies LogUpdateSectionMeta;

export default IOBalance;
