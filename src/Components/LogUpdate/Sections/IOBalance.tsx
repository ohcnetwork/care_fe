import { Fragment } from "react/jsx-runtime";
import { NameQuantity } from "../../Patient/models";
import { logUpdateSection } from "../utils";
import SelectMenuV2 from "../../Form/SelectMenuV2";
import TextFormField from "../../Form/FormFields/TextFormField";
import ButtonV2 from "../../Common/components/ButtonV2";
import CareIcon from "../../../CAREUI/icons/CareIcon";

export default logUpdateSection(
  { title: "I/O Balance" },
  ({ log, onChange }) => {
    const infusionCollection = [
      "Adrenalin",
      "Nor-adrenalin",
      "Vasopressin",
      "Dopamine",
      "Dobutamine",
    ];
    const ivfluidsCollection = ["RL", "NS", "DNS"];
    const feedsCollection = ["Ryles Tube", "Normal Feed"];
    const outputsCollection = ["Urine", "Rules Tube Aspiration", "ICD"];

    const sections: {
      name: string;
      fields: {
        name: string;
        options: string[];
        key: keyof typeof log;
      }[];
    }[] = [
      {
        name: "Intake",
        fields: [
          {
            name: "Infusions",
            options: infusionCollection,
            key: "infusions",
          },
          {
            name: "IV Fluids",
            options: ivfluidsCollection,
            key: "iv_fluids",
          },
          {
            name: "Feed",
            options: feedsCollection,
            key: "feeds",
          },
        ],
      },
      {
        name: "Outturn",
        fields: [
          {
            name: "Output",
            options: outputsCollection,
            key: "output",
          },
        ],
      },
    ];

    return (
      <div className="flex flex-col gap-8">
        {sections.map(({ name, fields }, k) => (
          <Fragment key={k}>
            <h3 className="font-black">{name}</h3>
            {fields.map((field, i) => (
              <div key={i} className="flex flex-col gap-4">
                <h4>{field.name}</h4>
                {(log[field.key] as NameQuantity[] | undefined)?.map(
                  ({ name, quantity }, j) => (
                    <div key={j} className="flex items-end gap-4">
                      <div className="flex-1">
                        {j == 0 && (
                          <div className="mb-2 text-sm text-gray-800">Type</div>
                        )}
                        <SelectMenuV2
                          options={field.options
                            .filter(
                              (option) =>
                                !(log[field.key] as NameQuantity[] | undefined)
                                  ?.map((f) => f.name)
                                  .includes(option),
                            )
                            .concat(field.options.includes(name) ? [name] : [])}
                          optionLabel={(f) => f}
                          value={name}
                          onChange={(val) =>
                            onChange({
                              ...log,
                              [field.key]: (
                                log[field.key] as NameQuantity[] | undefined
                              )?.map((f, fi) =>
                                j === fi ? { ...f, name: val } : f,
                              ),
                            })
                          }
                          className="w-full"
                        />
                      </div>
                      <TextFormField
                        type="number"
                        name={name + " Quantity"}
                        compact
                        value={quantity.toString()}
                        onChange={(val) =>
                          onChange({
                            ...log,
                            [field.key]: (
                              log[field.key] as NameQuantity[] | undefined
                            )?.map((f, fi) =>
                              j === fi
                                ? { ...f, quantity: parseInt(val.value) }
                                : f,
                            ),
                          })
                        }
                        label={
                          j == 0 && (
                            <div className="text-sm text-gray-800">
                              Quantity
                            </div>
                          )
                        }
                      />
                      <ButtonV2
                        variant="secondary"
                        className="text-lg text-red-500"
                        onClick={() =>
                          onChange({
                            ...log,
                            [field.key]: (
                              log[field.key] as NameQuantity[] | undefined
                            )?.filter((f, fi) => j !== fi),
                          })
                        }
                      >
                        <CareIcon icon="l-trash" />
                      </ButtonV2>
                    </div>
                  ),
                )}
                <ButtonV2
                  variant="secondary"
                  className="bg-gray-200"
                  onClick={() =>
                    onChange({
                      ...log,
                      [field.key]: [
                        ...((log[field.key] as NameQuantity[] | undefined) ||
                          []),
                        { name: null, quantity: 0 },
                      ],
                    })
                  }
                  disabled={
                    field.options.length ===
                    (log[field.key] as NameQuantity[] | undefined)?.length
                  }
                >
                  <CareIcon icon="l-plus" />
                  Add {field.name}
                </ButtonV2>
              </div>
            ))}
            <div className="flex items-center justify-between border-b-2 border-b-gray-400 pb-2">
              <h4>Total</h4>
              <div>
                {fields
                  .flatMap((f) =>
                    ((log[f.key] as NameQuantity[]) || []).map(
                      (f) => f.quantity,
                    ),
                  )
                  .join("+")}
                =
                <span className="text-3xl font-black text-primary-500">
                  {fields
                    .flatMap((f) =>
                      ((log[f.key] as NameQuantity[]) || []).map(
                        (f) => f.quantity,
                      ),
                    )
                    .reduce((a, b) => a + b, 0)}
                </span>
              </div>
            </div>
          </Fragment>
        ))}
        <div className="flex items-center justify-between">
          <h4>I/O Balance</h4>
          <div>
            {sections
              .map((s) =>
                s.fields
                  .flatMap((f) =>
                    ((log[f.key] as NameQuantity[]) || []).map(
                      (f) => f.quantity,
                    ),
                  )
                  .reduce((a, b) => a + b, 0),
              )
              .join("-")}
            =
            <span className="text-3xl font-black text-primary-500">
              {sections
                .map((s) =>
                  s.fields
                    .flatMap((f) =>
                      ((log[f.key] as NameQuantity[]) || []).map(
                        (f) => f.quantity,
                      ),
                    )
                    .reduce((a, b) => a + b, 0),
                )
                .reduce((a, b) => a - b)}
            </span>
          </div>
        </div>
      </div>
    );
  },
);
