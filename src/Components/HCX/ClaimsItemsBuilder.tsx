import CareIcon from "../../CAREUI/icons/CareIcon";
import PROCEDURES from "../../Common/procedures";
import ButtonV2 from "../Common/components/ButtonV2";
import AutocompleteFormField from "../Form/FormFields/Autocomplete";
import FormField, { FieldLabel } from "../Form/FormFields/FormField";
import TextFormField from "../Form/FormFields/TextFormField";
import {
  FieldChangeEvent,
  FormFieldBaseProps,
  useFormFieldPropsResolver,
} from "../Form/FormFields/Utils";
import { HCXItemModel } from "./models";

type Props = FormFieldBaseProps<HCXItemModel[]>;

export default function ClaimsItemsBuilder(props: Props) {
  const field = useFormFieldPropsResolver(props as any);

  const handleUpdate = (index: number) => {
    return (event: FieldChangeEvent<unknown>) => {
      field.handleChange(
        (props.value || [])?.map((obj, i) =>
          i === index ? { ...obj, [event.name]: event.value } : obj
        )
      );
    };
  };

  const handleUpdates = (index: number) => {
    return (updates: HCXItemModel) => {
      field.handleChange(
        (props.value || [])?.map((obj, i) =>
          i === index ? { ...obj, ...updates } : obj
        )
      );
    };
  };

  const handleRemove = (index: number) => {
    return () => {
      field.handleChange((props.value || [])?.filter((obj, i) => i !== index));
    };
  };

  const itemOptions = (current?: HCXItemModel) => {
    if (!current) return PROCEDURES;
    const knownProcedure = PROCEDURES.find((o) => o.code === current.id);
    if (knownProcedure) return PROCEDURES;
    return [{ ...current, code: current.id }, ...PROCEDURES];
  };

  return (
    <FormField field={field}>
      <div className="flex flex-col gap-3">
        {props.value?.map((obj, index) => {
          return (
            <div
              key={index}
              className="border-2 border-gray-200 border-dashed p-4 rounded-lg"
            >
              <div className="flex justify-between items-center">
                <FieldLabel className="!font-bold my-auto">
                  Item {index + 1}
                </FieldLabel>
                {!props.disabled && (
                  <ButtonV2
                    variant="danger"
                    type="button"
                    ghost
                    onClick={handleRemove(index)}
                    disabled={props.disabled}
                  >
                    Delete
                    <CareIcon className="care-l-trash-alt text-lg" />
                  </ButtonV2>
                )}
              </div>

              <div className="p-2 flex flex-row gap-2">
                <AutocompleteFormField
                  className="flex-[3]"
                  required
                  name="id"
                  label="ID"
                  placeholder="Eg. PROCEDURE-001"
                  options={itemOptions(obj)}
                  optionLabel={(o) => o.code}
                  optionDescription={(o) => o.name || ""}
                  optionValue={(o) => o.code}
                  onChange={(event) => {
                    const knownProcedure = PROCEDURES.find(
                      (p) => p.code === event.value
                    );

                    if (knownProcedure) {
                      handleUpdates(index)({
                        id: knownProcedure.code,
                        name: knownProcedure.name || knownProcedure.code,
                        price: knownProcedure.price,
                      });
                    } else {
                      handleUpdate(index)(event);
                    }
                  }}
                  value={obj.id}
                  disabled={props.disabled}
                  errorClassName="hidden"
                />
                <AutocompleteFormField
                  className="flex-[3]"
                  required
                  name="name"
                  label="Name"
                  placeholder="Eg. Knee Replacement"
                  value={obj.name}
                  onChange={(event) => {
                    const knownProcedure = PROCEDURES.find(
                      (p) => p.name === event.value
                    );

                    if (knownProcedure) {
                      handleUpdates(index)({
                        id: knownProcedure.code,
                        name: knownProcedure.name || knownProcedure.code,
                        price: knownProcedure.price,
                      });
                    } else {
                      handleUpdate(index)(event);
                    }
                  }}
                  optionLabel={(o) => o.name || o.code}
                  optionDescription={(o) => o.code}
                  optionValue={(o) => o.name || o.code}
                  disabled={props.disabled}
                  errorClassName="hidden"
                  options={itemOptions(obj)}
                />
                <TextFormField
                  className="flex-[2]"
                  required
                  type="number"
                  name="price"
                  min={0}
                  label="Price"
                  placeholder="0.00"
                  value={obj.price.toString()}
                  onChange={(event) =>
                    handleUpdate(index)({
                      name: event.name,
                      value: parseFloat(event.value),
                    })
                  }
                  disabled={props.disabled}
                  errorClassName="hidden"
                />
              </div>
            </div>
          );
        })}
      </div>
    </FormField>
  );
}
